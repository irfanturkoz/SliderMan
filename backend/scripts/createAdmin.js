const dotenv = require('dotenv');
const { connectDB } = require('../config/database');
const User = require('../models/User');

// Çevre değişkenlerini yükle
dotenv.config();

// SQLite bağlantısı
connectDB();

const createAdmin = async () => {
  try {
    // Admin kullanıcısı var mı kontrol et
    const adminExists = await User.findOne({ where: { isAdmin: true } });
    
    if (adminExists) {
      console.log('Admin kullanıcısı zaten var!');
      console.log(`Kullanıcı adı: ${adminExists.username}`);
      process.exit();
    }
    
    // Yeni admin kullanıcısı oluştur
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      isAdmin: true
    });
    
    console.log('Admin kullanıcısı başarıyla oluşturuldu!');
    console.log(`Kullanıcı adı: ${admin.username}`);
    console.log('Şifre: admin123');
    
    process.exit();
  } catch (error) {
    console.error(`Hata: ${error.message}`);
    process.exit(1);
  }
};

createAdmin(); 