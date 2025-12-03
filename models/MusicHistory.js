const mongoose = require('mongoose');
const musicHistorySchema = new mongoose.Schema({
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
  liked: {
    type: Boolean,
    default: false
  },
  playedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false,
  collection: 'music_history'
});

musicHistorySchema.index({ userId: 1 });
musicHistorySchema.index({ emotionId: 1 });
musicHistorySchema.index({ playedAt: -1 });
musicHistorySchema.index({ userId: 1, playedAt: -1 });  
musicHistorySchema.index({ userId: 1, liked: 1 }); 

module.exports = mongoose.model('MusicHistory', musicHistorySchema);