const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isSuperAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Şifre doğrulama metodu
User.prototype.matchPassword = async function(enteredPassword) {
  return this.password === enteredPassword;
};

module.exports = User;