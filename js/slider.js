// Slider yönetimi
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.slider-container');
    const slides = document.querySelectorAll('.slider-item');
    const prevButton = document.querySelector('.slider-prev');
    const nextButton = document.querySelector('.slider-next');
    let currentSlide = 0;
    let slideTimer = null;
    let transitionInterval = 20000; // Varsayılan değer

    // Geçiş süresini ayarla
    function setTransitionInterval(interval) {
        transitionInterval = parseInt(interval) || 20000;
        console.log('Geçiş süresi ayarlandı:', transitionInterval, 'ms');
    }

    // Tüm videoları başlangıçta devre dışı bırak
    function disableAllVideos() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
            video.muted = true;
            video.loop = false;
        });
    }

    // Zamanlayıcıyı temizle
    function clearSlideTimer() {
        if (slideTimer) {
            clearTimeout(slideTimer);
            slideTimer = null;
        }
    }

    // Aktif slide'ı göster
    function activateSlide(index) {
        // Önceki zamanlayıcıyı temizle
        clearSlideTimer();

        // Tüm slide'ları deaktif et ve videoları durdur
        slides.forEach(slide => {
            slide.classList.remove('active');
            const video = slide.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
                video.onended = null;
            }
        });
        
        // Yeni slide'ı aktif et
        slides[index].classList.add('active');
        currentSlide = index;

        // Aktif slide'daki medyayı başlat
        const activeSlide = slides[index];
        const video = activeSlide.querySelector('video');
        
        if (video) {
            // Video varsa
            video.currentTime = 0;
            video.muted = true;
            video.loop = false;
            video.play();

            // Video bittiğinde sonraki slide'a geç
            video.onended = () => {
                nextSlide();
            };
        } else {
            // Resim varsa transitionInterval süresi sonra geç
            slideTimer = setTimeout(() => {
                nextSlide();
            }, transitionInterval);
        }
    }

    // Sonraki slide'a geç
    function nextSlide() {
        const nextIndex = (currentSlide + 1) % slides.length;
        activateSlide(nextIndex);
    }

    // Event listeners
    prevButton.addEventListener('click', () => {
        const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
        activateSlide(prevIndex);
    });

    nextButton.addEventListener('click', () => {
        nextSlide();
    });

    // Sayfa yüklendiğinde
    disableAllVideos();
    activateSlide(0);

    // Geçiş süresini ayarlamak için global fonksiyon
    window.setSliderTransitionInterval = setTransitionInterval;
});
