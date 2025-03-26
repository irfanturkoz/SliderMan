// Slider yönetimi
document.addEventListener('DOMContentLoaded', function() {
    console.log('Slider JS yüklendi');
    
    // Slider elemanlarını seç
    const slider = document.getElementById('slider');
    const slides = document.querySelectorAll('.slider-slide');
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
    let isTransitioning = false; // Geçiş durumunu takip etmek için
    let slideStartTime = 0; // Slide'ın başlangıç zamanı
    let remainingTime = 0; // Kalan süre
    
    // Geçiş süresini HTML'den al veya varsayılan değeri kullan
    let transitionInterval = 20000; // Varsayılan değer: 20 saniye
    
    if (slider && slider.dataset.transitionInterval) {
        const parsedInterval = parseInt(slider.dataset.transitionInterval);
        if (!isNaN(parsedInterval) && parsedInterval > 0) {
            transitionInterval = parsedInterval;
        }
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
            console.log('Zamanlayıcı temizlendi');
        }
    }
    
    // Zamanlayıcı durumunu kontrol et ve güncelle
    function checkTimer() {
        if (isTransitioning) return;
        
        const currentTime = new Date().getTime();
        const elapsedTime = currentTime - slideStartTime;
        
        if (elapsedTime >= transitionInterval) {
            // Süre dolmuşsa sonraki slide'a geç
            console.log('Zamanlayıcı süresi doldu, sonraki slide\'a geçiliyor');
            nextSlide();
        } else {
            // Hala süre varsa, kalan süre için yeni bir zamanlayıcı oluştur
            remainingTime = transitionInterval - elapsedTime;
            console.log('Kalan süre:', remainingTime, 'ms');
            
            clearSlideTimer();
            slideTimer = setTimeout(function() {
                console.log('Resim süresi tamamlandı, sonraki slide\'a geçiliyor');
                nextSlide();
            }, remainingTime);
        }
    }

    // Aktif slide'ı göster
    function activateSlide(index) {
        // Eğer geçiş sırasındaysak, işlemi iptal et
        if (isTransitioning) {
            console.log('Geçiş sırasında yeni bir geçiş isteği iptal edildi');
            return;
        }
        
        // Geçerli bir index değilse işlem yapma
        if (!slides || slides.length === 0 || index < 0 || index >= slides.length) {
            console.error('Geçersiz slide index:', index);
            return;
        }

        // Önceki zamanlayıcıyı temizle
        clearSlideTimer();
        
        // Geçiş sırasında olduğumuzu belirt
        isTransitioning = true;

        // Aktif slide'ı bul
        const currentActiveSlide = document.querySelector('.slider-slide.active');
        
        // Tüm videoları durdur
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
            video.onended = null;
        });
        
        // Eğer zaten bir aktif slide varsa, geçiş efekti uygula
        if (currentActiveSlide) {
            // Geçiş efekti: Önce mevcut slide'ı yavaşça kapat
            currentActiveSlide.style.transition = 'opacity 1s ease-out';
            currentActiveSlide.style.opacity = '0';
            
            // Geçiş tamamlandıktan sonra yeni slide'ı göster
            setTimeout(() => {
                // Tüm slide'ları deaktif et
                slides.forEach(slide => {
                    slide.classList.remove('active');
                });
                
                // Yeni slide'ı aktif et
                slides[index].classList.add('active');
                slides[index].style.transition = 'opacity 1s ease-in';
                slides[index].style.opacity = '1';
                
                // Aktif slide'daki medyayı başlat
                activateSlideMedia(index);
                
                // Geçiş tamamlandı
                isTransitioning = false;
                console.log('Geçiş tamamlandı, yeni aktif slide:', index);
            }, 1000); // 1 saniye geçiş süresi
        } else {
            // İlk yükleme - doğrudan aktif et
            slides[index].classList.add('active');
            slides[index].style.opacity = '1';
            activateSlideMedia(index);
            isTransitioning = false;
        }
        
        currentSlide = index;
        console.log('Aktif slide değişti:', index);
    }
    
    // Slide medyasını aktifleştir (video veya resim)
    function activateSlideMedia(index) {
        const activeSlide = slides[index];
        const video = activeSlide.querySelector('video');
        
        // Slide başlangıç zamanını kaydet
        slideStartTime = new Date().getTime();
        
        if (video) {
            // Video varsa
            console.log('Video slide aktif edildi');
            video.currentTime = 0;
            video.muted = true; // Videoyu sessiz tut
            
            // Videoyu otomatik başlat
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Video otomatik olarak başlatıldı');
                    })
                    .catch(err => {
                        console.error('Video oynatma hatası:', err);
                        // Video oynatılamazsa, bir sonraki slide'a geç
                        slideTimer = setTimeout(nextSlide, transitionInterval);
                    });
            }

            // Video bittiğinde sonraki slide'a geç
            video.onended = function() {
                console.log('Video bitti, sonraki slide\'a geçiliyor');
                clearSlideTimer(); // Slide timerı temizle
                nextSlide();
            };
            
            // Video için zamanlayıcı kullanma, videonun kendi süresi bitince otomatik olarak geçecek
            // Sadece video oynatılamazsa bir yedek zamanlayıcı kullan
        } else {
            // Resim varsa transitionInterval süresi sonra geç
            console.log('Resim slide aktif edildi, ' + transitionInterval + 'ms sonra geçilecek');
            
            // Önceki zamanlayıcıyı temizle ve yeni bir zamanlayıcı oluştur
            clearSlideTimer();
            
            // Kesin olarak transitionInterval süresi sonra geçmesini sağla
            slideTimer = setTimeout(function() {
                console.log('Resim süresi doldu (' + transitionInterval + 'ms), sonraki slide\'a geçiliyor');
                // Zamanlayıcı tamamlandığında geçiş yapılacağını garanti et
                if (!isTransitioning) {
                    nextSlide();
                } else {
                    console.log('Geçiş sırasında olduğu için sonraki slide\'a geçiş ertelendi');
                    // Geçiş tamamlandıktan sonra tekrar dene
                    setTimeout(nextSlide, 1500);
                }
            }, transitionInterval);
        }
    }

    // Sonraki slide'a geç
    function nextSlide() {
        if (!slides || slides.length <= 1) return;
        // Eğer geçiş sırasındaysak, işlemi iptal et
        if (isTransitioning) {
            console.log('Geçiş sırasında nextSlide isteği iptal edildi');
            return;
        }
        const nextIndex = (currentSlide + 1) % slides.length;
        activateSlide(nextIndex);
    }
    
    // Önceki slide'a geç
    function prevSlide() {
        if (!slides || slides.length <= 1) return;
        // Eğer geçiş sırasındaysak, işlemi iptal et
        if (isTransitioning) {
            console.log('Geçiş sırasında prevSlide isteği iptal edildi');
            return;
        }
        const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
        activateSlide(prevIndex);
    }

    // Event listeners - butonlar için
    if (prevButton) {
        prevButton.addEventListener('click', function(e) {
            e.preventDefault(); // Varsayılan davranışı engelle
            console.log('Önceki slide butonu tıklandı');
            prevSlide();
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault(); // Varsayılan davranışı engelle
            console.log('Sonraki slide butonu tıklandı');
            nextSlide();
        });
    }
    
    // Klavye kontrolleri ekle
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });
    
    // Periyodik olarak zamanlayıcıyı kontrol et (her 5 saniyede bir)
    setInterval(checkTimer, 5000);

    // Sayfa yüklendiğinde
    if (slides && slides.length > 0) {
        disableAllVideos();
        activateSlide(0);
        console.log('Slider başlatıldı, toplam slide sayısı:', slides.length);
    } else {
        console.error('Slider öğeleri bulunamadı!');
    }
});
