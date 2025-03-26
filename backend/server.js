const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Page = require('./models/Page');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// CORS'u aktif et
app.use(cors());

// JSON ve form verilerini parse et
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik dosyaları serve et
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..')));

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

// Ana dizindeki HTML dosyalarını serve et
app.get('*.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', req.path));
});

// Hata yakalama middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Sunucu hatası!' });
});

// Port ayarı
const port = process.env.PORT || 3000;

// Sunucuyu başlat
app.listen(port, () => {
    console.log(`Server ${port} portunda çalışıyor`);
    console.log('Frontend: http://localhost:8080');
    console.log('Backend: http://localhost:3000');
});