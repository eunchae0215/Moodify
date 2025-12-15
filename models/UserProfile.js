const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profileVector: {
    type: Map,
    of: Number,
    default: {}
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  musicCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'user_profiles'
});

userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('UserProfile', userProfileSchema);
