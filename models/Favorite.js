const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emotionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emotion',
    required: true
  },
  emotion: {
    type: String,
    required: true,
    enum: ['happy', 'love', 'sleep', 'crying', 'angry', 'excited']
  },
  youtubeVideoId: {
    type: String,
    required: true,
    length: 11
  },
  videoTitle: {
    type: String,
    required: true
  },
  channelTitle: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false,
  collection: 'favorites'
});

favoriteSchema.index({ userId: 1 });
favoriteSchema.index({ emotionId: 1 });
favoriteSchema.index({ emotion: 1 });
favoriteSchema.index({ userId: 1, emotion: 1 });
favoriteSchema.index({ userId: 1, savedAt: -1 });

// 중복 방지
favoriteSchema.index({ userId: 1, youtubeVideoId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
