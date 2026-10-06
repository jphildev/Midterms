const express = require('express');
const { createLostItem } = require('../controllers/lostItemController');

const router = express.Router();

// Mounted at /api/lost-items
router.post('/', createLostItem);

module.exports = router;
