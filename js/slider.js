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
                handleVideo(video);
            } else {
                handleImage();
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
     * Video işle
     * @param {HTMLVideoElement} video - Video elementi
     */
    function handleVideo(video) {
        console.log('SliderMan: Video işleniyor');
        
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
     * Resim işle
     */
    function handleImage() {
        console.log('SliderMan: Resim işleniyor, zamanlayıcı başlatılıyor');
        
        // Resim için zamanlayıcı başlat
        slideTimer = setTimeout(() => {
            console.log('SliderMan: Resim süresi doldu, sonraki slide\'a geçiliyor');
            nextSlide();
        }, transitionInterval);
    }
    
    /**
     * Zamanlayıcı kontrolü
     */
    function checkTimer() {
        // Geçiş sırasında veya slide başlangıç zamanı yoksa kontrol etme
        if (isTransitioning || !slideStartTime) return;
        
        // Mevcut slide'ı al
        const currentSlide = slides[currentIndex];
        if (!currentSlide) return;
        
        // Video mu resim mi kontrol et
        const video = currentSlide.querySelector('video');
        
        // Sadece resimler için zamanlayıcı kontrolü yap
        if (!video) {
            const elapsedTime = Date.now() - slideStartTime;
            console.log(`SliderMan: Zamanlayıcı kontrolü - Geçen süre: ${elapsedTime}ms / ${transitionInterval}ms`);
            
            // Süre dolmuşsa sonraki slide'a geç
            if (elapsedTime >= transitionInterval) {
                console.log('SliderMan: Zamanlayıcı süresi doldu, sonraki slide\'a geçiliyor');
                nextSlide();
            }
        }
    }
    
    /**
     * Sonraki slide'a geç
     */
    function nextSlide() {
        if (slides.length <= 1) return;
        const nextIndex = (currentIndex + 1) % slides.length;
        showSlide(nextIndex);
    }
    
    /**
     * Önceki slide'a geç
     */
    function prevSlide() {
        if (slides.length <= 1) return;
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(prevIndex);
    }
})();
