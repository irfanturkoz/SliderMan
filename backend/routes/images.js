const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { protect } = require('../middleware/auth');
const { uploadImage, deleteImage, listImages } = require('../controllers/images');
const Image = require('../models/image');

// Multer ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
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
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'));
        }
    }
});

// URL'den resim indirme fonksiyonu
function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filename);
        
        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Resim indirilemedi: ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filename, () => {}); // Hata durumunda dosyayı sil
            reject(err);
        });
    });
}

// Resim yükleme endpoint'i
router.post('/upload', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen bir resim seçin'
            });
        }

        res.json({
            success: true,
            message: 'Resim başarıyla yüklendi',
            file: {
                filename: req.file.filename,
                path: `/uploads/${req.file.filename}`
            }
        });
    } catch (error) {
        console.error('Resim yükleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Resim yüklenirken bir hata oluştu'
        });
    }
});

// URL ile resim yükleme endpoint'i
router.post('/upload-url', protect, async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL gereklidir'
            });
        }

        // URL'nin geçerli bir resim URL'si olup olmadığını kontrol et
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(url).toLowerCase());
        if (!extname) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir resim URL\'si giriniz'
            });
        }

        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = Date.now() + '-' + path.basename(url);
        const filepath = path.join(uploadDir, filename);

        await downloadImage(url, filepath);

        res.json({
            success: true,
            message: 'Resim başarıyla yüklendi',
            file: {
                filename: filename,
                path: `/uploads/${filename}`
            }
        });
    } catch (error) {
        console.error('URL ile resim yükleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Resim yüklenirken bir hata oluştu'
        });
    }
});

// Resim silme endpoint'i
router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Resim ID\'si gereklidir'
            });
        }

        // MongoDB'den resmi bul
        const image = await Image.findById(id);
        
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Resim bulunamadı'
            });
        }

        // Dosyayı fiziksel olarak sil
        const filePath = path.join(__dirname, '../../uploads', path.basename(image.url));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // MongoDB'den resmi sil
        await Image.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Resim başarıyla silindi'
        });
    } catch (error) {
        console.error('Resim silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Resim silinirken bir hata oluştu'
        });
    }
});

// Resimleri listeleme endpoint'i (yetkilendirme gerekmez)
router.get('/list', async (req, res) => {
    try {
        const uploadDir = path.join(__dirname, '../../uploads');
        
        if (!fs.existsSync(uploadDir)) {
            return res.json({
                success: true,
                images: []
            });
        }

        const files = fs.readdirSync(uploadDir);
        const images = files.map(file => ({
            filename: file,
            path: `/uploads/${file}`
        }));

        res.json({
            success: true,
            images: images
        });
    } catch (error) {
        console.error('Resimleri listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Resimler listelenirken bir hata oluştu'
        });
    }
});

module.exports = router; 