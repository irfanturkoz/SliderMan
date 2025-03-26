const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB bağlantısı başarılı'))
    .catch(err => console.error('MongoDB bağlantı hatası:', err));

async function createAdmin() {
    try {
        // Kullanıcı adı ve şifre
        const username = 'admin';
        const password = 'admin123';

        // Önce tüm admin kullanıcılarını sil
        await User.deleteMany({});
        console.log('Tüm kullanıcılar silindi');

        // Yeni admin kullanıcısı oluştur - şifreyi doğrudan kaydet
        const newUser = new User({
            username,
            password, // Şifreyi doğrudan kaydet, hash'leme
            isAdmin: true,
            isSuperAdmin: true
        });

        // Kullanıcıyı kaydet
        await newUser.save();
        console.log('Admin kullanıcısı başarıyla oluşturuldu:');
        console.log(`Kullanıcı adı: ${username}`);
        console.log(`Şifre: ${password}`);
        
        // Bağlantıyı kapat
        mongoose.connection.close();
    } catch (error) {
        console.error('Admin oluşturulurken hata:', error);
        mongoose.connection.close();
    }
}

// Admin oluştur
createAdmin();
