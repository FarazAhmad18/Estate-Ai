const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/authMiddleware');
const {
  createConversation,
  getConversation,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
  markAsRead,
  deleteMessage,
} = require('../controllers/messageController');

// In-memory rate limiter for message sends
const rateLimits = new Map();
function messageRateLimit(req, res, next) {
  const userId = req.user.id;
  const now = Date.now();
  const window = 10000; // 10 seconds
  const max = 20;
  const timestamps = (rateLimits.get(userId) || []).filter(t => now - t < window);
  if (timestamps.length >= max) return res.status(429).json({ error: 'Too many messages' });
  timestamps.push(now);
  rateLimits.set(userId, timestamps);
  next();
}

router.post('/conversations', auth, createConversation);
router.get('/conversations', auth, getConversations);
router.get('/conversations/:id', auth, getConversation);
router.get('/conversations/:id/messages', auth, getMessages);
router.post('/conversations/:id/messages', auth, messageRateLimit, sendMessage);
router.post('/conversations/:id/read', auth, markAsRead);
router.delete('/conversations/:convId/messages/:msgId', auth, deleteMessage);
router.get('/messages/unread-count', auth, getUnreadCount);

module.exports = router;
