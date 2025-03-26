const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB bağlantısı başarılı');
    
    // Page koleksiyonundaki tüm indexleri kaldır
    await mongoose.connection.collection('pages').dropIndexes();
    console.log('Indexler başarıyla kaldırıldı');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB bağlantı hatası:', err);
    process.exit(1);
  });
