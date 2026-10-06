const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Accessories',
  'Documents',
  'Keys',
  'Bags',
  'Others',
];

const STATUSES = ['lost', 'found', 'claimed'];

const lostItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name must not exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters'],
    },
    category: {
      type: String,
      enum: { values: CATEGORIES, message: '{VALUE} is not a valid category' },
      default: 'Others',
    },
    location: {
      type: String,
      required: [true, 'Location where the item was lost is required'],
      trim: true,
    },
    dateLost: {
      type: Date,
      required: [true, 'Date lost is required'],
    },
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
    },
    contactInfo: {
      type: String,
      required: [true, 'Contact info (email or phone) is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: '{VALUE} is not a valid status' },
      default: 'lost',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Text index used by the search API (LOST-BE-04)
lostItemSchema.index({ itemName: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('LostItem', lostItemSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;
