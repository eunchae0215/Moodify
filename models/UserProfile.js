const mongoose = require('mongoose');

/**
 * UserProfile Schema
 * 사용자의 음악 취향 벡터를 저장하는 컬렉션
 */
const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // TF-IDF 취향 벡터 (단어: 가중치)
  profileVector: {
    type: Map,
    of: Number,
    default: {}
  },
  // 최근 업데이트된 날짜
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // 프로필 생성에 사용된 음악 개수
  musicCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'user_profiles'
});

// 인덱스
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('UserProfile', userProfileSchema);
