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

module.exports = { createLostItem };
