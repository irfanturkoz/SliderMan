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