const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'users'
});

userSchema.index({ nickname: 1 }, { unique: true });
module.exports = mongoose.model('User', userSchema);