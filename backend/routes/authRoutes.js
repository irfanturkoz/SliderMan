const express = require('express');
const router = express.Router();
const { register, login, getProfile, logout, changePassword, deleteUser, getUsers, createTestUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');

// Test kullanıcısı oluştur (sadece geliştirme ortamında kullanın)
router.post('/create-test-user', createTestUser);

// Kullanıcı kaydı (sadece adminler)
router.post('/register', protect, admin, register);

// Kullanıcı girişi
router.post('/login', login);

// Kullanıcı bilgilerini getir
router.get('/profile', protect, getProfile);

// Şifre değiştir
router.put('/change-password', protect, changePassword);

// Çıkış yap
router.post('/logout', protect, logout);

// Tüm kullanıcıları getir (sadece adminler)
router.get('/users', protect, admin, getUsers);

// Kullanıcı sil (sadece adminler)
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router; 