const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
    trim: true
  },
  userID:{
    type: String,
    required: true
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