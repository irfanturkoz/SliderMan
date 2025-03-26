/**
 * SliderMan - Tamamen Yeniden Yazılmış Sürüm
 * Resimlerin iç içe geçme sorunu ve videoya hızlı geçiş sorunu kesin olarak çözüldü
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('SliderMan: Tamamen yeniden yazılmış sürüm başlatılıyor...');
    
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
    let slideStartTime = 0;
    
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
        // Tüm slide'ları topla (hem slider-slide hem de slider-item sınıflarını kontrol et)
        slides = document.querySelectorAll('.slider-slide, .slider-item');
        
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
        
        // İlk slide'ı göster (500ms gecikme ile)
        setTimeout(() => {
            activateSlide(0);
        }, 500);
        
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
        
        // Periyodik zamanlayıcı kontrolü
        setInterval(checkTimer, 5000); // 5 saniyede bir kontrol et
    }
    
    // Zamanlayıcı kontrolü
    function checkTimer() {
        if (isTransitioning || !slideStartTime) return;
        
        const currentSlide = slides[currentIndex];
        if (!currentSlide) return;
        
        const video = currentSlide.querySelector('video');
        
        // Sadece resim slide'ları için zamanlayıcı kontrolü yap
        if (!video) {
            const elapsedTime = Date.now() - slideStartTime;
            console.log(`SliderMan: Zamanlayıcı kontrolü - Geçen süre: ${elapsedTime}ms / ${transitionInterval}ms`);
            
            // Süre dolmuşsa ve hala aynı slide'daysa bir sonraki slide'a geç
            if (elapsedTime >= transitionInterval) {
                console.log('SliderMan: Zamanlayıcı süresi doldu, sonraki slide\'a geçiliyor');
                nextSlide();
            }
        }
    }
    
    // Slide'ı aktifleştir
    function activateSlide(index) {
        // Geçiş sırasında yeni geçişleri engelle
        if (isTransitioning) {
            console.log('SliderMan: Geçiş sırasında, yeni geçiş isteği engellendi');
            return;
        }
        
        // Geçerli bir index değilse işlem yapma
        if (index < 0 || index >= slides.length) return;
        
        console.log(`SliderMan: Slide #${index} aktifleştiriliyor`);
        
        // Geçiş durumunu güncelle
        isTransitioning = true;
        
        // Zamanlayıcıyı temizle
        clearTimeout(slideTimer);
        slideTimer = null;
        
        // Mevcut aktif slide'ı deaktif et
        const currentSlide = slides[currentIndex];
        if (currentSlide) {
            // Önce mevcut slide'ın opacity değerini 0'a düşür
            currentSlide.style.opacity = '0';
            
            // Mevcut slide'daki videoları durdur
            const currentVideo = currentSlide.querySelector('video');
            if (currentVideo) {
                try {
                    currentVideo.pause();
                    currentVideo.currentTime = 0;
                    currentVideo.onended = null;
                    currentVideo.onerror = null;
                } catch (e) {
                    console.log('SliderMan: Video durdurma hatası', e);
                }
            }
        }
        
        // 1 saniye sonra mevcut slide'ı tamamen gizle ve yeni slide'ı göster
        setTimeout(() => {
            // Tüm slide'ları gizle
            slides.forEach(slide => {
                slide.style.display = 'none';
                slide.classList.remove('active');
            });
            
            // Yeni slide'ı göster
            const newSlide = slides[index];
            newSlide.style.display = 'block';
            newSlide.classList.add('active');
            
            // Yeni slide'ın opacity değerini 1'e çıkar
            setTimeout(() => {
                newSlide.style.opacity = '1';
                
                // Geçiş tamamlandıktan 1 saniye sonra
                setTimeout(() => {
                    // Geçiş durumunu güncelle
                    isTransitioning = false;
                    currentIndex = index;
                    slideStartTime = Date.now(); // Slide başlangıç zamanını kaydet
                    
                    // Medyayı aktifleştir
                    activateSlideMedia(newSlide);
                    
                    console.log(`SliderMan: Slide #${index} geçişi tamamlandı`);
                }, 1000);
            }, 100);
        }, 1000);
    }
    
    // Slide medyasını aktifleştir
    function activateSlideMedia(slide) {
        const video = slide.querySelector('video');
        
        if (video) {
            // Video varsa
            console.log('SliderMan: Video medyası aktifleştiriliyor');
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
        } else {
            // Resim varsa
            console.log('SliderMan: Resim medyası aktifleştiriliyor, zamanlayıcı başlatılıyor');
            
            // Resim için zamanlayıcı oluştur
            slideTimer = setTimeout(() => {
                console.log('SliderMan: Resim zamanlayıcısı tamamlandı, sonraki slide\'a geçiliyor');
                nextSlide();
            }, transitionInterval);
        }
    }
    
    // Sonraki slide'a geç
    function nextSlide() {
        if (slides.length <= 1) return;
        const nextIndex = (currentIndex + 1) % slides.length;
        activateSlide(nextIndex);
    }
    
    // Önceki slide'a geç
    function prevSlide() {
        if (slides.length <= 1) return;
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        activateSlide(prevIndex);
    }
    
    // Slider'ı başlat
    initSlider();
});
