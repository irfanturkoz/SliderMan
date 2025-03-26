/**
 * SliderMan - Basit ve Güvenilir Slider Çözümü
 * Tamamen yeniden yazılmış sürüm - Sorunları kökten çözer
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('SliderMan: Basitleştirilmiş sürüm başlatılıyor...');
    
    // Temel elemanları seç
    const slider = document.getElementById('slider');
    const slides = document.querySelectorAll('.slider-slide');
    const prevButton = document.querySelector('.prev-slide');
    const nextButton = document.querySelector('.next-slide');
    
    // Durum değişkenleri
    let currentIndex = 0;
    let isTransitioning = false;
    let slideTimer = null;
    let transitionInterval = 20000; // 20 saniye
    
    // Geçiş süresini HTML'den al
    if (slider && slider.dataset.transitionInterval) {
        const parsedInterval = parseInt(slider.dataset.transitionInterval);
        if (!isNaN(parsedInterval) && parsedInterval > 0) {
            transitionInterval = parsedInterval;
        }
    }
    
    /**
     * Tüm slide'ları tamamen gizle
     */
    function hideAllSlides() {
        slides.forEach(slide => {
            // DOM'dan tamamen kaldır
            slide.style.display = 'none';
            slide.style.opacity = '0';
            slide.style.visibility = 'hidden';
            slide.classList.remove('active');
            
            // Video varsa durdur
            const video = slide.querySelector('video');
            if (video) {
                try {
                    video.pause();
                    video.currentTime = 0;
                    
                    // Event listener'ları temizle
                    video.onended = null;
                    video.onplay = null;
                    video.onerror = null;
                } catch (e) {
                    console.error('Video durdurma hatası:', e);
                }
            }
        });
    }
    
    /**
     * Zamanlayıcıyı temizle
     */
    function clearSlideTimer() {
        if (slideTimer) {
            clearTimeout(slideTimer);
            slideTimer = null;
        }
    }
    
    /**
     * Belirli bir slide'ı göster
     */
    function showSlide(index) {
        // Geçiş sırasında yeni geçişleri engelle
        if (isTransitioning) {
            return;
        }
        
        // Geçerli bir index değilse işlem yapma
        if (index < 0 || index >= slides.length) {
            return;
        }
        
        console.log(`SliderMan: Slide #${index} gösteriliyor`);
        
        // Geçiş durumunu güncelle
        isTransitioning = true;
        
        // Zamanlayıcıyı temizle
        clearSlideTimer();
        
        // Tüm slide'ları gizle
        hideAllSlides();
        
        // Hedef slide'ı seç
        const targetSlide = slides[index];
        
        // Önce DOM'a ekle
        targetSlide.style.display = 'block';
        targetSlide.style.visibility = 'visible';
        
        // Kısa bir gecikme sonra aktifleştir (DOM güncellemesi için)
        setTimeout(() => {
            // Aktif sınıfını ekle ve opacity'yi artır
            targetSlide.classList.add('active');
            targetSlide.style.opacity = '1';
            
            // Geçiş tamamlandıktan sonra
            setTimeout(() => {
                // Geçiş durumunu güncelle
                isTransitioning = false;
                currentIndex = index;
                
                // Slide türüne göre işlem yap
                const video = targetSlide.querySelector('video');
                if (video) {
                    handleVideoSlide(video);
                } else {
                    handleImageSlide();
                }
            }, 1000); // 1 saniye geçiş süresi
        }, 50);
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
            showNextSlide();
        };
        
        // Video hata verdiğinde sonraki slide'a geç
        video.onerror = () => {
            console.error('SliderMan: Video oynatma hatası, sonraki slide\'a geçiliyor');
            showNextSlide();
        };
        
        // Videoyu oynat
        try {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.error('SliderMan: Video oynatma hatası', err);
                    showNextSlide();
                });
            }
        } catch (err) {
            console.error('SliderMan: Video oynatma hatası', err);
            showNextSlide();
        }
    }
    
    /**
     * Resim slide'ı yönet
     */
    function handleImageSlide() {
        console.log(`SliderMan: Resim slide aktif edildi, ${transitionInterval}ms sonra geçilecek`);
        
        // Resim için zamanlayıcı oluştur
        clearSlideTimer();
        
        slideTimer = setTimeout(() => {
            console.log('SliderMan: Resim süresi doldu, sonraki slide\'a geçiliyor');
            showNextSlide();
        }, transitionInterval);
    }
    
    /**
     * Sonraki slide'a geç
     */
    function showNextSlide() {
        if (slides.length <= 1) return;
        
        const nextIndex = (currentIndex + 1) % slides.length;
        showSlide(nextIndex);
    }
    
    /**
     * Önceki slide'a geç
     */
    function showPrevSlide() {
        if (slides.length <= 1) return;
        
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(prevIndex);
    }
    
    // İleri/geri butonları için event listener'lar
    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            showNextSlide();
        });
    }
    
    if (prevButton) {
        prevButton.addEventListener('click', function(e) {
            e.preventDefault();
            showPrevSlide();
        });
    }
    
    // Klavye kontrollerini ekle
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            showNextSlide();
        } else if (e.key === 'ArrowLeft') {
            showPrevSlide();
        }
    });
    
    // Slider'ı başlat
    if (slides.length > 0) {
        // Önce tüm slide'ları gizle
        hideAllSlides();
        
        // Kısa bir gecikme sonra ilk slide'ı göster
        setTimeout(() => {
            showSlide(0);
        }, 100);
    }
});
