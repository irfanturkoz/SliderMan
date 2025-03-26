const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123456', salt);

    // Admin kullanıcısını kontrol et
    let adminUser = await User.findOne({ username: 'admin' });
    
    if (adminUser) {
      // Varolan admin kullanıcısını güncelle
      adminUser.password = hashedPassword;
      adminUser.isAdmin = true;
      adminUser.isSuperAdmin = true;
      await User.findByIdAndUpdate(adminUser._id, {
        password: hashedPassword,
        isAdmin: true,
        isSuperAdmin: true
      });
      console.log('Admin kullanıcısı güncellendi');
    } else {
      // Yeni admin kullanıcısı oluştur
      adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        isAdmin: true,
        isSuperAdmin: true
      });
      await adminUser.save();
      console.log('Yeni admin kullanıcısı oluşturuldu');
    }

    console.log('Admin bilgileri:');
    console.log('Kullanıcı adı: admin');
    console.log('Şifre: admin123456');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Fonksiyonu çalıştır
createAdminUser();