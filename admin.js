// SliderMan Admin Panel - Version 1.1 (25.03.2025)
// Bu dosya tamamen yeniden yazılmıştır. Tarayıcı önbelleğini temizlemek için ?v=1.1 parametresi eklenmiştir.

// Global değişkenler
let currentEditingPageId = null;
let token = null;
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:10000/api' 
    : `${window.location.origin}/api`;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('DOMContentLoaded event tetiklendi');
        
        // URL parametrelerini al
        const urlParams = new URLSearchParams(window.location.search);
        
        // Token kontrolü
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
            console.error('Kimlik doğrulama başarısız');
            return;
        }
        
        console.log('Kimlik doğrulama başarılı, sayfalar yükleniyor...');
        
        // Sayfaları yükle
        await loadPages();
        
        // Event listener'ları ekle
        setupEventListeners();
        
        console.log('Sayfa başarıyla yüklendi');
    } catch (error) {
        console.error('Sayfa yüklenirken hata oluştu:', error);
        showAlert('danger', 'Sayfa yüklenirken bir hata oluştu: ' + error.message);
    }
});

// Token doğrulama
async function verifyToken() {
    try {
        console.log('Token doğrulaması yapılıyor...');
        const response = await fetch(`${API_URL}/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Token doğrulama yanıtı:', response.status, response.statusText);
        
        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return false;
        }
        
        const data = await response.json();
        console.log('Token doğrulama başarılı', data);
        return true;
    } catch (error) {
        console.error('Token doğrulama hatası:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return false;
    }
}

// Sayfaları yükle
async function loadPages() {
    try {
        console.log('Sayfaları yükleme başlatılıyor...');
        
        const response = await fetch(`${API_URL}/pages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Sayfa yükleme hatası:', response.status, errorText);
            throw new Error(`Sayfalar yüklenirken bir hata oluştu. Durum: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('Backend yanıtı:', responseData);
        
        // Pages doğrudan dizi olabilir veya { pages: [...] } formatında olabilir
        let pages = [];
        if (responseData && responseData.success && responseData.pages && Array.isArray(responseData.pages)) {
            pages = responseData.pages;
            console.log('Pages dizisi responseData.pages içinden alındı');
        } else if (Array.isArray(responseData)) {
            pages = responseData;
            console.log('Backend yanıtı doğrudan bir dizi olarak alındı');
        } else {
            console.error('Backend yanıtı bir dizi değil ve geçerli pages özelliği yok!', responseData);
            pages = [];
        }
        
        console.log('İşlenecek sayfalar:', pages);
        console.log('Sayfa sayısı:', pages.length);
        
        // Sayfa listesini güncelle
        const pagesList = document.getElementById('pagesList');
        if (!pagesList) {
            console.error('pagesList elementi bulunamadı!');
            return;
        }
        
        pagesList.innerHTML = '';
        
        if (!Array.isArray(pages) || pages.length === 0) {
            console.log('Hiç sayfa bulunamadı veya pages bir dizi değil');
            pagesList.innerHTML = '<div class="alert alert-info">Henüz sayfa bulunmuyor.</div>';
            return;
        }
        
        console.log('Sayfalar listeye ekleniyor...');
        
        pages.forEach((page, index) => {
            console.log(`Sayfa ${index + 1}:`, page);
            
            if (!page || !page.id) {
                console.error(`Sayfa ${index + 1} geçersiz format:`, page);
                return;
            }
            
            const pageElement = document.createElement('div');
            pageElement.className = 'col-md-4 mb-4';
            pageElement.dataset.id = page.id;
            
            pageElement.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${page.name || 'İsimsiz Sayfa'}</h5>
                        <p class="card-text">
                            <small class="text-muted">
                                ${page.images ? page.images.length : 0} Resim, 
                                ${page.videos ? page.videos.length : 0} Video
                            </small>
                        </p>
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100">
                            <button class="btn btn-sm btn-primary edit-page" title="Düzenle">
                                <i class="fas fa-edit"></i> Düzenle
                            </button>
                            <button class="btn btn-sm btn-success view-page" title="Sayfaya Git">
                                <i class="fas fa-external-link-alt"></i> Sayfaya Git
                            </button>
                            <button class="btn btn-sm btn-danger delete-page" title="Sil">
                                <i class="fas fa-trash"></i> Sil
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Düzenleme butonuna tıklama olayı
            const editButton = pageElement.querySelector('.edit-page');
            editButton.addEventListener('click', () => {
                // Sayfa ID'sini global değişkene kaydet
                currentEditingPageId = page.id;
                
                // Sayfa detaylarını yükle
                loadPage(page.id);
                
                // Form alanını göster
                togglePageForm(true, true);
            });
            
            // Sayfaya Git butonuna tıklama olayı
            const viewButton = pageElement.querySelector('.view-page');
            viewButton.addEventListener('click', () => {
                // Sayfa adını URL-safe hale getir
                const safeFileName = page.name.toLowerCase()
                    .replace(/ğ/g, 'g')
                    .replace(/ü/g, 'u')
                    .replace(/ş/g, 's')
                    .replace(/ı/g, 'i')
                    .replace(/ö/g, 'o')
                    .replace(/ç/g, 'c')
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                
                // HTML sayfasını yeni sekmede aç
                const backendUrl = window.location.hostname.includes('localhost') 
                    ? `http://localhost:10000`
                    : `https://aruiktisat.onrender.com`;
                window.open(`${backendUrl}/${safeFileName}.html`, '_blank');
            });
            
            // Silme butonuna tıklama olayı
            const deleteButton = pageElement.querySelector('.delete-page');
            deleteButton.addEventListener('click', () => {
                if (confirm(`"${page.name || 'İsimsiz Sayfa'}" sayfasını silmek istediğinize emin misiniz?`)) {
                    deletePage(page.id);
                }
            });
            
            pagesList.appendChild(pageElement);
            console.log(`Sayfa ${index + 1} listeye eklendi`);
        });
        
        console.log('Tüm sayfalar listeye eklendi');
        
    } catch (error) {
        console.error('Sayfaları yükleme hatası:', error);
        showAlert('danger', 'Sayfalar yüklenirken bir hata oluştu: ' + error.message);
    }
}

// Sayfa detaylarını yükle
async function loadPage(pageId) {
    try {
        console.log(`Sayfa detayları yükleniyor: ${pageId}`);
        
        const response = await fetch(`${API_URL}/pages/${pageId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Sayfa detayları yükleme hatası:', response.status, errorText);
            throw new Error(`Sayfa detayları yüklenirken bir hata oluştu. Durum: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('Backend yanıtı:', responseData);
        
        // Backend yanıtı { success: true, page: {...} } formatında olabilir
        let page = responseData;
        if (responseData && responseData.success && responseData.page) {
            page = responseData.page;
            console.log('Sayfa verisi responseData.page içinden alındı');
        }
        
        console.log('İşlenecek sayfa:', page);
        
        if (!page || !page.id) {
            console.error('Geçersiz sayfa verisi:', page);
            throw new Error('Sayfa verisi geçersiz format');
        }
        
        // Düzenleme sayfası ID'sini ayarla
        currentEditingPageId = page.id;
        
        // Form alanlarını doldur
        document.getElementById('pageName').value = page.name || '';
        document.getElementById('pageId').value = page.id;
        
        // Düzenleme formunu göster
        togglePageForm(true, true);
        
        // Medya listesini güncelle
        updateMediaList(page.images || [], page.videos || []);
        
    } catch (error) {
        console.error('Sayfa detayları yükleme hatası:', error);
        showAlert('danger', 'Sayfa detayları yüklenirken bir hata oluştu: ' + error.message);
    }
}

// Medya listesini güncelle
function updateMediaList(images = [], videos = []) {
    console.log('Medya listesi güncelleniyor...');
    console.log('Resimler:', JSON.stringify(images, null, 2));
    console.log('Videolar:', JSON.stringify(videos, null, 2));
    
    // Medya bölümünü göster
    const mediaSection = document.getElementById('mediaSection');
    if (mediaSection) {
        mediaSection.style.display = images.length > 0 || videos.length > 0 ? 'block' : 'none';
    }
    
    const allMediaList = document.getElementById('allMediaList');
    if (!allMediaList) {
        console.error('allMediaList elementi bulunamadı!');
        return;
    }
    
    allMediaList.innerHTML = '';
    
    // Tüm medya öğelerini birleştir ve sırala
    const allMedia = [
        ...images.map(img => ({ ...img, type: 'image' })),
        ...videos.map(video => ({ ...video, type: 'video' }))
    ];
    
    // Sıralama için order veya index özelliğini kullan
    allMedia.sort((a, b) => {
        // Önce order özelliğine göre sırala
        if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
        }
        // Sonra index özelliğine göre sırala
        if (a.index !== undefined && b.index !== undefined) {
            return a.index - b.index;
        }
        // Hiçbiri yoksa varsayılan sıralama
        return 0;
    });
    
    console.log('Birleştirilmiş ve sıralanmış medya:', JSON.stringify(allMedia, null, 2));
    
    if (allMedia.length === 0) {
        allMediaList.innerHTML = '<div class="alert alert-info">Henüz medya bulunmuyor.</div>';
        return;
    }
    
    // API URL'sini belirle
    const apiBaseUrl = API_URL.replace('/api', '');
    
    allMedia.forEach((media, index) => {
        if (!media) {
            console.error(`Geçersiz medya öğesi (index: ${index}):`, media);
            return;
        }
        
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        mediaItem.dataset.id = index; // SQLite'da index kullan
        mediaItem.dataset.type = media.type;
        mediaItem.dataset.order = index; // Sıralama için index ekle
        
        let mediaContent = '';
        let mediaUrl = '';
        let mediaTitle = '';
        
        if (media.type === 'image') {
            // URL'yi kontrol et ve düzelt
            mediaUrl = media.url;
            console.log(`Resim ${index} orijinal URL:`, mediaUrl);
            
            if (!mediaUrl) {
                // URL yoksa filename kullanarak oluştur
                if (media.filename) {
                    mediaUrl = `${apiBaseUrl}/uploads/pages/${media.filename}`;
                    console.log(`Resim ${index} filename'den oluşturulan URL:`, mediaUrl);
                }
            }
            
            // Eğer URL hala yoksa veya geçersizse
            if (!mediaUrl || mediaUrl === 'undefined') {
                mediaUrl = `${apiBaseUrl}/img/no-image.png`; // Varsayılan resim
                console.log(`Resim ${index} varsayılan URL:`, mediaUrl);
            }
            
            // URL'nin doğru formatta olduğundan emin ol
            if (mediaUrl && !mediaUrl.startsWith('http') && !mediaUrl.startsWith('/')) {
                mediaUrl = '/' + mediaUrl;
                console.log(`Resim ${index} düzeltilmiş URL:`, mediaUrl);
            }
            
            // Eğer URL göreceli ise ve API_URL ile başlamıyorsa, tam URL oluştur
            if (mediaUrl && mediaUrl.startsWith('/') && !mediaUrl.startsWith('//')) {
                // URL'nin başında zaten / varsa kaldır
                const cleanPath = mediaUrl.startsWith('/') ? mediaUrl.substring(1) : mediaUrl;
                mediaUrl = `${window.location.origin}/${cleanPath}`;
                console.log(`Resim ${index} tam URL:`, mediaUrl);
            }
            
            mediaTitle = media.originalname || media.alt || media.title || 'Resim';
            
            mediaContent = `
                <div class="media-preview">
                    <img src="${mediaUrl}" alt="${mediaTitle}" class="img-thumbnail" onerror="this.src='${apiBaseUrl}/img/no-image.png'">
                </div>
                <div class="media-info">
                    <span class="media-title">${mediaTitle}</span>
                    <span class="media-type">Resim</span>
                </div>
            `;
        } else if (media.type === 'video') {
            // URL'yi kontrol et ve düzelt
            mediaUrl = media.url;
            console.log(`Video ${index} orijinal URL:`, mediaUrl);
            
            if (!mediaUrl) {
                // URL yoksa filename kullanarak oluştur
                if (media.filename) {
                    mediaUrl = `${apiBaseUrl}/uploads/pages/${media.filename}`;
                    console.log(`Video ${index} filename'den oluşturulan URL:`, mediaUrl);
                }
            }
            
            // Eğer URL hala yoksa veya geçersizse
            if (!mediaUrl || mediaUrl === 'undefined') {
                mediaUrl = `${apiBaseUrl}/img/no-video.png`; // Varsayılan video önizleme
                console.log(`Video ${index} varsayılan URL:`, mediaUrl);
            }
            
            // URL'nin doğru formatta olduğundan emin ol
            if (mediaUrl && !mediaUrl.startsWith('http') && !mediaUrl.startsWith('/')) {
                mediaUrl = '/' + mediaUrl;
                console.log(`Video ${index} düzeltilmiş URL:`, mediaUrl);
            }
            
            // Eğer URL göreceli ise ve API_URL ile başlamıyorsa, tam URL oluştur
            if (mediaUrl && mediaUrl.startsWith('/') && !mediaUrl.startsWith('//')) {
                // URL'nin başında zaten / varsa kaldır
                const cleanPath = mediaUrl.startsWith('/') ? mediaUrl.substring(1) : mediaUrl;
                mediaUrl = `${window.location.origin}/${cleanPath}`;
                console.log(`Video ${index} tam URL:`, mediaUrl);
            }
            
            // Video türünü belirle (YouTube, Vimeo veya dosya)
            let videoType = 'Dosya';
            let videoPreview = '';
            
            if (mediaUrl && (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be'))) {
                videoType = 'YouTube';
                // YouTube video ID'sini çıkar
                const videoId = getYouTubeVideoId(mediaUrl);
                if (videoId) {
                    videoPreview = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                }
            } else if (mediaUrl && mediaUrl.includes('vimeo.com')) {
                videoType = 'Vimeo';
                // Vimeo video ID'sini çıkar
                const match = mediaUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
                const videoId = match ? match[3] : null;
                if (videoId) {
                    videoPreview = `<iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
                }
            } else {
                // Yerel video dosyası
                videoPreview = `<video controls><source src="${mediaUrl}" type="video/mp4" onerror="this.parentElement.innerHTML='<div class=\\'video-thumbnail\\'><i class=\\'fas fa-video\\'></i></div>'"></video>`;
            }
            
            mediaTitle = media.originalname || media.title || 'Video';
            
            mediaContent = `
                <div class="media-preview">
                    ${videoPreview || `<div class="video-thumbnail"><i class="fas fa-video"></i><img src="${apiBaseUrl}/img/no-video.png" alt="Video Önizleme" style="display:none;"></div>`}
                </div>
                <div class="media-info">
                    <span class="media-title">${mediaTitle}</span>
                    <span class="media-type">${videoType}</span>
                </div>
            `;
        }
        
        mediaItem.innerHTML = `
            <div class="media-item-content">
                <div class="handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="media-controls" style="position: absolute; top: 5px; right: 5px; z-index: 100;">
                    <button class="btn btn-sm btn-danger delete-media" title="Sil" style="pointer-events: auto;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ${mediaContent}
            </div>
        `;
        
        // Silme butonuna tıklama olayı
        const deleteButton = mediaItem.querySelector('.delete-media');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                if (confirm(`Bu ${media.type === 'image' ? 'resmi' : 'videoyu'} silmek istediğinize emin misiniz?`)) {
                    deleteMedia(index, media.type);
                }
            });
        }
        
        allMediaList.appendChild(mediaItem);
        console.log(`Medya öğesi eklendi (${index + 1}/${allMedia.length}):`, media.type, media.id || media._id);
    });
    
    // Sortable'ı yeniden başlat
    initSortable();
    console.log('Medya listesi güncellendi ve Sortable başlatıldı');
}

// Sortable listelerini başlat
function initSortable() {
    console.log('Sortable başlatılıyor...');
    
    // Tüm medya listesi için sortable
    const allMediaListElement = document.getElementById('allMediaList');
    if (allMediaListElement) {
        console.log('allMediaList elementi bulundu, Sortable başlatılıyor');
        
        // Önceki Sortable örneğini temizle
        const oldInstance = Sortable.get(allMediaListElement);
        if (oldInstance) {
            console.log('Önceki Sortable örneği kaldırılıyor');
            oldInstance.destroy();
        }
        
        // Yeni Sortable örneği oluştur
        new Sortable(allMediaListElement, {
            animation: 150,
            handle: '.handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            forceFallback: true,
            fallbackClass: 'sortable-fallback',
            fallbackOnBody: true,
            scroll: true,
            scrollSensitivity: 80,
            scrollSpeed: 10,
            onStart: function(evt) {
                console.log('Sürükleme başladı:', evt.oldIndex);
            },
            onEnd: async function(evt) {
                console.log('Sürükleme bitti:', evt.oldIndex, '->', evt.newIndex);
                
                // Sıralama değiştiğinde medya sıralamasını güncelle
                if (evt.oldIndex !== evt.newIndex) {
                    console.log('Sıralama değişti, güncelleniyor...');
                    await updateAllMediaOrder();
                } else {
                    console.log('Sıralama değişmedi, güncelleme yapılmıyor');
                }
            }
        });
        
        console.log('Sortable başlatıldı');
    } else {
        console.error('allMediaList elementi bulunamadı!');
    }
}

// Tüm medya öğelerinin sıralamasını güncelle
async function updateAllMediaOrder() {
    try {
        const currentPage = document.getElementById('pageId').value;
        if (!currentPage) {
            throw new Error('Aktif sayfa bulunamadı');
        }

        const allMediaList = document.getElementById('allMediaList');
        const mediaItems = Array.from(allMediaList.children);
        
        const mixedOrder = [];

        mediaItems.forEach((item, index) => {
            const mediaId = item.dataset.id;
            const mediaType = item.dataset.type;
            
            mixedOrder.push({
                type: mediaType,
                id: mediaId,
                order: index
            });
        });

        console.log('Medya sıralaması güncelleniyor:');
        console.log('Sayfa ID:', currentPage);
        console.log('Karışık sıralama:', mixedOrder);

        const response = await fetch(`${API_URL}/pages/update-media-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                pageId: currentPage,
                mixedOrder
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Medya sıralaması güncellenirken bir hata oluştu. Durum: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            showAlert('success', 'Medya sıralaması başarıyla güncellendi');
        } else {
            throw new Error(data.error || 'Medya sıralaması güncellenirken bir hata oluştu');
        }
    } catch (error) {
        console.error('Medya sıralaması güncelleme hatası:', error);
        showAlert('error', error.message);
        throw error;
    }
}

// Sayfa oluştur veya güncelle
async function createOrUpdatePage(formData) {
    try {
        const pageId = document.getElementById('pageId').value;
        const isEdit = pageId && pageId.trim() !== '';
        
        const url = isEdit 
            ? `${API_URL}/pages/${pageId}` 
            : `${API_URL}/pages`;
        
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log(`Sayfa ${isEdit ? 'güncelleniyor' : 'oluşturuluyor'}...`);
        console.log('URL:', url);
        console.log('Metod:', method);
        console.log('Form verisi:', [...formData.entries()]);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Sayfa ${isEdit ? 'güncelleme' : 'oluşturma'} hatası:`, response.status, errorText);
            throw new Error(`Sayfa ${isEdit ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu. Durum: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`Sayfa ${isEdit ? 'güncellendi' : 'oluşturuldu'}:`, result);
        
        // Form alanını gizle
        togglePageForm(false);
        
        // Başarı mesajı göster
        showAlert('success', `Sayfa başarıyla ${isEdit ? 'güncellendi' : 'oluşturuldu'}`);
        
        // Form alanlarını sıfırla
        resetForm();
        
        // Sayfaları yeniden yükle (1 saniye bekleyerek backend'in işlemi tamamlamasına izin ver)
        console.log('Sayfalar yeniden yükleniyor...');
        setTimeout(async () => {
            await loadPages();
        }, 1000);
        
    } catch (error) {
        console.error(`Sayfa ${pageId ? 'güncelleme' : 'oluşturma'} hatası:`, error);
        showAlert('danger', `Sayfa ${pageId ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu: ` + error.message);
    }
}

// Sayfa sil
async function deletePage(pageId) {
    try {
        const response = await fetch(`${API_URL}/pages/${pageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Sayfa silinirken bir hata oluştu. Durum: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Sayfa silindi:', result);
        
        // Başarı mesajı göster
        showAlert('success', 'Sayfa başarıyla silindi');
        
        // Form görünümünü kapat
        togglePageForm(false);
        
        // Sayfaları yeniden yükle
        loadPages();
        
        // Düzenleme sayfası ID'sini sıfırla
        currentEditingPageId = null;
        
    } catch (error) {
        console.error('Sayfa silme hatası:', error);
        showAlert('danger', 'Sayfa silinirken bir hata oluştu: ' + error.message);
    }
}

// Medya sil
async function deleteMedia(mediaId, mediaType) {
    try {
        console.log(`Medya siliniyor: ID=${mediaId}, Tip=${mediaType}`);
        
        if (!currentEditingPageId) {
            console.error('Düzenlenen sayfa ID\'si bulunamadı!');
            throw new Error('Düzenlenen sayfa bulunamadı');
        }
        
        const endpoint = mediaType === 'image' ? 'images' : 'videos';
        const url = `${API_URL}/pages/${currentEditingPageId}/${endpoint}/${mediaId}`;
        
        console.log('Silme isteği URL:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Medya silme hatası:', response.status, errorText);
            throw new Error(`Medya silinirken bir hata oluştu. Durum: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Medya silindi:', result);
        
        // Sayfa detaylarını yeniden yükle
        await loadPage(currentEditingPageId);
        
        showAlert('success', `${mediaType === 'image' ? 'Resim' : 'Video'} başarıyla silindi`);
    } catch (error) {
        console.error('Medya silme hatası:', error);
        showAlert('danger', 'Medya silinirken bir hata oluştu: ' + error.message);
    }
}

// Dosya yükleme
async function uploadFiles(pageId, formData) {
    try {
        console.log(`Dosyalar yükleniyor. Sayfa ID: ${pageId}`);
        
        const response = await fetch(`${API_URL}/pages/${pageId}/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Dosya yükleme hatası:', response.status, errorText);
            throw new Error(`Dosya yükleme hatası. Durum: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Dosya yükleme sonucu:', result);
        
        // Yükleme başarılı olduysa sayfayı yeniden yükle
        if (result.success) {
            await loadPage(pageId);
            showAlert('success', 'Dosyalar başarıyla yüklendi');
        } else {
            showAlert('danger', result.message || 'Dosya yükleme hatası');
        }
        
    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        showAlert('danger', 'Dosya yükleme hatası: ' + error.message);
    }
}

// Dosya önizleme
function handleFilePreview(fileInput, previewElement) {
    if (!fileInput || !previewElement) {
        console.error('Dosya önizleme için gerekli elementler bulunamadı');
        return;
    }
    
    fileInput.addEventListener('change', function() {
        // Önizleme alanını temizle
        previewElement.innerHTML = '';
        
        if (this.files && this.files.length > 0) {
            console.log(`${this.files.length} dosya seçildi`);
            
            // Her dosya için önizleme oluştur
            Array.from(this.files).forEach(file => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                
                // Dosya türüne göre önizleme oluştur
                if (file.type.startsWith('image/')) {
                    // Resim dosyası
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewItem.innerHTML = `
                            <div class="preview-image">
                                <img src="${e.target.result}" alt="${file.name}" class="img-thumbnail">
                            </div>
                            <div class="preview-info">
                                <span class="preview-name">${file.name}</span>
                                <span class="preview-size">${formatFileSize(file.size)}</span>
                            </div>
                        `;
                    };
                    reader.readAsDataURL(file);
                } else if (file.type.startsWith('video/')) {
                    // Video dosyası
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewItem.innerHTML = `
                            <div class="preview-video">
                                <video controls>
                                    <source src="${e.target.result}" type="${file.type}">
                                </video>
                            </div>
                            <div class="preview-info">
                                <span class="preview-name">${file.name}</span>
                                <span class="preview-size">${formatFileSize(file.size)}</span>
                            </div>
                        `;
                    };
                    reader.readAsDataURL(file);
                } else {
                    // Diğer dosya türleri
                    previewItem.innerHTML = `
                        <div class="preview-file">
                            <i class="fas fa-file"></i>
                        </div>
                        <div class="preview-info">
                            <span class="preview-name">${file.name}</span>
                            <span class="preview-size">${formatFileSize(file.size)}</span>
                        </div>
                    `;
                }
                
                previewElement.appendChild(previewItem);
            });
        }
    });
}

// Dosya boyutunu formatla
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Form gösterme/gizleme ve sayfa başına kaydırma
function togglePageForm(show = null, isEdit = false) {
    const formContainer = document.getElementById('pageFormContainer');
    const formTitle = document.getElementById('formTitle');
    const mediaSection = document.getElementById('mediaSection');
    const deletePageBtn = document.getElementById('deletePageBtn');
    
    // show parametresi null ise mevcut durumun tersini al
    if (show === null) {
        show = formContainer.style.display === 'none';
    }
    
    formContainer.style.display = show ? 'block' : 'none';
    
    // Başlığı güncelle
    formTitle.textContent = isEdit ? 'Sayfayı Düzenle' : 'Yeni Sayfa Oluştur';
    
    // Düzenleme modunda medya bölümünü göster
    mediaSection.style.display = isEdit ? 'block' : 'none';
    
    // Düzenleme modunda silme butonunu göster
    if (deletePageBtn) {
        deletePageBtn.style.display = isEdit ? 'inline-block' : 'none';
    }
    
    if (show) {
        // Sayfayı form alanına kaydır
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// Form alanlarını sıfırla
function resetForm() {
    const form = document.getElementById('pageForm');
    form.reset();
    
    // Gizli ID alanını temizle
    document.getElementById('pageId').value = '';
    
    // Medya bölümünü gizle
    document.getElementById('mediaSection').style.display = 'none';
    
    // Mevcut medya listesini temizle
    document.getElementById('allMediaList').innerHTML = '';
    
    // Global değişkeni sıfırla
    currentEditingPageId = null;
}

// Bölüm gösterme/gizleme
function showSection(sectionId) {
    // Artık sadece pagesSection için kullanılıyor
    // Diğer bölümler kaldırıldı
    if (sectionId === 'pagesSection') {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        }
    }
}

// Menü öğesini aktif yap
function setActiveMenu(element) {
    // Tüm menü öğelerinden active sınıfını kaldır
    document.querySelectorAll('.nav-link').forEach(item => {
        item.classList.remove('active');
    });
    
    // Tıklanan öğeye active sınıfını ekle
    element.classList.add('active');
}

// Bildirim göster
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        console.error('alertContainer elementi bulunamadı!');
        return;
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Kapat"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alertContainer.removeChild(alert);
        }, 150);
    }, 5000);
}

// YouTube video ID'sini URL'den çıkar
function getYouTubeVideoId(url) {
    if (!url) return null;
    
    // YouTube URL formatları:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    
    let videoId = null;
    
    // watch?v= formatı
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/);
    if (watchMatch && watchMatch[1]) {
        videoId = watchMatch[1];
    }
    
    return videoId;
}

// Event listener'ları ekle
function setupEventListeners() {
    console.log('Event listener\'lar ayarlanıyor...');
    
    // Sayfa formu gönderimi
    const pageForm = document.getElementById('pageForm');
    if (pageForm) {
        console.log('Sayfa formu bulundu, submit event listener ekleniyor');
        
        pageForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Sayfa formu gönderildi');
            
            const formData = new FormData(this);
            
            // Mevcut resimleri ve videoları formData'ya ekle
            const currentImages = document.querySelectorAll('#currentImages .media-item');
            const currentVideos = document.querySelectorAll('#currentVideos .media-item');
            
            if (currentImages.length > 0) {
                console.log('Mevcut resimler formData\'ya ekleniyor');
                const imageIds = Array.from(currentImages).map(item => item.dataset.id);
                formData.append('currentImages', JSON.stringify(imageIds));
            }
            
            if (currentVideos.length > 0) {
                console.log('Mevcut videolar formData\'ya ekleniyor');
                const videoIds = Array.from(currentVideos).map(item => item.dataset.id);
                formData.append('currentVideos', JSON.stringify(videoIds));
            }
            
            // Sayfa oluştur veya güncelle
            await createOrUpdatePage(formData);
        });
    } else {
        console.error('Sayfa formu bulunamadı!');
    }
    
    // Sayfa oluşturma butonu
    const createPageBtn = document.getElementById('createPageBtn');
    if (createPageBtn) {
        console.log('Sayfa oluşturma butonu bulundu, click event listener ekleniyor');
        
        createPageBtn.addEventListener('click', function() {
            togglePageForm(true);
        });
    } else {
        console.warn('Sayfa oluşturma butonu bulunamadı!');
    }
    
    // Form iptal butonu
    const cancelFormBtn = document.getElementById('cancelForm');
    if (cancelFormBtn) {
        console.log('Form iptal butonu bulundu, click event listener ekleniyor');
        
        cancelFormBtn.addEventListener('click', function() {
            togglePageForm(false);
        });
    } else {
        console.warn('Form iptal butonu bulunamadı!');
    }
    
    // Sayfa silme butonu
    const deletePageBtn = document.getElementById('deletePageBtn');
    if (deletePageBtn) {
        console.log('Sayfa silme butonu bulundu, click event listener ekleniyor');
        
        deletePageBtn.addEventListener('click', function() {
            if (currentEditingPageId) {
                const confirmDelete = confirm('Bu sayfayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.');
                if (confirmDelete) {
                    deletePage(currentEditingPageId);
                }
            } else {
                showAlert('warning', 'Silinecek sayfa bulunamadı.');
            }
        });
    } else {
        console.warn('Sayfa silme butonu bulunamadı!');
    }
    
    // Sortable'ı başlat
    initSortable();
    
    console.log('Tüm event listener\'lar eklendi');
}

// Kimlik doğrulama kontrolü
async function checkAuth() {
    try {
        // URL'den token parametresini kontrol et
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        
        // URL'de token varsa localStorage'a kaydet
        if (tokenParam) {
            console.log('URL\'den token alındı');
            localStorage.setItem('token', tokenParam);
            // URL'den token parametresini temizle
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // LocalStorage'dan token'ı al
        token = localStorage.getItem('token');
        
        if (!token) {
            console.log('Token bulunamadı, login sayfasına yönlendiriliyor');
            window.location.href = 'login.html';
            return false;
        }
        
        // Token doğrulama
        const isAuthenticated = await verifyToken();
        if (!isAuthenticated) {
            console.log('Token geçersiz, login sayfasına yönlendiriliyor');
            return false; // verifyToken fonksiyonu zaten yönlendirme yapacak
        }
        
        return true;
    } catch (error) {
        console.error('Kimlik doğrulama hatası:', error);
        return false;
    }
}