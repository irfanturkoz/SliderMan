const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // Token'ı al
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Yetkilendirme hatası' });
        }

        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Kullanıcıyı bul
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı' });
        }

        // Kullanıcı bilgisini request'e ekle
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware hatası:', error);
        res.status(401).json({ success: false, message: 'Yetkilendirme hatası' });
    }
};