(function () {
    // Prevent duplicate script evaluations from registering duplicate listeners
    if (window.galleryLightboxScriptLoaded) {
        if (window.initGalleryLightbox) {
            window.initGalleryLightbox();
        }
        return;
    }
    window.galleryLightboxScriptLoaded = true;

    // Inject Custom Brand-Cohesive Stylesheet
    function injectStyles() {
        if (document.getElementById('gallery-lightbox-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'gallery-lightbox-styles';
        styles.textContent = `
            /* Custom Zoom Hover Overlay */
            .gallery-card {
                position: relative;
                cursor: zoom-in;
                overflow: hidden;
            }
            .gallery-card-overlay {
                position: absolute;
                inset: 0;
                background-color: rgba(62, 16, 16, 0.15); /* primary brand color with low opacity */
                opacity: 0;
                transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
                z-index: 10;
            }
            .gallery-card:hover .gallery-card-overlay {
                opacity: 1;
            }
            .gallery-card-icon {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background-color: rgba(255, 248, 247, 0.9); /* surface color with opacity */
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #3e1010; /* primary color */
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                transform: scale(0.85);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .gallery-card:hover .gallery-card-icon {
                transform: scale(1);
            }

            /* Lightbox Modal Overlay */
            .lightbox-modal {
                position: fixed;
                inset: 0;
                z-index: 99999;
                background-color: rgba(255, 248, 247, 0.96); /* brand surface color */
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease-in-out;
                user-select: none;
            }
            .lightbox-modal.active {
                opacity: 1;
                pointer-events: auto;
            }
            .lightbox-content {
                position: relative;
                max-width: 85vw;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                transform: scale(0.96);
                transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .lightbox-modal.active .lightbox-content {
                transform: scale(1);
            }
            .lightbox-image {
                max-width: 100%;
                max-height: 72vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 30px 60px -15px rgba(62, 16, 16, 0.12);
                transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
            }
            .lightbox-image.fade-out {
                opacity: 0;
                transform: scale(0.98);
            }
            .lightbox-caption {
                margin-top: 20px;
                font-family: 'Manrope', sans-serif;
                font-size: 13px;
                letter-spacing: 0.1em;
                color: #6b6357; /* on-secondary-container text */
                font-weight: 600;
                text-align: center;
                text-transform: uppercase;
            }
            .lightbox-close-btn {
                position: absolute;
                top: 24px;
                right: 24px;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border: 1px solid rgba(62, 16, 16, 0.1);
                background-color: rgba(255, 248, 247, 0.8);
                backdrop-filter: blur(4px);
                color: #3e1010;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 100000;
            }
            .lightbox-close-btn:hover {
                background-color: #3e1010;
                color: #fff8f7;
                transform: rotate(90deg);
            }
            .lightbox-nav-btn {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 56px;
                height: 56px;
                border-radius: 50%;
                border: 1px solid rgba(62, 16, 16, 0.1);
                background-color: rgba(255, 248, 247, 0.8);
                backdrop-filter: blur(4px);
                color: #3e1010;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 100000;
            }
            .lightbox-nav-btn:hover {
                background-color: #3e1010;
                color: #fff8f7;
                border-color: #3e1010;
            }
            .lightbox-nav-btn.prev {
                left: 24px;
            }
            .lightbox-nav-btn.next {
                right: 24px;
            }
            
            /* Responsive Overrides */
            @media (max-width: 768px) {
                .lightbox-nav-btn {
                    width: 44px;
                    height: 44px;
                }
                .lightbox-nav-btn.prev {
                    left: 12px;
                }
                .lightbox-nav-btn.next {
                    right: 12px;
                }
                .lightbox-close-btn {
                    top: 16px;
                    right: 16px;
                    width: 40px;
                    height: 40px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    let currentIndex = 0;
    let images = [];
    let lightboxModal = null;
    let touchStartX = 0;
    let touchEndX = 0;

    function initLightbox() {
        injectStyles();

        // Query all aspect-square containers that house our project gallery images
        const containers = document.querySelectorAll('main div.aspect-square.bg-surface-container');
        if (!containers.length) return;

        // Parse images and map indices
        images = Array.from(containers).map(container => {
            const img = container.querySelector('img');
            return img ? { src: img.getAttribute('src') || img.src, alt: img.alt || 'Project Image' } : null;
        }).filter(Boolean);

        if (!images.length) return;

        // Setup hover overlay & click events on containers
        containers.forEach((container, index) => {
            // Apply zoom/card classes
            container.classList.add('gallery-card');

            // Add overlay if it doesn't exist
            if (!container.querySelector('.gallery-card-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'gallery-card-overlay';
                overlay.innerHTML = `
                    <div class="gallery-card-icon">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0, 'wght' 300;">zoom_in</span>
                    </div>
                `;
                container.appendChild(overlay);
            }

            // Click listener
            container.onclick = (e) => {
                e.preventDefault();
                openLightbox(index);
            };
        });

        // Setup Lightbox HTML markup if not present
        lightboxModal = document.getElementById('gallery-lightbox-modal');
        if (!lightboxModal) {
            lightboxModal = document.createElement('div');
            lightboxModal.id = 'gallery-lightbox-modal';
            lightboxModal.className = 'lightbox-modal';
            lightboxModal.innerHTML = `
                <button class="lightbox-close-btn" aria-label="Close gallery">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0, 'wght' 300;">close</span>
                </button>
                <button class="lightbox-nav-btn prev" aria-label="Previous image">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0, 'wght' 300;">chevron_left</span>
                </button>
                <div class="lightbox-content">
                    <img class="lightbox-image" src="" alt="">
                    <div class="lightbox-caption"></div>
                </div>
                <button class="lightbox-nav-btn next" aria-label="Next image">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0, 'wght' 300;">chevron_right</span>
                </button>
            `;
            document.body.appendChild(lightboxModal);

            // Bind global controls (once per lifecycle of the modal element)
            setupControls();
        }
    }

    function setupControls() {
        if (!lightboxModal) return;

        const closeBtn = lightboxModal.querySelector('.lightbox-close-btn');
        const prevBtn = lightboxModal.querySelector('.lightbox-nav-btn.prev');
        const nextBtn = lightboxModal.querySelector('.lightbox-nav-btn.next');

        // Close actions
        closeBtn.onclick = closeLightbox;
        lightboxModal.onclick = (e) => {
            if (e.target === lightboxModal) closeLightbox();
        };

        // Navigation
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            showPrev();
        };
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            showNext();
        };

        // Keyboard Controls - bind once to document
        if (!window.galleryLightboxKeysBound) {
            document.addEventListener('keydown', handleKeyDown);
            window.galleryLightboxKeysBound = true;
        }

        // Swipe Gestures
        lightboxModal.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightboxModal.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipeGesture();
        }, { passive: true });
    }

    function handleKeyDown(e) {
        if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
    }

    function handleSwipeGesture() {
        const threshold = 55;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                showPrev();
            } else {
                showNext();
            }
        }
    }

    function openLightbox(index) {
        currentIndex = index;
        if (!lightboxModal) return;

        lightboxModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock scroll

        updateLightboxContent(index);
    }

    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }

    function showPrev() {
        if (!images.length) return;
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightboxContent(currentIndex);
    }

    function showNext() {
        if (!images.length) return;
        currentIndex = (currentIndex + 1) % images.length;
        updateLightboxContent(currentIndex);
    }

    function updateLightboxContent(index) {
        const imgEl = lightboxModal.querySelector('.lightbox-image');
        const captionEl = lightboxModal.querySelector('.lightbox-caption');

        // Apply smooth transition fade-out
        imgEl.classList.add('fade-out');

        setTimeout(() => {
            imgEl.src = images[index].src;
            imgEl.alt = images[index].alt;
            captionEl.textContent = `${index + 1} / ${images.length}`;

            // Remove fade-out when loading starts/finishes to ensure a smooth transition
            imgEl.onload = () => {
                imgEl.classList.remove('fade-out');
            };

            // Fallback in case onload doesn't trigger quickly
            setTimeout(() => {
                imgEl.classList.remove('fade-out');
            }, 150);

            // Preload next & previous images to make browsing instantaneous
            preloadImages(index);
        }, 150);
    }

    function preloadImages(index) {
        if (images.length <= 1) return;
        const nextIdx = (index + 1) % images.length;
        const prevIdx = (index - 1 + images.length) % images.length;

        const nextImg = new Image();
        nextImg.src = images[nextIdx].src;

        const prevImg = new Image();
        prevImg.src = images[prevIdx].src;
    }

    // Expose initLightbox globally to call it on navigation
    window.initGalleryLightbox = initLightbox;

    // Support standard dynamic script initialization and Turbo events
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLightbox);
    } else {
        initLightbox();
    }
    document.addEventListener('turbo:load', initLightbox);
})();
