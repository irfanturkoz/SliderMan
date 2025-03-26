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
            slide.classList.remove('active');
            slide.style.opacity = '0';
            slide.style.zIndex = '0';
            slide.style.visibility = 'hidden'; // Görünürlüğü tamamen kapat
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
        
        // Önceki zamanlayıcıyı temizle
        clearTimer();
        
        // Geçiş durumunu güncelle
        isTransitioning = true;
        console.log(`SliderMan: Slide #${index} geçişi başladı`);
        
        // Tüm videoları durdur ve sıfırla
        resetAllVideos();
        
        // Tüm slide'ları gizle
        hideAllSlides();
        
        // Hedef slide'ı aktifleştir
        const targetSlide = slides[index];
        targetSlide.classList.add('active');
        targetSlide.style.zIndex = '10';
        targetSlide.style.visibility = 'visible'; // Önce görünürlüğü aç
        
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
    
    // Buton tıklama olayları
    if (prevButton) {
        prevButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('SliderMan: Önceki butonu tıklandı');
            prevSlide();
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('SliderMan: Sonraki butonu tıklandı');
            nextSlide();
        });
    }
    
    // Klavye kontrolleri
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });
    
    // Slider'ı başlat
    if (slides && slides.length > 0) {
        // Önce tüm slide'ları gizle
        hideAllSlides();
        
        // Kısa bir gecikme sonra ilk slide'ı göster
        setTimeout(() => {
            activateSlide(0);
        }, 500);
        
        console.log(`SliderMan: Başlatıldı, toplam ${slides.length} slide var`);
    } else {
        console.error('SliderMan: Hiç slide bulunamadı!');
    }
});
