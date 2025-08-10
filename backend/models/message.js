// models/message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  wa_id: String,
  name: String,
  msg_id: String,
  text: String,
  timestamp: Date,
  status: String,
  outgoing: { type: Boolean, default: false }, // ✅ Make sure this is here
  favorite: Boolean,
  group: Boolean,
  participants: Number,
  unread: Number
});

module.exports = mongoose.model('Message', messageSchema);