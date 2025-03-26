const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Page = require('./models/Page');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');

const app = express();

// CORS'u aktif et
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON ve form verilerini parse et
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik dosyaları serve et
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/js', express.static(path.join(__dirname, '..', 'js'))); 
app.use(express.static(path.join(__dirname, '..', 'public')));

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB bağlantısı başarılı'))
    .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pages', require('./routes/pages'));

// HTML dosyalarını serve et
app.get('*.html', (req, res) => {
    // URL'den dosya adını al
    const fileName = req.path.substring(1); // Başındaki / karakterini kaldır
    const filePath = path.join(__dirname, '..', 'public', fileName);
    console.log('HTML dosyası isteniyor:', filePath);
    
    if (fs.existsSync(filePath)) {
        console.log('HTML dosyası bulundu, gönderiliyor...');
        res.sendFile(filePath);
    } else {
        console.log('HTML dosyası bulunamadı:', filePath);
        console.log('Mevcut dosyalar:', fs.readdirSync(path.join(__dirname, '..', 'public')).join(', '));
        res.status(404).send('Sayfa bulunamadı');
    }
});

// Kök yolu için yönlendirme
app.get('/', (req, res) => {
    res.send('SliderMan Backend API - <a href="/api/pages">Sayfaları Görüntüle</a>');
});

// Hata yakalama middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Sunucu hatası!' });
});

// Port ayarı
const port = process.env.PORT || 10000;

// Sunucuyu başlat
app.listen(port, () => {
    console.log(`Server ${port} portunda çalışıyor`);
    if (process.env.NODE_ENV === 'production') {
        console.log('Production modunda çalışıyor');
        console.log('HTML dosyaları:', path.join(__dirname, '..', 'public'));
    } else {
        console.log('Frontend: http://localhost:8080');
        console.log('Backend: http://localhost:' + port);
    }
});