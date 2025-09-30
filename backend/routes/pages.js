const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Mongoose kaldırıldı - SQLite kullanıyoruz
const auth = require('../middleware/auth');

// Page modeli
const Page = require('../models/Page');

// Dosya yükleme ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'pages');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|mp4|webm|ogg|mov/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim ve video dosyaları yüklenebilir!'));
        }
    }
});

// HTML şablonu oluştur
function createHtmlTemplate(page) {
    try {
        console.log('HTML şablonu oluşturuluyor...');
        
        // Medya öğelerini oluştur
        let mediaItems = '';
        
        // Tüm medya öğelerini birleştir ve sırala
        const allMedia = [];
        
        // Resimleri ekle
        if (page.images && page.images.length > 0) {
            page.images.forEach(image => {
                allMedia.push({
                    type: 'image',
                    data: image,
                    order: typeof image.order === 'number' ? image.order : 9999
                });
            });
        }
        
        // Videoları ekle
        if (page.videos && page.videos.length > 0) {
            page.videos.forEach(video => {
                allMedia.push({
                    type: 'video',
                    data: video,
                    order: typeof video.order === 'number' ? video.order : 9999
                });
            });
        }
        
        // Medya öğelerini order değerine göre sırala
        allMedia.sort((a, b) => a.order - b.order);
        
        // Medya öğelerini sırayla işle
        allMedia.forEach((media, index) => {
            if (media.type === 'image') {
                const image = media.data;
                const imageUrl = process.env.NODE_ENV === 'production' 
                    ? `https://sliderman-backend.onrender.com/uploads/pages/${image.filename}`
                    : `/uploads/pages/${image.filename}`;
                
                mediaItems += `
                <div class="slider-item${index === 0 ? ' active' : ''}">
                    <img src="${imageUrl}" alt="${image.originalname || 'Resim'}" class="slider-image">
                </div>`;
            } else if (media.type === 'video') {
                const video = media.data;
                const videoUrl = process.env.NODE_ENV === 'production'
                    ? `https://sliderman-backend.onrender.com/uploads/pages/${video.filename}`
                    : `/uploads/pages/${video.filename}`;
                
                mediaItems += `
                <div class="slider-item${index === 0 ? ' active' : ''}">
                    <video muted playsinline>
                        <source src="${videoUrl}" type="${video.mimetype || 'video/mp4'}">
                    </video>
                </div>`;
            }
        });
        
        // HTML şablonunu oluştur
        const templatePath = path.join(__dirname, '../../slider-template.html');
        let templateContent = fs.readFileSync(templatePath, 'utf8');
        
        // Örnek içeriği gerçek içerikle değiştir
        templateContent = templateContent.replace('<!-- Slider içeriği backend tarafından eklenecek -->', mediaItems);
        
        // Geçiş süresini ekle
        const transitionInterval = page.transitionInterval || 5000;
        templateContent = templateContent.replace('{{transitionInterval}}', transitionInterval);
        
        console.log('HTML şablonu başarıyla oluşturuldu');
        return templateContent;
    } catch (error) {
        console.error('HTML şablonu oluşturulurken hata:', error);
        throw error;
    }
}

// YouTube video ID çıkarma
function getYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Vimeo video ID çıkarma
function getVimeoVideoId(url) {
    const regExp = /vimeo.com\/(?:video\/)?(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

// Güvenli dosya adı oluştur
function createSafeFileName(name) {
    // Türkçe karakterleri değiştir
    let safeName = name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    
    // Sadece alfanumerik karakterleri, tire ve alt çizgileri tut
    safeName = safeName.replace(/[^a-z0-9_-]/g, '');
    
    // Boş ise varsayılan ad ver
    if (!safeName) {
        safeName = 'page-' + Date.now();
    }
    
    return safeName;
}

// Sayfa detayını getir
router.get('/:id', auth, async (req, res) => {
    try {
        console.log('Sayfa detayı isteği:', req.params.id);
        
        const page = await Page.findByPk(req.params.id);
        if (!page) {
            console.log('Sayfa bulunamadı:', req.params.id);
            return res.status(404).json({ success: false, message: 'Sayfa bulunamadı' });
        }

        // Geçiş süresini kontrol et ve ayarla
        const transitionInterval = parseInt(req.query.transitionInterval) || 20000;
        page.transitionInterval = transitionInterval;
        
        // Medya URL'lerini düzelt
        const pageObj = page.toJSON();
        
        // API URL'sini belirle
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://sliderman-backend.onrender.com' 
            : 'http://localhost:10000';
        
        // Resimlerin URL'lerini düzelt
        if (pageObj.images && pageObj.images.length > 0) {
            pageObj.images = pageObj.images.map(img => {
                if (img.filename && (!img.url || img.url.startsWith('/'))) {
                    img.url = `${baseUrl}/uploads/pages/${img.filename}`;
                }
                return img;
            });
        }
        
        // Videoların URL'lerini düzelt
        if (pageObj.videos && pageObj.videos.length > 0) {
            pageObj.videos = pageObj.videos.map(video => {
                if (video.filename && (!video.url || video.url.startsWith('/'))) {
                    video.url = `${baseUrl}/uploads/pages/${video.filename}`;
                }
                return video;
            });
        }
        
        res.json({ success: true, page: pageObj });
    } catch (error) {
        console.error('Sayfa detayı hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tüm sayfaları getir
router.get('/', auth, async (req, res) => {
    try {
        const pages = await Page.findAll({ order: [['createdAt', 'DESC']] });
        
        // API URL'sini belirle
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://sliderman-backend.onrender.com' 
            : 'http://localhost:10000';
        
        // Sayfaları düzelt
        const pagesObj = pages.map(page => {
            const pageObj = page.toJSON();
            
            // Resimlerin URL'lerini düzelt
            if (pageObj.images && pageObj.images.length > 0) {
                pageObj.images = pageObj.images.map(img => {
                    if (img.filename && (!img.url || img.url.startsWith('/'))) {
                        img.url = `${baseUrl}/uploads/pages/${img.filename}`;
                    }
                    return img;
                });
            }
            
            // Videoların URL'lerini düzelt
            if (pageObj.videos && pageObj.videos.length > 0) {
                pageObj.videos = pageObj.videos.map(video => {
                    if (video.filename && (!video.url || video.url.startsWith('/'))) {
                        video.url = `${baseUrl}/uploads/pages/${video.filename}`;
                    }
                    return video;
                });
            }
            
            return pageObj;
        });
        
        res.json({ success: true, pages: pagesObj });
    } catch (error) {
        console.error('Sayfa listesi hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Yeni sayfa oluştur
router.post('/', auth, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 10 }
]), async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, message: 'Sayfa adı gereklidir.' });
        }

        // API URL'sini belirle
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://sliderman-backend.onrender.com' 
            : 'http://localhost:10000';

        // Yüklenen dosyaları ekle
        const images = [];
        const videos = [];

        if (req.files?.images) {
            req.files.images.forEach((file, index) => {
                images.push({
                    type: 'file',
                    filename: file.filename,
                    originalname: file.originalname,
                    url: `${baseUrl}/uploads/pages/${file.filename}`,
                    index
                });
            });
        }

        if (req.files?.videos) {
            req.files.videos.forEach((file, index) => {
                videos.push({
                    type: 'file',
                    filename: file.filename,
                    originalname: file.originalname,
                    url: `${baseUrl}/uploads/pages/${file.filename}`,
                    index
                });
            });
        }

        const page = await Page.create({
            name: name.trim(),
            images: images,
            videos: videos
        });

        // Güvenli dosya adı oluştur
        const safeFileName = createSafeFileName(page.name);

        // HTML sayfası oluştur
        const htmlContent = createHtmlTemplate(page);
        
        // HTML dosyasını kaydetmek için doğru klasörü belirle
        let publicDir;
        if (process.env.NODE_ENV === 'production') {
            // Render platformunda root dizini kullan
            publicDir = path.join(__dirname, '..', '..', 'public');
            console.log('Production ortamında public dizini:', publicDir);
            // Render'da dizin yapısını kontrol et
            try {
                const rootDir = path.join(__dirname, '..', '..');
                console.log('Root dizin içeriği:', fs.readdirSync(rootDir).join(', '));
                
                if (fs.existsSync(path.join(rootDir, 'public'))) {
                    console.log('Public dizini içeriği:', fs.readdirSync(path.join(rootDir, 'public')).join(', '));
                } else {
                    console.log('Public dizini bulunamadı, oluşturuluyor...');
                }
            } catch (err) {
                console.error('Dizin kontrol hatası:', err);
            }
        } else {
            // Yerel geliştirme ortamında
            publicDir = path.join(__dirname, '..', '..', 'public');
        }
        
        // Klasörün varlığını kontrol et ve gerekirse oluştur
        try {
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
                console.log(`Public dizini oluşturuldu: ${publicDir}`);
            }
        } catch (err) {
            console.error('Public dizini oluşturma hatası:', err);
        }
        
        // HTML dosya yolunu belirle
        const htmlFilePath = path.join(publicDir, `${safeFileName}.html`);
        
        // HTML dosyasını oluştur
        fs.writeFileSync(htmlFilePath, htmlContent);
        console.log(`HTML sayfası oluşturuldu: ${htmlFilePath}`);

        // HTML URL'sini oluştur (her iki ortam için de backend URL'sini kullan)
        const htmlUrl = process.env.NODE_ENV === 'production'
            ? `https://sliderman-backend.onrender.com/${safeFileName}.html`
            : `http://localhost:${process.env.PORT || 10000}/${safeFileName}.html`;
        
        console.log(`HTML URL'si oluşturuldu: ${htmlUrl}`);

        res.status(201).json({ 
            success: true, 
            page: page.toJSON(),
            htmlFile: `${safeFileName}.html`,
            htmlUrl: htmlUrl
        });
    } catch (error) {
        console.error('Sayfa oluşturulurken hata:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Sayfa güncelle
router.put('/:id', auth, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 10 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        // SQLite'da ID validasyonu farklı - basit sayı kontrolü
        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Geçersiz sayfa ID' });
        }

        const page = await Page.findById(id);
        if (!page) {
            return res.status(404).json({ success: false, message: 'Sayfa bulunamadı' });
        }

        // Sayfa adını güncelle
        if (name) {
            page.name = name.trim();
        }

        // API URL'sini belirle
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://sliderman-backend.onrender.com' 
            : 'http://localhost:10000';

        // Yüklenen yeni dosyaları ekle
        if (req.files?.images) {
            const newImages = req.files.images.map(file => ({
                type: 'file',
                filename: file.filename,
                originalname: file.originalname,
                url: `${baseUrl}/uploads/pages/${file.filename}`,
                index: page.images.length
            }));
            
            page.images.push(...newImages);
        }
        
        if (req.files?.videos) {
            const newVideos = req.files.videos.map(file => ({
                type: 'file',
                filename: file.filename,
                originalname: file.originalname,
                url: `${baseUrl}/uploads/pages/${file.filename}`,
                index: page.videos.length
            }));
            
            page.videos.push(...newVideos);
        }

        await page.save();

        // Güvenli dosya adı oluştur
        const safeFileName = createSafeFileName(page.name);

        // HTML sayfası oluştur
        const htmlContent = createHtmlTemplate(page);
        
        // HTML dosyasını kaydetmek için doğru klasörü belirle
        let publicDir;
        if (process.env.NODE_ENV === 'production') {
            // Render platformunda root dizini kullan
            publicDir = path.join(__dirname, '..', '..', 'public');
            console.log('Production ortamında public dizini:', publicDir);
            // Render'da dizin yapısını kontrol et
            try {
                const rootDir = path.join(__dirname, '..', '..');
                console.log('Root dizin içeriği:', fs.readdirSync(rootDir).join(', '));
                
                if (fs.existsSync(path.join(rootDir, 'public'))) {
                    console.log('Public dizini içeriği:', fs.readdirSync(path.join(rootDir, 'public')).join(', '));
                } else {
                    console.log('Public dizini bulunamadı, oluşturuluyor...');
                }
            } catch (err) {
                console.error('Dizin kontrol hatası:', err);
            }
        } else {
            // Yerel geliştirme ortamında
            publicDir = path.join(__dirname, '..', '..', 'public');
        }
        
        // Klasörün varlığını kontrol et ve gerekirse oluştur
        try {
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
                console.log(`Public dizini oluşturuldu: ${publicDir}`);
            }
        } catch (err) {
            console.error('Public dizini oluşturma hatası:', err);
        }
        
        // HTML dosya yolunu belirle
        const htmlFilePath = path.join(publicDir, `${safeFileName}.html`);
        
        // HTML dosyasını oluştur
        fs.writeFileSync(htmlFilePath, htmlContent);
        console.log(`HTML sayfası oluşturuldu: ${htmlFilePath}`);

        // HTML URL'sini oluştur (her iki ortam için de backend URL'sini kullan)
        const htmlUrl = process.env.NODE_ENV === 'production'
            ? `https://sliderman-backend.onrender.com/${safeFileName}.html`
            : `http://localhost:${process.env.PORT || 10000}/${safeFileName}.html`;
        
        console.log(`HTML URL'si oluşturuldu: ${htmlUrl}`);

        res.json({ 
            success: true, 
            message: 'Sayfa başarıyla güncellendi',
            page: page.toJSON(),
            htmlFile: `${safeFileName}.html`
        });
    } catch (error) {
        console.error('Sayfa güncelleme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Sayfa sil
router.delete('/:id', auth, async (req, res) => {
    try {
        const page = await Page.findByPk(req.params.id);
        if (!page) {
            return res.status(404).json({ success: false, message: 'Sayfa bulunamadı' });
        }

        // HTML dosyasını sil
        const safeFileName = createSafeFileName(page.name);
        const htmlFilePath = path.join(__dirname, '..', '..', 'public', `${safeFileName}.html`);
        
        if (fs.existsSync(htmlFilePath)) {
            fs.unlinkSync(htmlFilePath);
            console.log(`HTML dosyası silindi: ${htmlFilePath}`);
        }

        // Sayfaya ait tüm dosyaları sil
        if (page.images && page.images.length > 0) {
            page.images.forEach(image => {
                if (image.filename) {
                    const filePath = path.join(__dirname, '..', '..', 'uploads', 'pages', image.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Resim dosyası silindi: ${filePath}`);
                    }
                }
            });
        }

        if (page.videos && page.videos.length > 0) {
            page.videos.forEach(video => {
                if (video.filename) {
                    const filePath = path.join(__dirname, '..', '..', 'uploads', 'pages', video.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Video dosyası silindi: ${filePath}`);
                    }
                }
            });
        }

        // Sayfayı sil
        await page.destroy();
        
        res.json({ success: true, message: 'Sayfa başarıyla silindi' });
    } catch (error) {
        console.error('Sayfa silinirken hata:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Sayfa içindeki resmi sil
router.delete('/:pageId/images/:imageId', auth, async (req, res) => {
    try {
        const { pageId, imageId } = req.params;
        console.log(`Resim silme isteği: Sayfa ID=${pageId}, Resim ID=${imageId}`);
        
        // Sayfayı bul
        const page = await Page.findByPk(pageId);
        if (!page) {
            return res.status(404).json({ success: false, message: 'Sayfa bulunamadı' });
        }
        
        // Resmi bul ve sil
        const imageIndex = page.images.findIndex(img => img._id.toString() === imageId);
        if (imageIndex === -1) {
            return res.status(404).json({ success: false, message: 'Resim bulunamadı' });
        }
        
        // Resmi diziden çıkar
        const removedImage = page.images.splice(imageIndex, 1)[0];
        
        // Dosya sisteminden de sil (eğer dosya varsa)
        if (removedImage.filename) {
            const filePath = path.join(__dirname, '..', '..', 'uploads', 'pages', removedImage.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Dosya silindi: ${filePath}`);
            }
        }
        
        // Sayfayı kaydet
        await page.save();
        
        // HTML sayfasını güncelle
        const safeFileName = createSafeFileName(page.name);
        const htmlContent = createHtmlTemplate(page);
        const htmlFilePath = path.join(__dirname, '..', '..', 'public', `${safeFileName}.html`);
        
        fs.writeFileSync(htmlFilePath, htmlContent);
        console.log(`HTML sayfası güncellendi: ${htmlFilePath}`);
        
        res.json({ 
            success: true, 
            message: 'Resim başarıyla silindi',
            page: page.toJSON()
        });
    } catch (error) {
        console.error('Resim silinirken hata:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Sayfa içindeki videoyu sil
router.delete('/:pageId/videos/:videoId', auth, async (req, res) => {
    try {
        const { pageId, videoId } = req.params;
        console.log(`Video silme isteği: Sayfa ID=${pageId}, Video ID=${videoId}`);
        
        // Sayfayı bul
        const page = await Page.findByPk(pageId);
        if (!page) {
            return res.status(404).json({ success: false, message: 'Sayfa bulunamadı' });
        }
        
        // Videoyu bul ve sil
        const videoIndex = page.videos.findIndex(vid => vid._id.toString() === videoId);
        if (videoIndex === -1) {
            return res.status(404).json({ success: false, message: 'Video bulunamadı' });
        }
        
        // Videoyu diziden çıkar
        const removedVideo = page.videos.splice(videoIndex, 1)[0];
        
        // Dosya sisteminden de sil (eğer dosya varsa)
        if (removedVideo.filename) {
            const filePath = path.join(__dirname, '..', '..', 'uploads', 'pages', removedVideo.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Dosya silindi: ${filePath}`);
            }
        }
        
        // Sayfayı kaydet
        await page.save();
        
        // HTML sayfasını güncelle
        const safeFileName = createSafeFileName(page.name);
        const htmlContent = createHtmlTemplate(page);
        const htmlFilePath = path.join(__dirname, '..', '..', 'public', `${safeFileName}.html`);
        
        fs.writeFileSync(htmlFilePath, htmlContent);
        console.log(`HTML sayfası güncellendi: ${htmlFilePath}`);
        
        res.json({ 
            success: true, 
            message: 'Video başarıyla silindi',
            page: page.toJSON()
        });
    } catch (error) {
        console.error('Video silinirken hata:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Medya sıralaması güncelleme endpoint'i
router.post('/update-media-order', auth, async (req, res) => {
    try {
        const { pageId, mixedOrder } = req.body;
        console.log('Medya sıralaması güncelleme isteği:', { pageId, mixedOrder });
        
        // Sayfayı bul
        const page = await Page.findByPk(pageId);
        if (!page) {
            return res.status(404).json({ success: false, message: 'Sayfa bulunamadı' });
        }

        // Medya sıralamasını güncelle
        if (mixedOrder && mixedOrder.length > 0) {
            // Her medya öğesi için order değerini güncelle
            mixedOrder.forEach((item, index) => {
                if (item.type === 'image') {
                    const image = page.images.find(img => img._id.toString() === item.id);
                    if (image) {
                        image.order = index;
                    }
                } else if (item.type === 'video') {
                    const video = page.videos.find(vid => vid._id.toString() === item.id);
                    if (video) {
                        video.order = index;
                    }
                }
            });

            // Resimleri ve videoları order değerine göre sırala
            page.images.sort((a, b) => a.order - b.order);
            page.videos.sort((a, b) => a.order - b.order);
        }

        // Sayfayı kaydet
        await page.save();

        // HTML sayfasını güncelle
        const safeFileName = createSafeFileName(page.name);
        const htmlContent = createHtmlTemplate(page);
        const htmlFilePath = path.join(__dirname, '..', '..', 'public', `${safeFileName}.html`);
        
        fs.writeFileSync(htmlFilePath, htmlContent);
        console.log(`HTML sayfası güncellendi: ${htmlFilePath}`);

        res.json({ success: true, message: 'Medya sıralaması başarıyla güncellendi' });
    } catch (error) {
        console.error('Medya sıralaması güncelleme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Resim ekle
router.post('/:id/images', auth, upload.single('image'), async (req, res) => {
    try {
        const page = await Page.findByPk(req.params.id);
        if (!page) {
            return res.status(404).json({ message: 'Sayfa bulunamadı.' });
        }
        
        // Yeni resim için order değerini belirle (mevcut resim sayısı)
        const newOrder = page.images.length;
        
        // Resim bilgilerini ekle
        const imageData = {
            type: 'local',
            url: `https://sliderman-backend.onrender.com/uploads/pages/${req.file.filename}`,
            filename: req.file.filename,
            originalname: req.file.originalname,
            order: newOrder
        };
        
        console.log(`Yeni resim ekleniyor: Dosya=${req.file.filename}, Order=${newOrder}`);
        
        page.images.push(imageData);
        await page.save();
        
        // HTML şablonunu karışık sıralama ile güncelle
        await updateHtmlTemplateWithMixedOrder(page);
        
        res.json({
            message: 'Resim başarıyla eklendi.',
            image: page.images[page.images.length - 1],
            success: true
        });
    } catch (error) {
        console.error('Resim eklenirken hata:', error);
        res.status(500).json({ message: 'Resim eklenirken bir hata oluştu.', success: false });
    }
});

// Video ekle
router.post('/:id/videos', auth, async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ message: 'Video URL\'si gerekli.' });
        }
        
        const page = await Page.findByPk(req.params.id);
        if (!page) {
            return res.status(404).json({ message: 'Sayfa bulunamadı.' });
        }
        
        // Yeni video için order değerini belirle (mevcut video sayısı)
        const newOrder = page.videos.length;
        
        // Video bilgilerini ekle
        const videoData = {
            type: 'url',
            url: url,
            order: newOrder
        };
        
        console.log(`Yeni video ekleniyor: URL=${url}, Order=${newOrder}`);
        
        page.videos.push(videoData);
        await page.save();
        
        // HTML şablonunu karışık sıralama ile güncelle
        await updateHtmlTemplateWithMixedOrder(page);
        
        res.json({
            message: 'Video başarıyla eklendi.',
            video: page.videos[page.videos.length - 1],
            success: true
        });
    } catch (error) {
        console.error('Video eklenirken hata:', error);
        res.status(500).json({ message: 'Video eklenirken bir hata oluştu.', success: false });
    }
});

// updateMediaOrderValues fonksiyonu tamamen kaldırıldı

// updateMediaOrderValues fonksiyonu kaldırıldı - SQLite'da gerek yok

module.exports = router;