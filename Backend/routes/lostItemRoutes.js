const express = require('express');
const {
  createLostItem,
  getLostItems,
  searchLostItems,
  getLostItemById,
} = require('../controllers/lostItemController');

const router = express.Router();

// Mounted at /api/lost-items
router.post('/', createLostItem);
router.get('/', getLostItems);
router.get('/search', searchLostItems); // must stay above /:id
router.get('/:id', getLostItemById);

module.exports = router;
