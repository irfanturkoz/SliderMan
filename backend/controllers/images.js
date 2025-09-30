const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');

// Uploads klasörünü oluştur
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer yapılandırması
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Sadece resim dosyalarını kabul et
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
        }
        cb(null, true);
    }
});

// Resim yükleme
exports.uploadImage = [
    authenticateToken,
    upload.single('image'),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Lütfen bir resim seçin' });
        }
        res.json({ 
            success: true, 
            message: 'Resim başarıyla yüklendi',
            path: req.file.filename
        });
    }
];

// Resim silme
exports.deleteImage = [
    authenticateToken,
    (req, res) => {
        const filename = req.params.filename;
        if (!filename) {
            return res.status(400).json({ success: false, message: 'Dosya adı gerekli' });
        }

        const filepath = path.join(uploadDir, filename);
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, message: 'Dosya bulunamadı' });
        }

        fs.unlink(filepath, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Dosya silinirken hata oluştu' });
            }
            res.json({ success: true, message: 'Dosya başarıyla silindi' });
        });
    }
];

// Resimleri listele
exports.listImages = (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Resimler listelenirken hata oluştu' });
        }
        
        const images = files.map(filename => ({
            filename,
            path: filename
        }));
        
        res.json({ success: true, images });
    });
}; 