// API URL'sini belirle
const API_URL = 'http://localhost:10000/api';

async function updateAllMediaOrder() {
  try {
    const currentPageId = document.getElementById('pageId').value;
    if (!currentPageId) {
      throw new Error('Sayfa ID bulunamadı');
    }

    const allMediaList = document.getElementById('allMediaList');
    const mediaItems = allMediaList.children;
    const mixedOrder = [];

    // Her medya öğesi için sıralama bilgisini topla
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      const mediaId = item.dataset.id;
      const mediaType = item.dataset.type;
      mixedOrder.push(`${mediaType}:${mediaId}`);
    }

    console.log('Medya sıralaması güncelleniyor:');
    console.log('Sayfa ID:', currentPageId);
    console.log('Karışık sıralama:', mixedOrder);

    const response = await fetch('http://localhost:3000/api/pages/update-media-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        pageId: currentPageId,
        mixedOrder: mixedOrder
      })
    });

    if (!response.ok) {
      throw new Error('Medya sıralaması güncellenirken bir hata oluştu');
    }

    const data = await response.json();
    if (data.success) {
      console.log('Medya sıralaması başarıyla güncellendi');
      showAlert('success', 'Medya sıralaması güncellendi');
    } else {
      throw new Error(data.message || 'Medya sıralaması güncellenirken bir hata oluştu');
    }
  } catch (error) {
    console.error('Medya sıralaması güncelleme hatası:', error);
    showAlert('error', error.message);
    throw error;
  }
}

async function savePage() {
    try {
        const pageId = document.getElementById('pageId').value;
        const name = document.getElementById('pageName').value;
        const formData = new FormData();
        formData.append('name', name);

        // Dosyaları ekle
        const imageFiles = document.getElementById('imageInput').files;
        const videoFiles = document.getElementById('videoInput').files;

        for (let i = 0; i < imageFiles.length; i++) {
            formData.append('images', imageFiles[i]);
        }

        for (let i = 0; i < videoFiles.length; i++) {
            formData.append('videos', videoFiles[i]);
        }

        const url = pageId ? `${API_URL}/pages/${pageId}` : `${API_URL}/pages`;
        const method = pageId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            alert('Sayfa başarıyla kaydedildi!');
            // Sayfayı yeni sekmede aç
            window.open(data.htmlUrl, '_blank');
            // Sayfaları yeniden yükle
            loadPages();
        } else {
            alert('Sayfa kaydedilirken bir hata oluştu: ' + data.message);
        }
    } catch (error) {
        console.error('Sayfa kaydetme hatası:', error);
        alert('Sayfa kaydedilirken bir hata oluştu!');
    }
}

// Sayfa tıklama olayını yönet
function handlePageClick(event) {
    event.preventDefault();
    const pageUrl = event.currentTarget.href;
    window.open(pageUrl, '_blank');
}

// Sayfaları yükle
async function loadPages() {
    try {
        const response = await fetch(`${API_URL}/pages`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        if (data.success) {
            const pagesList = document.getElementById('pagesList');
            pagesList.innerHTML = '';

            data.pages.forEach(page => {
                const safeFileName = createSafeFileName(page.name);
                const htmlUrl = `http://localhost:10000/${safeFileName}.html`;

                const li = document.createElement('li');
                li.innerHTML = `
                    <a href="${htmlUrl}" onclick="handlePageClick(event)">${page.name}</a>
                    <button onclick="editPage('${page._id}')">Düzenle</button>
                    <button onclick="deletePage('${page._id}')">Sil</button>
                `;
                pagesList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Sayfalar yüklenirken hata:', error);
    }
} 