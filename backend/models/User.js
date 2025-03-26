const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Şifre doğrulama metodu - basitleştirilmiş
UserSchema.methods.matchPassword = async function(enteredPassword) {
  // Doğrudan şifre karşılaştırması yap
  return this.password === enteredPassword;
};

module.exports = mongoose.model('User', UserSchema);