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
    let slideStartTime = 0; // Slide başlangıç zamanı
    let timerCheckInterval = null; // Zamanlayıcı kontrol aralığı
    
    // Geçiş süresini HTML'den al
    if (slider && slider.dataset.transitionInterval) {
        const parsedInterval = parseInt(slider.dataset.transitionInterval);
        if (!isNaN(parsedInterval) && parsedInterval > 0) {
            transitionInterval = parsedInterval;
        }
    }
    
    console.log(`SliderMan: Geçiş süresi ${transitionInterval}ms olarak ayarlandı`);
    
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
        hideAllSlides();
        
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
        
        // Zamanlayıcı kontrolü için periyodik kontrol başlat
        timerCheckInterval = setInterval(checkTimer, 5000); // 5 saniyede bir kontrol et
    }
    
    // Tüm slide'ları gizle
    function hideAllSlides() {
        slides.forEach(slide => {
            slide.style.display = 'none';
            slide.style.opacity = '0';
            slide.classList.remove('active');
            slide.style.zIndex = '0';
        });
    }
    
    // Zamanlayıcı kontrolü
    function checkTimer() {
        if (isTransitioning || !slideStartTime) return;
        
        const currentSlide = slides[currentIndex];
        const isVideo = currentSlide.querySelector('video');
        
        // Sadece resim slide'ları için zamanlayıcı kontrolü yap
        if (!isVideo) {
            const elapsedTime = Date.now() - slideStartTime;
            console.log(`SliderMan: Zamanlayıcı kontrolü - Geçen süre: ${elapsedTime}ms / ${transitionInterval}ms`);
            
            // Süre dolmuşsa ve hala aynı slide'daysa bir sonraki slide'a geç
            if (elapsedTime >= transitionInterval) {
                console.log('SliderMan: Zamanlayıcı süresi doldu, sonraki slide\'a geçiliyor');
                nextSlide();
            }
        }
    }
    
    // Slide gösterme fonksiyonu
    function showSlide(index) {
        // Geçiş sırasında yeni geçişleri engelle
        if (isTransitioning) {
            console.log('SliderMan: Geçiş sırasında, yeni geçiş isteği engellendi');
            return;
        }
        
        // Geçerli bir index değilse işlem yapma
        if (index < 0 || index >= slides.length) return;
        
        console.log(`SliderMan: Slide #${index} gösteriliyor`);
        
        // Geçiş durumunu güncelle
        isTransitioning = true;
        
        // Zamanlayıcıyı temizle
        clearTimeout(slideTimer);
        slideTimer = null;
        
        // Tüm videoları durdur
        document.querySelectorAll('video').forEach(video => {
            try {
                video.pause();
                video.currentTime = 0;
                video.onended = null;
                video.onerror = null;
            } catch (e) {
                console.log('SliderMan: Video durdurma hatası', e);
            }
        });
        
        // Tüm slide'ları gizle
        hideAllSlides();
        
        // Hedef slide'ı göster
        const targetSlide = slides[index];
        targetSlide.style.display = 'block';
        targetSlide.style.zIndex = '10'; // Aktif slide için daha yüksek z-index
        
        // Kısa bir gecikme sonra görünür yap (CSS geçişi için)
        setTimeout(() => {
            targetSlide.classList.add('active');
            targetSlide.style.opacity = '1';
            
            // Geçiş tamamlandıktan sonra (CSS transition süresi 1s)
            setTimeout(() => {
                isTransitioning = false;
                currentIndex = index;
                slideStartTime = Date.now(); // Slide başlangıç zamanını kaydet
                
                // Video mu resim mi kontrol et
                const video = targetSlide.querySelector('video');
                if (video) {
                    handleVideoSlide(video);
                } else {
                    handleImageSlide();
                }
                
                console.log(`SliderMan: Slide #${index} geçişi tamamlandı`);
            }, 1000); // CSS transition süresi
        }, 100); // Kısa gecikme
    }
    
    // Video slide işleme
    function handleVideoSlide(video) {
        console.log('SliderMan: Video slide işleniyor');
        video.muted = true;
        
        // Video bittiğinde sonraki slide'a geç
        video.onended = () => {
            console.log('SliderMan: Video bitti, sonraki slide\'a geçiliyor');
            nextSlide();
        };
        
        // Video hata verdiğinde sonraki slide'a geç
        video.onerror = () => {
            console.log('SliderMan: Video hatası, sonraki slide\'a geçiliyor');
            nextSlide();
        };
        
        // Videoyu oynat
        try {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.log('SliderMan: Video oynatma hatası', error);
                    // Video oynatılamazsa, belirli bir süre sonra sonraki slide'a geç
                    slideTimer = setTimeout(() => nextSlide(), transitionInterval);
                });
            }
        } catch (e) {
            console.log('SliderMan: Video oynatma exception', e);
            // Hata durumunda sonraki slide'a geç
            slideTimer = setTimeout(() => nextSlide(), transitionInterval);
        }
    }
    
    // Resim slide işleme
    function handleImageSlide() {
        console.log('SliderMan: Resim slide işleniyor, zamanlayıcı başlatılıyor');
        
        // Resim için zamanlayıcı oluştur
        slideTimer = setTimeout(() => {
            console.log('SliderMan: Resim zamanlayıcısı tamamlandı, sonraki slide\'a geçiliyor');
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
