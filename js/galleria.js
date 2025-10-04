// Gallery functionality for Cani di Odino website - Viking Edition
// Version: 2025.01.30

/**
 * Gallery data structure - easily scalable
 */
const GALLERY_DATA = {
    props: {
        title: "Props Vari",
        icon: "⚔️",
        products: [
            {
                id: "accessori-legno",
                title: "Accessori in Legno",
                description:
                    "Accessori artigianali in legno per arricchire le sessioni di gioco: token, plance e piccoli props.",
                shortDescription: "Token e props in legno",
                images: [

                    "./img/gallery/props3.webp",
                    "./img/gallery/props4.webp",
                    "./img/gallery/props5.webp",
                    "./img/gallery/props6.webp",
                    "./img/gallery/props7.webp",
                    "./img/gallery/props9.webp",
                    "./img/gallery/props10.webp",
                    "./img/gallery/props12.webp",
                    "./img/gallery/props13.webp",
                    "./img/gallery/props14.webp",
                    "./img/gallery/props18.webp",



                ],
                category: "Props Vari"
            },
            {
                id: "cibo",
                title: "Cibo Scenico",
                description:
                    "Props a tema cibo per scenografie e ambientazioni di gioco dal vivo o da tavolo.",
                shortDescription: "Props alimentari/scenici",
                images: ["./img/gallery/cibo1.webp"],
                category: "Props Vari"
            },
            {
                id: "props",
                title: "Props",
                description:
                    "Collezione di props misti per arricchire l’esperienza di gioco al tavolo.",
                shortDescription: "Props assortiti",
                images: [
                    "./img/gallery/props1.webp",
                    "./img/gallery/props2.webp",

                    "./img/gallery/props11.webp",
                    "./img/gallery/props16.webp",
                    "./img/gallery/props17.webp",
                    "./img/gallery/props8.webp",

                    "./img/gallery/props.webp"
                ],
                category: "Props Vari"
            }
        ]
    },

    schermo: {
        title: "Schermo del Master",
        icon: "🛡️",
        products: [
            {
                id: "schermo-master",
                title: "Schermo del Master",
                description:
                    "Schermo in legno inciso con motivi nordici, ideale per nascondere appunti e tabelle del master.",
                shortDescription: "Schermo inciso nordico",
                images: [
                    "./img/gallery/schrmo.webp",
                    "./img/gallery/schermoo2.webp"
                ],
                category: "Schermo del Master"
            }
        ]
    },

    carte: {
        title: "Carte Personalizzate",
        icon: "🃏",
        products: [
            {
                id: "carte-personalizzate",
                title: "Carte Personalizzate",
                description:
                    "Carte personalizzate per GdR e boardgame, stampate su cartoncino di qualità.",
                shortDescription: "Set di carte custom",
                images: [
                    "./img/gallery/carte1.webp",
                    "./img/gallery/carte2.webp",
                    "./img/gallery/carte3.webp",
                    "./img/gallery/carte4.webp",
                    "./img/gallery/carte5.webp",
                    "./img/gallery/carte6.webp"
                ],
                category: "Carte Personalizzate"
            }
        ]
    },

    organizer: {
        title: "Organizer",
        icon: "📦",
        products: [
            {
                id: "organizer",
                title: "Organizer",
                description:
                    "Organizer modulari per dadi, carte e materiale da gioco. Solidi e pratici.",
                shortDescription: "Organizer per tavolo e trasporto",
                images: [
                    "./img/gallery/org1.webp",
                    "./img/gallery/org2.webp",
                    "./img/gallery/org3.webp",
                    "./img/gallery/org4.webp",
                    "./img/gallery/org5.webp"
                ],
                category: "Organizer"
            }
        ]
    },

    stampa3d: {
        title: "Stampa 3D",
        icon: "🏗️",
        products: [
            {
                id: "miniature",
                title: "Miniature",
                description:
                    "Miniature stampate in 3D con ottima resa dei dettagli, pronte per dipintura o uso al tavolo.",
                shortDescription: "Miniature 3D",
                images: [
                    "./img/gallery/stampa1.webp",
                    "./img/gallery/stampa2.webp",
                    "./img/gallery/stampa3.webp",
                    "./img/gallery/stampa4.webp",
                    "./img/gallery/stampa5.webp",
                    "./img/gallery/stampa8.webp",
                    "./img/gallery/stampa9.webp",
                    "./img/gallery/stampa10.webp",
                    "./img/gallery/props15.webp",

                ],
                category: "Stampa 3D - Miniature"
            },
            {
                id: "trofei",
                title: "Trofei",
                description:
                    "Trofei e pezzi scenici stampati in 3D per eventi, premi e ambientazioni speciali.",
                shortDescription: "Trofei 3D",
                images: [
                    "./img/gallery/stamp7.webp",
                    "./img/gallery/stampa6.webp",


                    "./img/gallery/stampa11.webp",
                    "./img/gallery/stampa12.webp",
                    "./img/gallery/stampa13.webp"
                ],
                category: "Stampa 3D - Trofei"
            }
        ]
    },

    giochi: {
        title: "Giochi",
        icon: "🎮",
        products: [
            {
                id: "endlessrunner",
                title: "EndlessRunner",
                description:
                    "Gioco digitale sviluppato dai Cani di Odino. Un endless runner con elementi fantasy e meccaniche innovative. Corri attraverso paesaggi nordici, evita ostacoli mitologici e raccogli rune per sbloccare nuovi personaggi. Disponibile gratuitamente su itch.io con aggiornamenti regolari e nuovi contenuti.",
                shortDescription: "Il nostro gioco digitale fantasy",
                images: ["./img/endlessrunnerjpg.jpg"],
                category: "Giochi",
                link: "https://gd.games/games/1c026274-21d0-4281-be6a-6bc91cb33345",
                apk: "https://nefilimcdo.itch.io/cani-di-odino-endless-runner"

            },
            {
                id: "fossi-harun",
                title: "I Fossi dell’Harun",
                description:
                    "Avventura originale dei Cani di Odino. Un gioco narrativo ambientato nelle terre dell’Harun, tra misteri, pericoli e scelte drammatiche.",
                shortDescription: "Gioco narrativo ambientato nell’Harun",
                images: ["./img/gallery/giochi1.webp"],
                category: "Giochi"
            }
        ]
    }
};


/**
 * Carousel state management
 */
class CarouselState {
    constructor() {
        this.productId = null;
        this.currentSlide = 0;
        this.slides = [];
    }

    reset() {
        this.productId = null;
        this.currentSlide = 0;
        this.slides = [];
    }

    setProduct(productId, slides) {
        this.productId = productId;
        this.currentSlide = 0;
        this.slides = slides || [];
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    }

    prevSlide() {
        this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
    }

    goToSlide(index) {
        if (index >= 0 && index < this.slides.length) {
            this.currentSlide = index;
        }
    }
}

/**
 * Gallery manager class
 */
class GalleryManager {
    constructor() {
        this.carouselState = new CarouselState();
        this.data = GALLERY_DATA;

        this.init();
    }

    init() {
        this.initCategoryNavigation();
        this.initCarousel();
        this.initKeyboardNavigation();
        this.trackPerformance();
    }

    /**
     * Initialize category navigation
     */
    initCategoryNavigation() {
        const categoryButtons = document.querySelectorAll('.category-button');

        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetCategory = button.getAttribute('data-category');

                // Remove active class from all buttons and panes
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

                // Add active class to clicked button and corresponding pane
                button.classList.add('active');
                const targetPane = document.getElementById(targetCategory);
                if (targetPane) {
                    targetPane.classList.add('active');
                    this.renderCategoryGallery(targetCategory);
                }
            });
        });

        // Initialize with first category
        if (categoryButtons.length > 0) {
            const firstCategory = categoryButtons[0].getAttribute('data-category');
            this.renderCategoryGallery(firstCategory);
        }
    }

    /**
     * Render gallery for specific category
     */
    renderCategoryGallery(categoryKey) {
        const targetPane = document.getElementById(categoryKey);
        const galleryGrid = targetPane?.querySelector('.gallery-grid');

        if (!galleryGrid || !this.data[categoryKey]) return;

        let html = '';
        const category = this.data[categoryKey];

        category.products.forEach(product => {
            html += this.renderProductCard(product);
        });

        galleryGrid.innerHTML = html;
        this.addProductCardListeners();
    }

    /**
     * Render a single product card
     */
    renderProductCard(product) {
        if (product.placeholder) {
            return `
                <div class="product-card placeholder" data-product-id="${product.id}">
                    <div class="placeholder-content">
                        <div class="placeholder-icon">${product.icon}</div>
                        <h3>${product.title}</h3>
                        <p>${product.shortDescription}</p>
                    </div>
                </div>
            `;
        }

        const mainImage = product.images && product.images.length > 0 ? product.images[0] : '';

        return `
            <div class="product-card" data-product-id="${product.id}" tabindex="0">
                <div class="card-category">${product.category}</div>
                ${mainImage ? `<img src="${mainImage}" alt="${product.title}" class="card-image" loading="lazy">` : ''}
                <div class="card-content">
                    <h3 class="card-title">${product.title}</h3>
                    <p class="card-description">${product.shortDescription}</p>
                </div>
            </div>
        `;
    }

    /**
     * Add click listeners to product cards
     */
    addProductCardListeners() {
        const productCards = document.querySelectorAll('.product-card:not(.placeholder)');

        productCards.forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.getAttribute('data-product-id');
                this.openCarousel(productId);
            });

            // Keyboard accessibility
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const productId = card.getAttribute('data-product-id');
                    this.openCarousel(productId);
                }
            });
        });
    }

    /**
     * Find product by ID across all categories
     */
    findProductById(productId) {
        for (const categoryKey in this.data) {
            const category = this.data[categoryKey];
            const product = category.products.find(p => p.id === productId);
            if (product) {
                return product;
            }
        }
        return null;
    }

    /**
     * Open carousel modal
     */
    openCarousel(productId) {
        const product = this.findProductById(productId);
        if (!product || product.placeholder) return;

        this.carouselState.setProduct(productId, product.images || []);

        if (this.carouselState.slides.length === 0) return;

        const modal = document.getElementById('carouselModal');
        const title = document.getElementById('carouselTitle');
        const description = document.getElementById('carouselDescription');
        const actions = document.getElementById('carouselActions');

        // Set content
        title.textContent = product.title;
        description.textContent = product.description;

        // Set actions
if (product.link) {
    const linkButton = document.createElement('a');
    linkButton.href = product.link;
    linkButton.target = '_blank';
    linkButton.rel = 'noopener noreferrer';
    linkButton.className = 'carousel-action-button';
    linkButton.innerHTML = '🎮 Gioca Ora';
    actions.appendChild(linkButton);
}

if (product.apk) {
    const apkButton = document.createElement('a');
    apkButton.href = product.apk;
    apkButton.target = '_blank';
    apkButton.rel = 'noopener noreferrer';
    apkButton.className = 'carousel-action-button';
    apkButton.innerHTML = '⬇️ Scarica APK';
    actions.appendChild(apkButton);
}

        // Render slides and thumbnails
        this.renderCarouselSlides();
        this.renderCarouselThumbnails();
        this.updateCarouselCounter();

        // Show modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Focus management
        const closeButton = document.getElementById('carouselClose');
        closeButton?.focus({ preventScroll: true });
    }

    /**
     * Render carousel slides
     */
    renderCarouselSlides() {
        const slidesContainer = document.getElementById('carouselSlides');
        if (!slidesContainer) return;

        let html = '';
        this.carouselState.slides.forEach((image, index) => {
            const activeClass = index === this.carouselState.currentSlide ? 'active' : '';
            html += `
                <div class="carousel-slide ${activeClass}">
                    <img src="${image}" alt="Slide ${index + 1}" loading="lazy">
                </div>
            `;
        });

        slidesContainer.innerHTML = html;
    }

    /**
     * Render carousel thumbnails
     */
    renderCarouselThumbnails() {
        const thumbnailsContainer = document.getElementById('carouselThumbnails');
        if (!thumbnailsContainer || this.carouselState.slides.length <= 1) {
            thumbnailsContainer.style.display = 'none';
            return;
        }

        thumbnailsContainer.style.display = 'flex';
        let html = '';
        this.carouselState.slides.forEach((image, index) => {
            const activeClass = index === this.carouselState.currentSlide ? 'active' : '';
            html += `
                <img src="${image}" alt="Thumbnail ${index + 1}" 
                     class="carousel-thumbnail ${activeClass}" 
                     data-slide="${index}" loading="lazy">
            `;
        });

        thumbnailsContainer.innerHTML = html;

        // Add click listeners to thumbnails
        const thumbnails = thumbnailsContainer.querySelectorAll('.carousel-thumbnail');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const slideIndex = parseInt(thumb.getAttribute('data-slide'));
                this.goToSlide(slideIndex);
            });
        });
    }

    /**
     * Update carousel counter
     */
    updateCarouselCounter() {
        const counter = document.getElementById('carouselCounter');
        if (!counter) return;

        counter.textContent = `${this.carouselState.currentSlide + 1} / ${this.carouselState.slides.length}`;
    }

    /**
     * Go to specific slide
     */
    goToSlide(slideIndex) {
        this.carouselState.goToSlide(slideIndex);
        this.renderCarouselSlides();
        this.updateCarouselCounter();
        this.updateThumbnailsActive();
    }

    /**
     * Update active thumbnail
     */
    updateThumbnailsActive() {
        const thumbnails = document.querySelectorAll('.carousel-thumbnail');
        thumbnails.forEach((thumb, index) => {
            if (index === this.carouselState.currentSlide) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    /**
     * Navigate carousel
     */
    navigateCarousel(direction) {
        if (direction > 0) {
            this.carouselState.nextSlide();
        } else {
            this.carouselState.prevSlide();
        }

        this.renderCarouselSlides();
        this.updateCarouselCounter();
        this.updateThumbnailsActive();
    }

    /**
     * Initialize carousel functionality
     */
    initCarousel() {
        const modal = document.getElementById('carouselModal');
        const closeBtn = document.getElementById('carouselClose');
        const prevBtn = document.getElementById('carouselPrev');
        const nextBtn = document.getElementById('carouselNext');

        // Close modal function
        const closeCarousel = () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            this.carouselState.reset();
        };

        // Event listeners
        closeBtn?.addEventListener('click', closeCarousel);
        prevBtn?.addEventListener('click', () => this.navigateCarousel(-1));
        nextBtn?.addEventListener('click', () => this.navigateCarousel(1));

        // Click outside modal to close
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCarousel();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (modal?.style.display === 'block') {
                switch (e.key) {
                    case 'Escape':
                        closeCarousel();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.navigateCarousel(-1);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.navigateCarousel(1);
                        break;
                }
            }
        });
    }

    /**
     * Initialize keyboard navigation for gallery
     */
    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Only handle if no modal is open
            if (document.getElementById('carouselModal')?.style.display !== 'block') {
                const focusedCard = document.activeElement;
                if (focusedCard?.classList.contains('product-card')) {
                    const cards = Array.from(document.querySelectorAll('.product-card:not(.placeholder)'));
                    const currentIndex = cards.indexOf(focusedCard);

                    let nextIndex = -1;

                    switch (e.key) {
                        case 'ArrowRight':
                            e.preventDefault();
                            nextIndex = (currentIndex + 1) % cards.length;
                            break;
                        case 'ArrowLeft':
                            e.preventDefault();
                            nextIndex = currentIndex - 1 < 0 ? cards.length - 1 : currentIndex - 1;
                            break;
                        case 'ArrowDown':
                            e.preventDefault();
                            nextIndex = Math.min(currentIndex + 3, cards.length - 1);
                            break;
                        case 'ArrowUp':
                            e.preventDefault();
                            nextIndex = Math.max(currentIndex - 3, 0);
                            break;
                    }

                    if (nextIndex >= 0 && nextIndex < cards.length) {
                        cards[nextIndex].focus({ preventScroll: true });
                    }
                }
            }
        });
    }

    /**
     * Performance tracking
     */
    trackPerformance() {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.getAttribute('data-product-id');

                // Analytics removed to prevent redirect issues
            });
        });
    }

    /**
     * Utility functions for external use
     */
    addProduct(categoryKey, product) {
        if (!this.data[categoryKey]) {
            console.error(`Category ${categoryKey} does not exist`);
            return;
        }

        this.data[categoryKey].products.push(product);
        this.renderCategoryGallery(categoryKey);
    }

    addCategory(categoryKey, categoryData) {
        this.data[categoryKey] = categoryData;
    }
}

// Initialize gallery when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const gallery = new GalleryManager();

    // Export to global scope for external access
    window.GalleryAPI = {
        addProduct: (categoryKey, product) => gallery.addProduct(categoryKey, product),
        addCategory: (categoryKey, categoryData) => gallery.addCategory(categoryKey, categoryData),
        data: gallery.data
    };
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('Gallery JavaScript error:', e.error);
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GalleryManager,
        CarouselState,
        GALLERY_DATA
    };
}