const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/database');
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
app.use(express.static(path.join(__dirname, '..')));

// SQLite bağlantısı
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pages', require('./routes/pages'));

// Ana sayfa - login'e yönlendir
app.get('/', (req, res) => {
    const loginHtml = `
    <!DOCTYPE html>
    <html><head><meta http-equiv="refresh" content="0;url=/login.html"></head>
    <body>Yönlendiriliyor...</body></html>`;
    res.send(loginHtml);
});

// HTML dosyalarını serve et
app.get('*.html', (req, res) => {
    // URL'den dosya adını al
    const fileName = req.path.substring(1); // Başındaki / karakterini kaldır
    const filePath = path.join(__dirname, '..', 'public', fileName);
    console.log('HTML dosyası isteniyor:', filePath);
    console.log('İstek URL:', req.url);
    console.log('İstek path:', req.path);
    
    if (fs.existsSync(filePath)) {
        console.log('HTML dosyası bulundu, gönderiliyor...');
        res.sendFile(filePath);
    } else {
        console.log('HTML dosyası bulunamadı:', filePath);
        console.log('Mevcut dosyalar:', fs.readdirSync(path.join(__dirname, '..', 'public')).join(', '));
        
        // Alternatif yolları dene
        const altPath1 = path.join(__dirname, '..', fileName);
        const altPath2 = path.join(__dirname, '..', '..', fileName);
        
        if (fs.existsSync(altPath1)) {
            console.log('Alternatif yolda bulundu (1):', altPath1);
            return res.sendFile(altPath1);
        } else if (fs.existsSync(altPath2)) {
            console.log('Alternatif yolda bulundu (2):', altPath2);
            return res.sendFile(altPath2);
        }
        
        res.status(404).send('Sayfa bulunamadı');
    }
});

// Duplicate route kaldırıldı - yukarıda zaten var

// Tüm diğer HTML istekleri için
app.get('/:pageName', (req, res) => {
    const pageName = req.params.pageName;
    
    // Eğer .html ile bitmiyorsa ve bir dosya adı gibi görünüyorsa
    if (!pageName.includes('.') || pageName.endsWith('.html')) {
        const fileName = pageName.endsWith('.html') ? pageName : `${pageName}.html`;
        const filePath = path.join(__dirname, '..', 'public', fileName);
        
        console.log('Sayfa isteniyor:', filePath);
        
        if (fs.existsSync(filePath)) {
            console.log('Sayfa bulundu, gönderiliyor...');
            return res.sendFile(filePath);
        } else {
            console.log('Sayfa bulunamadı:', filePath);
            console.log('Mevcut dosyalar:', fs.readdirSync(path.join(__dirname, '..', 'public')).join(', '));
        }
    }
    
    // Eğer bulunamazsa 404 döndür
    res.status(404).send('Sayfa bulunamadı');
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