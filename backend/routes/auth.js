const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Admin girişi
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login isteği:', { username, password });

        // Kullanıcıyı bul
        const user = await User.findOne({ username });
        console.log('Kullanıcı bulundu mu:', !!user);
        
        if (!user) {
            console.log('Kullanıcı bulunamadı:', username);
            return res.status(401).json({ success: false, message: 'Geçersiz kullanıcı adı veya şifre' });
        }

        // Şifreyi kontrol et - basitleştirilmiş
        console.log('Şifre karşılaştırılıyor...');
        console.log('Gelen şifre:', password);
        console.log('DB şifre:', user.password);
        
        const isMatch = user.password === password;
        console.log('Şifre eşleşti mi:', isMatch);
        
        if (!isMatch) {
            console.log('Şifre eşleşmedi');
            return res.status(401).json({ success: false, message: 'Geçersiz kullanıcı adı veya şifre' });
        }

        // Token oluştur
        console.log('Token oluşturuluyor...');
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log('Giriş başarılı:', username);
        res.json({
            success: true,
            token,
            username: user.username
        });
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ success: false, message: 'Giriş yapılırken bir hata oluştu' });
    }
});

// Token doğrulama
router.get('/verify', async (req, res) => {
    try {
        // Token'ı al
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            console.log('Token bulunamadı');
            return res.status(401).json({ success: false, message: 'Token bulunamadı' });
        }

        // Token'ı doğrula
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Kullanıcıyı bul
            const user = await User.findById(decoded.id);
            if (!user) {
                console.log('Kullanıcı bulunamadı');
                return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı' });
            }

            // Token geçerli
            console.log('Token doğrulama başarılı:', user.username);
            res.json({ success: true, username: user.username });
        } catch (verifyError) {
            console.log('Token doğrulama hatası:', verifyError.message);
            // Token süresi dolmuşsa 401 dön
            return res.status(401).json({ 
                success: false, 
                message: 'Geçersiz veya süresi dolmuş token',
                expired: verifyError.name === 'TokenExpiredError'
            });
        }
    } catch (error) {
        console.error('Token doğrulama genel hatası:', error);
        res.status(401).json({ success: false, message: 'Geçersiz veya süresi dolmuş token' });
    }
});

// Token yenileme
router.post('/refresh', async (req, res) => {
    try {
        // Eski token'ı al
        const oldToken = req.headers.authorization?.split(' ')[1];
        if (!oldToken) {
            console.log('Yenileme için token bulunamadı');
            return res.status(401).json({ success: false, message: 'Token bulunamadı' });
        }

        // Eski token'ı doğrula
        let decoded;
        try {
            decoded = jwt.verify(oldToken, process.env.JWT_SECRET, { ignoreExpiration: true });
        } catch (error) {
            console.log('Yenileme için token doğrulama hatası:', error.message);
            return res.status(401).json({ success: false, message: 'Token geçersiz' });
        }

        // Kullanıcıyı bul
        const user = await User.findById(decoded.id);
        if (!user) {
            console.log('Yenileme için kullanıcı bulunamadı');
            return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı' });
        }

        // Yeni token oluştur
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Yeni token'ı gönder
        console.log('Token başarıyla yenilendi:', user.username);
        res.json({
            success: true,
            token,
            username: user.username
        });
    } catch (error) {
        console.error('Token yenileme genel hatası:', error);
        res.status(401).json({ success: false, message: 'Token yenilenemedi' });
    }
});

module.exports = router;
