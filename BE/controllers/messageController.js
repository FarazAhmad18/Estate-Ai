const { Op } = require('sequelize');
const { Conversation, Message, User, Property, PropertyImage } = require('../models');

// POST /api/conversations — create or get existing conversation
const createConversation = async (req, res) => {
  try {
    const buyer_id = req.user.id;
    const { property_id, agent_id } = req.body;

    if (!property_id || !agent_id) {
      return res.status(400).json({ error: 'property_id and agent_id are required' });
    }

    if (buyer_id === agent_id) {
      return res.status(400).json({ error: 'Cannot start a conversation with yourself' });
    }

    // Verify property exists and belongs to the agent
    const property = await Property.findByPk(property_id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (property.agent_id !== agent_id) {
      return res.status(400).json({ error: 'Agent does not own this property' });
    }

    const [conversation, created] = await Conversation.findOrCreate({
      where: { property_id, buyer_id, agent_id },
      defaults: { property_id, buyer_id, agent_id },
    });

    res.status(created ? 201 : 200).json({ conversation });
  } catch (err) {
    console.error('createConversation error:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

// GET /api/conversations/:id — get a single conversation by ID
const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    const conversation = await Conversation.findByPk(conversationId, {
      include: [
        { model: User, as: 'Buyer', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'Agent', attributes: ['id', 'name', 'avatar_url'] },
        {
          model: Property,
          attributes: ['id', 'location', 'price', 'type', 'purpose'],
          include: [{ model: PropertyImage, attributes: ['image_url'], limit: 1 }],
        },
      ],
    });

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.buyer_id !== userId && conversation.agent_id !== userId) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    res.json({ conversation });
  } catch (err) {
    console.error('getConversation error:', err);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
};

// GET /api/conversations — list user's conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [{ buyer_id: userId }, { agent_id: userId }],
      },
      include: [
        { model: User, as: 'Buyer', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'Agent', attributes: ['id', 'name', 'avatar_url'] },
        {
          model: Property,
          attributes: ['id', 'location', 'price', 'type', 'purpose'],
          include: [{ model: PropertyImage, attributes: ['image_url'], limit: 1 }],
        },
        {
          model: Message,
          attributes: ['id', 'body', 'sender_id', 'read', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: 1,
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    // Compute unread count per conversation and attach last message
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.count({
          where: {
            conversation_id: conv.id,
            sender_id: { [Op.ne]: userId },
            read: false,
          },
        });

        const plain = conv.toJSON();
        plain.unreadCount = unreadCount;
        plain.lastMessage = plain.Messages?.[0] || null;
        delete plain.Messages;
        return plain;
      })
    );

    // Sort by last message time (most recent first)
    result.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.updatedAt;
      const bTime = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(bTime) - new Date(aTime);
    });

    // Only return conversations that have at least 1 message
    const filtered = result.filter((c) => c.lastMessage !== null);

    res.json({ conversations: filtered });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
};

// GET /api/conversations/:id/messages — paginated messages
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    // Verify participant
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.buyer_id !== userId && conversation.agent_id !== userId) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    // Mark other party's unread messages as read
    const [updatedCount] = await Message.update(
      { read: true },
      {
        where: {
          conversation_id: conversationId,
          sender_id: { [Op.ne]: userId },
          read: false,
        },
      }
    );

    // Emit messages_read event to the other party
    if (updatedCount > 0) {
      const io = req.app.get('io');
      const otherUserId = conversation.buyer_id === userId ? conversation.agent_id : conversation.buyer_id;
      if (io) {
        io.to(`user_${otherUserId}`).emit('messages_read', {
          conversationId: parseInt(conversationId),
        });
      }
    }

    const messages = await Message.findAndCountAll({
      where: { conversation_id: conversationId },
      include: [{ model: User, as: 'Sender', attributes: ['id', 'name', 'avatar_url'], required: false }],
      order: [['createdAt', 'ASC']],
      limit,
      offset,
    });

    res.json({
      messages: messages.rows,
      total: messages.count,
      limit,
      offset,
    });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

// POST /api/conversations/:id/messages — send a message
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Message body is required' });
    }
    if (body.length > 5000) {
      return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
    }

    // Verify participant
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.buyer_id !== userId && conversation.agent_id !== userId) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const message = await Message.create({
      conversation_id: conversationId,
      sender_id: userId,
      body: body.trim(),
    });

    // Update conversation updatedAt
    await conversation.update({ updatedAt: new Date() });

    // Fetch with sender info
    const fullMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'Sender', attributes: ['id', 'name', 'avatar_url'], required: false }],
    });

    // Emit to recipient via Socket.io
    const io = req.app.get('io');
    const recipientId = conversation.buyer_id === userId ? conversation.agent_id : conversation.buyer_id;
    if (io) {
      io.to(`user_${recipientId}`).emit('new_message', {
        message: fullMessage.toJSON(),
        conversationId: parseInt(conversationId),
      });
    }

    res.status(201).json({ message: fullMessage });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// GET /api/messages/unread-count — total unread for logged-in user
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all conversations the user is part of
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [{ buyer_id: userId }, { agent_id: userId }],
      },
      attributes: ['id'],
    });

    const conversationIds = conversations.map((c) => c.id);
    if (conversationIds.length === 0) return res.json({ unreadCount: 0 });

    const unreadCount = await Message.count({
      where: {
        conversation_id: { [Op.in]: conversationIds },
        sender_id: { [Op.ne]: userId },
        read: false,
      },
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// POST /api/conversations/:id/read — mark messages as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.buyer_id !== userId && conversation.agent_id !== userId) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const [updatedCount] = await Message.update(
      { read: true },
      {
        where: {
          conversation_id: conversationId,
          sender_id: { [Op.ne]: userId },
          read: false,
        },
      }
    );

    if (updatedCount > 0) {
      const io = req.app.get('io');
      const otherUserId = conversation.buyer_id === userId ? conversation.agent_id : conversation.buyer_id;
      if (io) {
        io.to(`user_${otherUserId}`).emit('messages_read', {
          conversationId: parseInt(conversationId),
        });
      }
    }

    res.json({ success: true, updatedCount });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// DELETE /api/conversations/:convId/messages/:msgId — delete a message
const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { convId, msgId } = req.params;

    const conversation = await Conversation.findByPk(convId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.buyer_id !== userId && conversation.agent_id !== userId) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const message = await Message.findByPk(msgId);
    if (!message || message.conversation_id !== parseInt(convId)) {
      return res.status(404).json({ error: 'Message not found' });
    }
    if (message.sender_id !== userId) {
      return res.status(403).json({ error: 'Can only delete your own messages' });
    }

    await message.destroy();

    const io = req.app.get('io');
    const recipientId = conversation.buyer_id === userId ? conversation.agent_id : conversation.buyer_id;
    if (io) {
      io.to(`user_${recipientId}`).emit('message_deleted', {
        messageId: parseInt(msgId),
        conversationId: parseInt(convId),
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

module.exports = { createConversation, getConversation, getConversations, getMessages, sendMessage, getUnreadCount, markAsRead, deleteMessage };
