const { Sequelize } = require('sequelize');
const path = require('path');

// SQLite database dosyası
const dbPath = path.join(__dirname, '..', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // SQL loglarını kapatır
  define: {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite veritabanı bağlantısı başarılı');
    
    // Tabloları oluştur
    await sequelize.sync();
    console.log('Veritabanı tabloları senkronize edildi');
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
