const mongoose = require('mongoose');

const User = require('./User');
const Emotion = require('./Emotion');
const MusicHistory = require('./MusicHistory');
const Question = require('./Question');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moodify', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('DB 연결 성공');
  } catch (error) {
    console.error('DB 연결 실패:', error);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  User,
  Emotion,
  MusicHistory,
  Question
};