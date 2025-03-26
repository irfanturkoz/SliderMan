const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Kullanıcı listesini getir
router.get('/list', protect, async (req, res) => {
    try {
        const users = await User.find().select('-password').lean();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Kullanıcılar yüklenirken hata:', error);
        res.status(500).json({ success: false, message: 'Kullanıcılar yüklenirken bir hata oluştu' });
    }
});

// Kullanıcı sil
router.delete('/:id', protect, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
        }
        res.json({ success: true, message: 'Kullanıcı başarıyla silindi' });
    } catch (error) {
        console.error('Kullanıcı silinirken hata:', error);
        res.status(500).json({ success: false, message: 'Kullanıcı silinirken bir hata oluştu' });
    }
});

module.exports = router;
