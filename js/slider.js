/**
 * SliderMan - Ultra Basit ve Kesin Çalışan Sürüm
 * Resimlerin iç içe görünme sorunu tamamen çözüldü
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('SliderMan: Ultra basit sürüm başlatılıyor...');
    
    // Slider elemanlarını seç
    const slider = document.getElementById('slider');
    const prevButton = document.querySelector('.prev-slide');
    const nextButton = document.querySelector('.next-slide');
    
    // Değişkenler
    let currentIndex = 0;
    let slides = [];
    let slideTimer = null;
    let isTransitioning = false;
    let transitionInterval = 20000; // 20 saniye
    
    // Geçiş süresini HTML'den al
    if (slider && slider.dataset.transitionInterval) {
        const parsedInterval = parseInt(slider.dataset.transitionInterval);
        if (!isNaN(parsedInterval) && parsedInterval > 0) {
            transitionInterval = parsedInterval;
        }
    }
    
    // Slider'ı başlat
    function initSlider() {
        // Slide'ları topla
        slides = document.querySelectorAll('.slider-slide');
        
        if (slides.length === 0) {
            console.log('SliderMan: Hiç slide bulunamadı, 500ms sonra tekrar denenecek');
            setTimeout(initSlider, 500);
            return;
        }
        
        console.log(`SliderMan: ${slides.length} slide bulundu`);
        
        // Tüm slide'ları gizle
        slides.forEach(slide => {
            slide.style.display = 'none';
            slide.style.opacity = '0';
            slide.classList.remove('active');
        });
        
        // İlk slide'ı göster
        if (slides.length > 0) {
            showSlide(0);
        }
        
        // Buton event listener'ları
        if (prevButton) {
            prevButton.addEventListener('click', function(e) {
                e.preventDefault();
                prevSlide();
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', function(e) {
                e.preventDefault();
                nextSlide();
            });
        }
        
        // Klavye kontrolleri
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        });
    }
    
    // Slide gösterme fonksiyonu
    function showSlide(index) {
        // Geçiş sırasında yeni geçişleri engelle
        if (isTransitioning) return;
        
        // Geçerli bir index değilse işlem yapma
        if (index < 0 || index >= slides.length) return;
        
        console.log(`SliderMan: Slide #${index} gösteriliyor`);
        
        // Geçiş durumunu güncelle
        isTransitioning = true;
        
        // Zamanlayıcıyı temizle
        clearTimeout(slideTimer);
        
        // Tüm videoları durdur
        document.querySelectorAll('video').forEach(video => {
            try {
                video.pause();
                video.currentTime = 0;
                video.onended = null;
                video.onerror = null;
            } catch (e) {}
        });
        
        // Tüm slide'ları gizle
        slides.forEach(slide => {
            slide.style.display = 'none';
            slide.style.opacity = '0';
            slide.classList.remove('active');
        });
        
        // Hedef slide'ı göster
        const targetSlide = slides[index];
        targetSlide.style.display = 'block';
        
        // Kısa bir gecikme sonra görünür yap
        setTimeout(() => {
            targetSlide.classList.add('active');
            targetSlide.style.opacity = '1';
            
            // Geçiş tamamlandıktan sonra
            setTimeout(() => {
                isTransitioning = false;
                currentIndex = index;
                
                // Video mu resim mi kontrol et
                const video = targetSlide.querySelector('video');
                if (video) {
                    handleVideo(video);
                } else {
                    handleImage();
                }
            }, 1000);
        }, 50);
    }
    
    // Video işleme
    function handleVideo(video) {
        video.muted = true;
        
        // Video bittiğinde sonraki slide'a geç
        video.onended = () => nextSlide();
        
        // Video hata verdiğinde sonraki slide'a geç
        video.onerror = () => nextSlide();
        
        // Videoyu oynat
        try {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => nextSlide());
            }
        } catch (e) {
            nextSlide();
        }
    }
    
    // Resim işleme
    function handleImage() {
        // Resim için zamanlayıcı oluştur
        slideTimer = setTimeout(() => {
            nextSlide();
        }, transitionInterval);
    }
    
    // Sonraki slide'a geç
    function nextSlide() {
        if (slides.length <= 1) return;
        const nextIndex = (currentIndex + 1) % slides.length;
        showSlide(nextIndex);
    }
    
    // Önceki slide'a geç
    function prevSlide() {
        if (slides.length <= 1) return;
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(prevIndex);
    }
    
    // Slider'ı başlat
    initSlider();
});
