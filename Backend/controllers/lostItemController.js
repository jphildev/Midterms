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

// @desc    Get all lost items (newest first)
// @route   GET /api/lost-items
// @query   category, status, page (default 1), limit (default 20, max 100)
const getLostItems = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};

    if (category !== undefined) {
      if (!LostItem.CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Use one of: ${LostItem.CATEGORIES.join(', ')}`,
        });
      }
      filter.category = category;
    }

    if (status !== undefined) {
      if (!LostItem.STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Use one of: ${LostItem.STATUSES.join(', ')}`,
        });
      }
      filter.status = status;
    }

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
  } catch (error) {
    console.error('getLostItems error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching lost items' });
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

module.exports = { createLostItem, getLostItems, getLostItemById };
