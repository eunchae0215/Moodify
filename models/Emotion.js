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
}, {
  timestamps: true,
  collection: 'emotions'
});

emotionSchema.index({ userId: 1 });
emotionSchema.index({ createdAt: -1 });
emotionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Emotion', emotionSchema);