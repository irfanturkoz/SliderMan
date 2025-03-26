/**
 * SliderMan - Ultra Basit Slider
 * Resimlerin iç içe geçme ve videoya hızlı geçiş sorunları tamamen çözüldü
 */

(function() {
    'use strict';
    
    // Sayfa yüklendiğinde başlat
    document.addEventListener('DOMContentLoaded', initSlider);
    
    // Değişkenler
    let slider;                // Slider konteyneri
    let slides = [];           // Tüm slide'lar
    let currentIndex = 0;      // Mevcut slide indeksi
    let isTransitioning = false; // Geçiş durumu
    let slideTimer = null;     // Zamanlayıcı
    let transitionInterval = 20000; // Varsayılan geçiş süresi (20 saniye)
    let slideStartTime = 0;    // Slide başlangıç zamanı
    
    /**
     * Slider'ı başlat
     */
    function initSlider() {
        console.log('SliderMan: Başlatılıyor...');
        
        // Slider elemanlarını seç
        slider = document.getElementById('slider');
        if (!slider) {
            console.error('SliderMan: Slider konteyneri bulunamadı!');
            return;
        }
        
        // Geçiş süresini al
        if (slider.dataset.transitionInterval) {
            const interval = parseInt(slider.dataset.transitionInterval);
            if (!isNaN(interval) && interval > 0) {
                transitionInterval = interval;
            }
        }
        console.log(`SliderMan: Geçiş süresi ${transitionInterval}ms olarak ayarlandı`);
        
        // Slide'ları topla
        slides = Array.from(document.querySelectorAll('.slider-slide, .slider-item'));
        
        // Slide bulunamadıysa, 500ms sonra tekrar dene
        if (slides.length === 0) {
            console.log('SliderMan: Slide bulunamadı, 500ms sonra tekrar deneniyor...');
            setTimeout(initSlider, 500);
            return;
        }
        
        console.log(`SliderMan: ${slides.length} slide bulundu`);
        
        // Tüm slide'ları gizle
        hideAllSlides();
        
        // İlk slide'ı göster (500ms gecikme ile)
        setTimeout(() => {
            showSlide(0);
        }, 500);
        
        // Kontrol butonlarını ayarla
        setupControls();
        
        // Periyodik kontrol başlat
        setInterval(checkTimer, 5000);
        
        // Tüm videoları durdur ve başlangıç durumuna getir
        stopAllVideos();
    }
    
    /**
     * Kontrol butonlarını ayarla
     */
    function setupControls() {
        // İleri/geri butonları
        const prevButton = document.querySelector('.prev-slide');
        const nextButton = document.querySelector('.next-slide');
        
        if (prevButton) {
            prevButton.addEventListener('click', (e) => {
                e.preventDefault();
                prevSlide();
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', (e) => {
                e.preventDefault();
                nextSlide();
            });
        }
        
        // Klavye kontrolleri
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        });
    }
    
    /**
     * Tüm slide'ları gizle
     */
    function hideAllSlides() {
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
    }
    
    /**
     * Slide göster
     * @param {number} index - Gösterilecek slide'ın indeksi
     */
    function showSlide(index) {
        // Geçiş sırasında yeni geçişleri engelle
        if (isTransitioning) {
            console.log('SliderMan: Geçiş sırasında, yeni geçiş engellendi');
            return;
        }
        
        // Geçerli bir indeks değilse işlem yapma
        if (index < 0 || index >= slides.length) {
            console.error(`SliderMan: Geçersiz slide indeksi: ${index}`);
            return;
        }
        
        console.log(`SliderMan: Slide #${index} gösteriliyor`);
        
        // Geçiş durumunu güncelle
        isTransitioning = true;
        
        // Zamanlayıcıyı temizle
        clearTimeout(slideTimer);
        slideTimer = null;
        
        // Tüm videoları durdur
        stopAllVideos();
        
        // Tüm slide'ları gizle
        hideAllSlides();
        
        // Yeni slide'ı göster
        const targetSlide = slides[index];
        targetSlide.classList.add('active');
        
        // Geçiş tamamlandıktan sonra (1 saniye)
        setTimeout(() => {
            // Geçiş durumunu güncelle
            isTransitioning = false;
            currentIndex = index;
            slideStartTime = Date.now();
            
            // Slide türüne göre işlem yap
            const video = targetSlide.querySelector('video');
            if (video) {
                handleVideoSlide(video);
            } else {
                handleImageSlide();
            }
            
            console.log(`SliderMan: Slide #${index} geçişi tamamlandı`);
        }, 1000);
    }
    
    /**
     * Tüm videoları durdur
     */
    function stopAllVideos() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            try {
                video.pause();
                video.currentTime = 0;
                // Event listener'ları temizle
                video.onended = null;
                video.onerror = null;
            } catch (e) {
                console.error('SliderMan: Video durdurma hatası', e);
            }
        });
    }
    
    /**
     * Video slide işle
     * @param {HTMLVideoElement} video - Video elementi
     */
    function handleVideoSlide(video) {
        console.log('SliderMan: Video slide işleniyor');
        
        // Videoyu sessiz yap
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
                playPromise.catch(error => {
                    console.error('SliderMan: Video oynatma hatası', error);
                    // Hata durumunda sonraki slide'a geç
                    slideTimer = setTimeout(nextSlide, 5000);
                });
            }
        } catch (e) {
            console.error('SliderMan: Video oynatma exception', e);
            // Hata durumunda sonraki slide'a geç
            slideTimer = setTimeout(nextSlide, 5000);
        }
    }
    
    /**
     * Resim slide işle
     */
    function handleImageSlide() {
        console.log('SliderMan: Resim işleniyor, zamanlayıcı başlatılıyor');
        
        // Resim için zamanlayıcı başlat
        slideTimer = setTimeout(() => {
            console.log('SliderMan: Resim zamanlayıcısı tamamlandı, sonraki slide\'a geçiliyor');
            nextSlide();
        }, transitionInterval);
    }
    
    /**
     * Zamanlayıcı kontrolü
     */
    function checkTimer() {
        // Geçiş sırasında kontrol etme
        if (isTransitioning) {
            return;
        }
        
        // Aktif slide'ı kontrol et
        const activeSlide = slides[currentIndex];
        if (!activeSlide) {
            return;
        }
        
        // Aktif slide'ın video olup olmadığını kontrol et
        const hasVideo = activeSlide.querySelector('video') !== null;
        
        // Eğer resim slide'ı ise ve zamanlayıcı yoksa
        if (!hasVideo && !slideTimer) {
            // Geçen süreyi hesapla
            const elapsedTime = Date.now() - slideStartTime;
            
            // Eğer geçen süre geçiş süresinden fazlaysa, sonraki slide'a geç
            if (elapsedTime >= transitionInterval) {
                console.log('SliderMan: Zamanlayıcı kontrolü - Süre doldu, sonraki slide\'a geçiliyor');
                nextSlide();
            } else {
                // Aksi halde yeni bir zamanlayıcı başlat
                const remainingTime = transitionInterval - elapsedTime;
                console.log(`SliderMan: Zamanlayıcı kontrolü - Kalan süre: ${remainingTime}ms`);
                slideTimer = setTimeout(nextSlide, remainingTime);
            }
        }
    }
    
    /**
     * Sonraki slide'a geç
     */
    function nextSlide() {
        const nextIndex = (currentIndex + 1) % slides.length;
        showSlide(nextIndex);
    }
    
    /**
     * Önceki slide'a geç
     */
    function prevSlide() {
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(prevIndex);
    }
})();
