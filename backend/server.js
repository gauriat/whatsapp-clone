// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Message = require('./models/message');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ DB Connection Error:", err));

/**
 * GET /chats
 * Returns all unique chats grouped by wa_id with last message preview
 */
app.get('/chats', async (req, res) => {
  try {
    const chats = await Message.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$wa_id',
          name: { $first: '$name' },
          favorite: { $first: '$favorite' },
          group: { $first: '$group' },
          participants: { $first: '$participants' },
          unread: { $first: '$unread' },
          lastMessage: { $first: '$text' },
          lastTimestamp: { $first: '$timestamp' }
        }
      },
      { $sort: { lastTimestamp: -1 } }
    ]);

    res.json(chats.map(c => ({
      wa_id: c._id,
      name: c.name,
      favorite: c.favorite || false,
      group: c.group || false,
      participants: c.participants || (c.group ? 3 : undefined),
      unread: c.unread || 0,
      lastMessage: c.lastMessage,
      lastTimestamp: c.lastTimestamp
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /messages/:wa_id
 * Returns all messages for a chat sorted by timestamp
 */
app.get('/messages/:wa_id', async (req, res) => {
  try {
    const messages = await Message.find({ wa_id: req.params.wa_id })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /messages/:wa_id
 * Adds a new outgoing message with real contact name preserved
 */
app.post('/messages/:wa_id', async (req, res) => {
  try {
    // Find last message for this contact to get the real name
    const lastMsg = await Message.findOne({ wa_id: req.params.wa_id }).sort({ timestamp: -1 });

    if (!lastMsg) {
      return res.status(404).json({ error: "Contact not found" });
    }

    const newMsg = await Message.create({
      wa_id: req.params.wa_id,
      name: lastMsg.name,         // Keep actual contact name
      msg_id: `local-${Date.now()}`,
      text: req.body.text,
      timestamp: new Date(),
      status: 'sent',
      outgoing: true              // Mark as sent by you
    });

    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));