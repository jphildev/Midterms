const mongoose = require('mongoose');
const LostItem = require('../models/LostItem');

// Fields a client is allowed to set when reporting a lost item.
// status is left out on purpose: new reports always start as "lost".
const CREATE_FIELDS = [
  'itemName',
  'description',
  'category',
  'location',
  'dateLost',
  'contactName',
  'contactInfo',
  'imageUrl',
];

// @desc    Create a new lost item report
// @route   POST /api/lost-items
const createLostItem = async (req, res) => {
  try {
    const body = req.body || {};
    const data = {};
    CREATE_FIELDS.forEach((field) => {
      if (body[field] !== undefined) data[field] = body[field];
    });

    const lostItem = await LostItem.create(data);

    res.status(201).json({
      success: true,
      message: 'Lost item reported successfully',
      data: lostItem,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      const toMessage = (err) =>
        err.name === 'CastError' ? `${err.path} has an invalid value` : err.message;
      const errors = error.errors
        ? Object.values(error.errors).map(toMessage)
        : [toMessage(error)];
      return res.status(400).json({ success: false, message: 'Invalid lost item data', errors });
    }

    console.error('createLostItem error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating lost item' });
  }
};

// Builds a MongoDB filter from the optional category/status query params.
// Returns { error } with a message when a value is not allowed.
const buildFilter = ({ category, status }) => {
  const filter = {};

  if (category !== undefined) {
    if (!LostItem.CATEGORIES.includes(category)) {
      return { error: `Invalid category. Use one of: ${LostItem.CATEGORIES.join(', ')}` };
    }
    filter.category = category;
  }

  if (status !== undefined) {
    if (!LostItem.STATUSES.includes(status)) {
      return { error: `Invalid status. Use one of: ${LostItem.STATUSES.join(', ')}` };
    }
    filter.status = status;
  }

  return { filter };
};

// Runs a paginated, newest-first query and sends the list response.
const sendPaginated = async (req, res, filter) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const [items, total] = await Promise.all([
    LostItem.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    LostItem.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: items.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: items,
  });
};

// Escapes characters that have a special meaning in regular expressions,
// so a search like "c++" or "(blue)" is treated as plain text.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all lost items (newest first)
// @route   GET /api/lost-items
// @query   category, status, page (default 1), limit (default 20, max 100)
const getLostItems = async (req, res) => {
  try {
    const { filter, error } = buildFilter(req.query);
    if (error) return res.status(400).json({ success: false, message: error });

    await sendPaginated(req, res, filter);
  } catch (error) {
    console.error('getLostItems error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching lost items' });
  }
};

// @desc    Search lost items by keyword (partial, case-insensitive)
//          in itemName, description and location
// @route   GET /api/lost-items/search
// @query   q (required), category, status, page, limit
const searchLostItems = async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search keyword (q) is required' });
    }
    if (q.length > 100) {
      return res.status(400).json({ success: false, message: 'Search keyword must not exceed 100 characters' });
    }

    const { filter, error } = buildFilter(req.query);
    if (error) return res.status(400).json({ success: false, message: error });

    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ itemName: pattern }, { description: pattern }, { location: pattern }];

    await sendPaginated(req, res, filter);
  } catch (error) {
    console.error('searchLostItems error:', error);
    res.status(500).json({ success: false, message: 'Server error while searching lost items' });
  }
};

// @desc    Get a single lost item by id
// @route   GET /api/lost-items/:id
const getLostItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lost item id' });
    }

    const lostItem = await LostItem.findById(id);
    if (!lostItem) {
      return res.status(404).json({ success: false, message: 'Lost item not found' });
    }

    res.status(200).json({ success: true, data: lostItem });
  } catch (error) {
    console.error('getLostItemById error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching lost item' });
  }
};

module.exports = { createLostItem, getLostItems, searchLostItems, getLostItemById };
