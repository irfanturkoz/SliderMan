// Slider yönetimi
document.addEventListener('DOMContentLoaded', function() {
    console.log('Slider JS yüklendi');
    
    // Slider elemanlarını seç
    const slider = document.getElementById('slider');
    const slides = document.querySelectorAll('.slider-slide');
    const prevButton = document.querySelector('.prev-slide');
    const nextButton = document.querySelector('.next-slide');
    
    // Değişkenler
    let currentSlide = 0;
    let slideTimer = null;
    let isTransitioning = false;
    let slideStartTime = 0;
    
    // Geçiş süresini HTML'den al veya varsayılan değeri kullan
    let transitionInterval = 20000; // Varsayılan değer: 20 saniye
    
    if (slider && slider.dataset.transitionInterval) {
        const parsedInterval = parseInt(slider.dataset.transitionInterval);
        if (!isNaN(parsedInterval) && parsedInterval > 0) {
            transitionInterval = parsedInterval;
        }
    }
    
    console.log('Slider geçiş süresi:', transitionInterval, 'ms');

    // Zamanlayıcıyı temizle
    function clearSlideTimer() {
        if (slideTimer) {
            clearTimeout(slideTimer);
            slideTimer = null;
            console.log('Zamanlayıcı temizlendi');
        }
    }

    // Tüm videoları durdur
    function stopAllVideos() {
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(video => {
            try {
                video.pause();
                video.currentTime = 0;
                video.onended = null;
            } catch (e) {
                console.error('Video durdurma hatası:', e);
            }
        });
        console.log('Tüm videolar durduruldu');
    }

    // Tüm slide'ları gizle
    function hideAllSlides() {
        slides.forEach(slide => {
            slide.classList.remove('active');
            slide.style.opacity = '0';
            slide.style.zIndex = '0';
        });
        console.log('Tüm slide\'lar gizlendi');
    }

    // Slide'ı aktifleştir
    function activateSlide(index) {
        // Geçiş sırasında yeni geçişleri engelle
        if (isTransitioning) {
            console.log('Geçiş sırasında yeni geçiş isteği iptal edildi');
            return;
        }

        // Geçerli bir index değilse işlem yapma
        if (!slides || slides.length === 0 || index < 0 || index >= slides.length) {
            console.error('Geçersiz slide index:', index);
            return;
        }

        // Önceki zamanlayıcıyı temizle
        clearSlideTimer();

        // Geçiş durumunu güncelle
        isTransitioning = true;
        console.log('Geçiş başladı, hedef slide:', index);
        
        // Tüm videoları durdur
        stopAllVideos();
        
        // Tüm slide'ları gizle
        hideAllSlides();
        
        // Hedef slide'ı görünür yap
        const targetSlide = slides[index];
        targetSlide.classList.add('active');
        targetSlide.style.zIndex = '10';
        
        // Slide başlangıç zamanını kaydet
        slideStartTime = new Date().getTime();
        
        // Kısa bir gecikme sonra opacity'yi artır (daha akıcı geçiş için)
        setTimeout(() => {
            targetSlide.style.transition = 'opacity 1s ease-in';
            targetSlide.style.opacity = '1';
            
            // Geçiş tamamlandıktan sonra medyayı başlat
            setTimeout(() => {
                isTransitioning = false;
                currentSlide = index;
                console.log('Geçiş tamamlandı, yeni aktif slide:', index);
                
                // Medyayı başlat
                const video = targetSlide.querySelector('video');
                if (video) {
                    handleVideoSlide(video);
                } else {
                    handleImageSlide();
                }
            }, 1000); // 1 saniye geçiş süresi
        }, 100);
    }
    
    // Video slide işleme
    function handleVideoSlide(video) {
        console.log('Video slide aktif edildi');
        video.muted = true;
        
        // Video bittiğinde sonraki slide'a geç
        video.onended = function() {
            console.log('Video bitti, sonraki slide\'a geçiliyor');
            nextSlide();
        };
        
        // Videoyu oynat
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.error('Video oynatma hatası:', err);
                // Video oynatılamazsa, bir sonraki slide'a geç
                setTimeout(nextSlide, transitionInterval);
            });
        }
    }
    
    // Resim slide işleme
    function handleImageSlide() {
        console.log('Resim slide aktif edildi, ' + transitionInterval + 'ms sonra geçilecek');
        
        // Resim için zamanlayıcı oluştur - KESİN OLARAK 20 SANİYE DURMASINI SAĞLA
        clearSlideTimer(); // Önceki zamanlayıcıyı temizle
        
        slideTimer = setTimeout(() => {
            console.log('Resim süresi doldu, sonraki slide\'a geçiliyor');
            nextSlide();
        }, transitionInterval);
    }
    
    // Zamanlayıcıyı kontrol et (her 5 saniyede bir)
    function checkTimer() {
        if (isTransitioning || !slides || slides.length <= 0) return;
        
        const currentTime = new Date().getTime();
        const elapsedTime = currentTime - slideStartTime;
        
        // Eğer aktif slide resim ise ve süre aşıldıysa
        const activeSlide = document.querySelector('.slider-slide.active');
        if (activeSlide && !activeSlide.querySelector('video') && elapsedTime >= transitionInterval) {
            console.log('Zamanlayıcı kontrolü: Süre aşıldı, sonraki slide\'a geçiliyor');
            nextSlide();
        }
    }
    
    // Periyodik olarak zamanlayıcıyı kontrol et
    setInterval(checkTimer, 5000);

    // Sonraki slide'a geç
    function nextSlide() {
        if (isTransitioning || !slides || slides.length <= 1) {
            return;
        }
        
        const nextIndex = (currentSlide + 1) % slides.length;
        activateSlide(nextIndex);
    }
    
    // Önceki slide'a geç
    function prevSlide() {
        if (isTransitioning || !slides || slides.length <= 1) {
            return;
        }
        
        const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
        activateSlide(prevIndex);
    }

    // Buton tıklama olayları
    if (prevButton) {
        prevButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Önceki slide butonu tıklandı');
            prevSlide();
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Sonraki slide butonu tıklandı');
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
        
        console.log('Slider başlatıldı, toplam slide sayısı:', slides.length);
    } else {
        console.error('Slider öğeleri bulunamadı!');
    }
});
