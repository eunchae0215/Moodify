const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
