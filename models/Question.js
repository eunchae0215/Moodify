const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  userID: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
}, {
  timestamps: true,
  collection: 'qnas'
});

module.exports = mongoose.model('Question', questionSchema);
