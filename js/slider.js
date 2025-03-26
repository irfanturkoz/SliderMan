/**
 * SliderMan - Modern ve Güvenilir Slider Yönetimi
 * Resimler 20 saniye gösterilir, videolar kendi süresinde oynatılır
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('SliderMan başlatılıyor...');
    
    // Temel elemanları seç
    const slider = document.getElementById('slider');
    const slides = document.querySelectorAll('.slider-slide');
    const prevButton = document.querySelector('.prev-slide');
    const nextButton = document.querySelector('.next-slide');
    
    // Durum değişkenleri
    let currentIndex = 0;
    let isTransitioning = false;
    let slideTimer = null;
    let slideStartTime = null;
    let transitionInterval = 20000; // Varsayılan: 20 saniye
    
    // Geçiş süresini HTML'den al
    if (slider && slider.dataset.transitionInterval) {
        const parsedInterval = parseInt(slider.dataset.transitionInterval);
        if (!isNaN(parsedInterval) && parsedInterval > 0) {
            transitionInterval = parsedInterval;
        }
    }
    
    console.log(`SliderMan: Geçiş süresi ${transitionInterval}ms olarak ayarlandı`);
    
    /**
     * Zamanlayıcıyı temizle
     */
    function clearTimer() {
        if (slideTimer) {
            clearTimeout(slideTimer);
            slideTimer = null;
            console.log('SliderMan: Zamanlayıcı temizlendi');
        }
    }
    
    /**
     * Tüm videoları durdur ve event listener'ları temizle
     */
    function resetAllVideos() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            try {
                // Video oynatmayı durdur
                video.pause();
                video.currentTime = 0;
                
                // Event listener'ları temizle
                video.onended = null;
                video.onplay = null;
                video.onpause = null;
                video.onerror = null;
            } catch (err) {
                console.error('SliderMan: Video sıfırlama hatası', err);
            }
        });
        console.log('SliderMan: Tüm videolar sıfırlandı');
    }
    
    /**
     * Tüm slide'ları gizle
     */
    function hideAllSlides() {
        slides.forEach(slide => {
            // Önce tüm CSS sınıflarını kaldır
            slide.classList.remove('active');
            
            // Sonra tüm stil özelliklerini sıfırla
            slide.style.display = 'none';
            slide.style.opacity = '0';
            slide.style.zIndex = '0';
            slide.style.visibility = 'hidden';
            
            // Medya elementlerini durdur
            const video = slide.querySelector('video');
            if (video) {
                try {
                    video.pause();
                    video.currentTime = 0;
                } catch (err) {
                    console.error('SliderMan: Video durdurma hatası', err);
                }
            }
        });
        console.log('SliderMan: Tüm slide\'lar gizlendi');
    }
    
    /**
     * Belirli bir slide'ı aktifleştir
     */
    function activateSlide(index) {
        // Geçiş sırasında yeni geçişleri engelle
        if (isTransitioning) {
            console.log('SliderMan: Geçiş sırasında yeni geçiş engellendi');
            return;
        }
        
        // Geçerli bir index değilse işlem yapma
        if (!slides || slides.length === 0 || index < 0 || index >= slides.length) {
            console.error('SliderMan: Geçersiz slide index', index);
            return;
        }
        
        // Önceki zamanlayıcıyı temizle ve başlangıç zamanını kaydet
        clearTimer();
        slideStartTime = Date.now();
        
        // Geçiş durumunu güncelle
        isTransitioning = true;
        console.log(`SliderMan: Slide #${index} geçişi başladı`);
        
        // Tüm videoları durdur ve sıfırla
        resetAllVideos();
        
        // Tüm slide'ları gizle
        hideAllSlides();
        
        // Hedef slide'ı aktifleştir
        const targetSlide = slides[index];
        
        // Önce görünürlük ve display ayarla
        targetSlide.style.display = 'block';
        targetSlide.style.visibility = 'visible';
        targetSlide.style.zIndex = '10';
        
        // Sonra CSS sınıfını ekle
        targetSlide.classList.add('active');
        
        // Kısa bir gecikme sonra opacity'yi artır (daha akıcı geçiş için)
        setTimeout(() => {
            targetSlide.style.opacity = '1';
            
            // Geçiş tamamlandıktan sonra
            setTimeout(() => {
                // Geçiş durumunu güncelle
                isTransitioning = false;
                currentIndex = index;
                console.log(`SliderMan: Slide #${index} geçişi tamamlandı`);
                
                // Slide türüne göre işlem yap
                const video = targetSlide.querySelector('video');
                if (video) {
                    handleVideoSlide(video);
                } else {
                    handleImageSlide();
                }
            }, 1000); // 1 saniye geçiş süresi
        }, 100);
    }
    
    /**
     * Video slide'ı yönet
     */
    function handleVideoSlide(video) {
        console.log('SliderMan: Video slide aktif edildi');
        
        // Videoyu sessiz yap
        video.muted = true;
        
        // Video bittiğinde sonraki slide'a geç
        video.onended = () => {
            console.log('SliderMan: Video tamamlandı, sonraki slide\'a geçiliyor');
            nextSlide();
        };
        
        // Video hata verdiğinde sonraki slide'a geç
        video.onerror = () => {
            console.error('SliderMan: Video oynatma hatası, sonraki slide\'a geçiliyor');
            nextSlide();
        };
        
        // Videoyu oynat
        try {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.error('SliderMan: Video oynatma hatası', err);
                    // Video oynatılamazsa, bir sonraki slide'a geç
                    nextSlide();
                });
            }
        } catch (err) {
            console.error('SliderMan: Video oynatma hatası', err);
            nextSlide();
        }
    }
    
    /**
     * Resim slide'ı yönet
     */
    function handleImageSlide() {
        console.log(`SliderMan: Resim slide aktif edildi, ${transitionInterval}ms sonra geçilecek`);
        
        // Resim için zamanlayıcı oluştur - KESİN OLARAK 20 SANİYE DURMASINI SAĞLA
        clearTimer();
        
        slideTimer = setTimeout(() => {
            console.log('SliderMan: Resim süresi doldu, sonraki slide\'a geçiliyor');
            nextSlide();
        }, transitionInterval);
    }
    
    /**
     * Zamanlayıcıyı kontrol et - resim süresi dolmuş mu?
     */
    function checkTimer() {
        if (!slideStartTime) return;
        
        // Aktif slide'ı kontrol et
        const activeSlide = document.querySelector('.slider-slide.active');
        if (!activeSlide) return;
        
        // Aktif slide bir video mu?
        const hasVideo = activeSlide.querySelector('video') !== null;
        if (hasVideo) return; // Video ise zamanlayıcı kontrolü yapma
        
        // Geçen süreyi hesapla
        const elapsedTime = Date.now() - slideStartTime;
        
        // Süre dolmuş mu kontrol et
        if (elapsedTime >= transitionInterval) {
            console.log(`SliderMan: Zamanlayıcı kontrolü - Süre dolmuş (${elapsedTime}ms), sonraki slide'a geçiliyor`);
            nextSlide();
        } else {
            console.log(`SliderMan: Zamanlayıcı kontrolü - Süre devam ediyor (${elapsedTime}ms / ${transitionInterval}ms)`);
        }
    }
    
    // Periyodik olarak zamanlayıcıyı kontrol et
    setInterval(checkTimer, 5000); // Her 5 saniyede bir kontrol et
    
    /**
     * Sonraki slide'a geç
     */
    function nextSlide() {
        if (isTransitioning || !slides || slides.length <= 1) {
            return;
        }
        
        const nextIndex = (currentIndex + 1) % slides.length;
        activateSlide(nextIndex);
    }
    
    /**
     * Önceki slide'a geç
     */
    function prevSlide() {
        if (isTransitioning || !slides || slides.length <= 1) {
            return;
        }
        
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        activateSlide(prevIndex);
    }
    
    // İleri/geri butonları için event listener'lar
    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            nextSlide();
        });
    }
    
    if (prevButton) {
        prevButton.addEventListener('click', function(e) {
            e.preventDefault();
            prevSlide();
        });
    }
    
    // Klavye kontrollerini ekle
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            prevSlide();
        }
    });
    
    // İlk slide'ı göster
    if (slides.length > 0) {
        // Önce tüm slide'ları gizle
        hideAllSlides();
        
        // Kısa bir gecikme sonra ilk slide'ı göster
        setTimeout(() => {
            activateSlide(0);
        }, 100);
    }
});
