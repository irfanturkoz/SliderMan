// Slider yönetimi
document.addEventListener('DOMContentLoaded', function() {
    console.log('Slider JS yüklendi');
    
    // Slider elemanlarını seç
    const slider = document.getElementById('slider');
    const slides = document.querySelectorAll('.slider-item');
    const prevButton = document.querySelector('.prev-slide');
    const nextButton = document.querySelector('.next-slide');
    
    console.log('Slider elemanları:', {
        slider: slider ? 'Bulundu' : 'Bulunamadı',
        slides: slides.length + ' adet bulundu',
        prevButton: prevButton ? 'Bulundu' : 'Bulunamadı',
        nextButton: nextButton ? 'Bulundu' : 'Bulunamadı'
    });
    
    // Değişkenler
    let currentSlide = 0;
    let slideTimer = null;
    
    // Geçiş süresini HTML'den al
    let transitionInterval = 5000; // Varsayılan değer: 5 saniye
    
    if (slider && slider.dataset.transitionInterval) {
        transitionInterval = parseInt(slider.dataset.transitionInterval) || 5000;
    }
    
    console.log('Slider geçiş süresi:', transitionInterval, 'ms');

    // Tüm videoları başlangıçta devre dışı bırak
    function disableAllVideos() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
            video.muted = true;
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
        // Geçerli bir index değilse işlem yapma
        if (!slides || slides.length === 0 || index < 0 || index >= slides.length) {
            console.error('Geçersiz slide index:', index);
            return;
        }

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
        
        console.log('Aktif slide değişti:', index);

        // Aktif slide'daki medyayı başlat
        const activeSlide = slides[index];
        const video = activeSlide.querySelector('video');
        
        if (video) {
            // Video varsa
            console.log('Video slide aktif edildi');
            video.currentTime = 0;
            video.muted = true; // Videoyu sessiz yap
            
            // Video oynatma butonunu ekle
            const playButton = document.createElement('button');
            playButton.className = 'video-play-button';
            playButton.innerHTML = '<i class="fas fa-play"></i>';
            playButton.style.position = 'absolute';
            playButton.style.top = '50%';
            playButton.style.left = '50%';
            playButton.style.transform = 'translate(-50%, -50%)';
            playButton.style.fontSize = '48px';
            playButton.style.color = 'white';
            playButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            playButton.style.border = 'none';
            playButton.style.borderRadius = '50%';
            playButton.style.width = '80px';
            playButton.style.height = '80px';
            playButton.style.cursor = 'pointer';
            playButton.style.zIndex = '10';
            
            // Varsa önceki play butonunu kaldır
            const existingButton = activeSlide.querySelector('.video-play-button');
            if (existingButton) {
                existingButton.remove();
            }
            
            activeSlide.appendChild(playButton);
            
            // Play butonuna tıklama olayı ekle
            playButton.addEventListener('click', function() {
                video.play()
                    .then(() => {
                        console.log('Video manuel olarak oynatılıyor');
                        playButton.style.display = 'none'; // Butonu gizle
                    })
                    .catch(err => {
                        console.error('Video oynatma hatası:', err);
                    });
            });

            // Video bittiğinde sonraki slide'a geç
            video.onended = function() {
                console.log('Video bitti, sonraki slide\'a geçiliyor');
                nextSlide();
            };
            
            // Belirli bir süre sonra otomatik olarak bir sonraki slide'a geç
            // Kullanıcı videoyu oynatmasa bile slider çalışmaya devam etsin
            slideTimer = setTimeout(nextSlide, transitionInterval);
        } else {
            // Resim varsa transitionInterval süresi sonra geç
            console.log('Resim slide aktif edildi, ' + transitionInterval + 'ms sonra geçilecek');
            slideTimer = setTimeout(nextSlide, transitionInterval);
        }
    }

    // Sonraki slide'a geç
    function nextSlide() {
        if (!slides || slides.length <= 1) return;
        const nextIndex = (currentSlide + 1) % slides.length;
        activateSlide(nextIndex);
    }

    // Event listeners - sadece butonlar varsa ekle
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            if (!slides || slides.length <= 1) return;
            const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
            activateSlide(prevIndex);
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', function() {
            nextSlide();
        });
    }

    // Sayfa yüklendiğinde
    if (slides && slides.length > 0) {
        disableAllVideos();
        activateSlide(0);
        console.log('Slider başlatıldı, toplam slide sayısı:', slides.length);
    } else {
        console.error('Slider öğeleri bulunamadı!');
    }
});
