const mongoose = require('mongoose');
const emotionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emotion: {
    type: String,
    required: true,
    enum: ['happy', 'love', 'sleep', 'crying', 'angry', 'excited']
  },
  emoji: {
    type: String,
    required: true
  },
  memo: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false,
  collection: 'emotions'
});

emotionSchema.index({ userId: 1 });
emotionSchema.index({ timestamp: -1 });
emotionSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Emotion', emotionSchema);