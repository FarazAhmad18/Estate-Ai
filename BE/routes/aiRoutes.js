const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { generateDescription, chat } = require('../controllers/aiController');

router.post('/generate-description', auth, requireRole('Agent'), generateDescription);
router.post('/chat', chat);

module.exports = router;
