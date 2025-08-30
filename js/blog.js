// Blog functionality for Cani di Odino website
// Version: 2025.02.01 - Complete JSON-driven system with mobile optimization

/**
 * Blog manager class
 */
class BlogManager {
    constructor() {
        this.currentFilter = 'all';
        this.articlesPerPage = 6; // Reduced for mobile
        this.currentPage = 1;
        this.allArticles = [];
        this.articlesData = null;
        this.categoriesData = null;
        this.displayedArticles = [];
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        try {
            await this.loadArticlesData();
            this.renderCategoryFilters();
            this.initFilterButtons();
            this.initLoadMore();
            this.trackPerformance();
            this.initMobileOptimizations();
        } catch (error) {
            console.error('Error initializing blog:', error);
            this.showError('Errore nell\'inizializzazione del blog');
        }
    }

    /**
     * Check if individual article is unlocked
     */
    isArticleUnlocked(article) {
        if (!article.unlockDate) return true;
        
        try {
            const unlockDate = new Date(article.unlockDate);
            return new Date() >= unlockDate;
        } catch {
            return true; // If date parsing fails, assume unlocked
        }
    }

    /**
     * Load articles data from JSON only
     */
    async loadArticlesData() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            
            // Show loading state
            this.showLoading();
            
            const response = await fetch('./data/articles.json?v=' + Date.now(), {
                cache: 'no-store',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.articles || !Array.isArray(data.articles)) {
                throw new Error('Formato dati non valido - articles array mancante');
            }
            
            if (!data.categories || typeof data.categories !== 'object') {
                throw new Error('Formato dati non valido - categories object mancante');
            }
            
            // Store data from JSON only
            this.articlesData = data.articles;
            this.categoriesData = data.categories;
            
            // Validate articles data
            this.articlesData = this.articlesData.filter(article => {
                // Filter out locked articles
                const isValidStructure = article.id && article.title && article.slug && 
                                       article.category && article.excerpt;
                const isUnlocked = this.isArticleUnlocked(article);
                
                return isValidStructure && isUnlocked;
            });
            
            // Sort articles by date (newest first)
            this.articlesData.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Reset pagination
            this.currentPage = 1;
            this.displayedArticles = [];
            
            this.renderFeaturedArticles();
            this.renderAllArticles();
            this.updateLoadMoreButton();
            
        } catch (error) {
            console.error('Error loading articles:', error);
            this.showError('Errore nel caricamento degli articoli. Riprova più tardi.');
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Render category filters from JSON data only
     */
    renderCategoryFilters() {
        const filtersContainer = document.querySelector('.blog-filters');
        if (!filtersContainer || !this.categoriesData) return;

        let html = '<button class="filter-button active" data-category="all">Tutti</button>';
        
        // Add categories from JSON only
        Object.entries(this.categoriesData).forEach(([key, category]) => {
            // Only show categories that have articles
            const hasArticles = this.articlesData.some(article => article.category === key);
            if (hasArticles) {
                html += `<button class="filter-button" data-category="${key}" title="${category.description}">${category.name}</button>`;
            }
        });
        
        filtersContainer.innerHTML = html;
    }

    /**
     * Show loading state
     */
    showLoading() {
        const featuredGrid = document.getElementById('featured-grid');
        const blogGrid = document.getElementById('blog-grid');
        
        const loadingHTML = `
            <div class="loading">
                <span>Caricamento articoli...</span>
            </div>
        `;
        
        if (featuredGrid) featuredGrid.innerHTML = loadingHTML;
        if (blogGrid) blogGrid.innerHTML = loadingHTML;
    }

    /**
     * Render featured articles from JSON only
     */
    renderFeaturedArticles() {
        const featuredGrid = document.getElementById('featured-grid');
        const featuredSection = document.getElementById('featured-section');
        
        if (!featuredGrid || !this.articlesData) return;

        const featuredArticles = this.articlesData.filter(article => 
            article.featured === true && this.isArticleUnlocked(article)
        );
        
        if (featuredArticles.length === 0) {
            // Hide featured section if no featured articles
            if (featuredSection) featuredSection.style.display = 'none';
            return;
        }

        if (featuredSection) featuredSection.style.display = 'block';
        
        const html = featuredArticles.map(article => {
            // Get category name from JSON
            const categoryName = this.getCategoryNameFromJSON(article.category);
            
            return `
                <article class="featured-card" data-category="${article.category}">
                    <img src="${article.image || './img/logo.png'}" 
                         alt="${article.imageAlt || article.title}" 
                         class="featured-image" 
                         loading="lazy"
                         onerror="this.src='./img/logo.png'">
                    <div class="featured-content">
                        <div class="featured-meta">
                            <span class="featured-category">${categoryName}</span>
                            <span class="featured-date">${article.dateHuman}</span>
                        </div>
                        <h3 class="featured-title">${article.title}</h3>
                        <p class="featured-excerpt">${article.excerpt}</p>
                        <a href="articoli/${article.slug}.html" class="featured-link">
                            Leggi Articolo
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </article>
            `;
        }).join('');

        featuredGrid.innerHTML = html;
    }

    /**
     * Render all articles (paginated) from JSON only
     */
    renderAllArticles() {
        const blogGrid = document.getElementById('blog-grid');
        if (!blogGrid || !this.articlesData) return;

        // Filter articles based on current filter
        let filteredArticles = this.articlesData;
        
        if (this.currentFilter !== 'all') {
            filteredArticles = this.articlesData.filter(article => 
                article.category === this.currentFilter && this.isArticleUnlocked(article)
            );
        } else {
            // Even for 'all', filter out locked articles
            filteredArticles = this.articlesData.filter(article => 
                this.isArticleUnlocked(article)
            );
        }

        // Get articles for current page
        const startIndex = 0;
        const endIndex = this.currentPage * this.articlesPerPage;
        this.displayedArticles = filteredArticles.slice(startIndex, endIndex);
        
        if (this.displayedArticles.length === 0) {
            blogGrid.innerHTML = `
                <div class="no-articles">
                    <h3>Nessun articolo trovato</h3>
                    <p>Non ci sono articoli per questa categoria.</p>
                </div>
            `;
            return;
        }
        
        const html = this.displayedArticles.map(article => {
            // Get category name from JSON
            const categoryName = this.getCategoryNameFromJSON(article.category);
            
            // Get tags from JSON only
            const tagsHTML = (article.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
            
            return `
                <article class="blog-card" data-category="${article.category}">
                    <div class="card-image">
                        <img src="${article.image || './img/logo.png'}" 
                             alt="${article.imageAlt || article.title}" 
                             loading="lazy"
                             onerror="this.src='./img/logo.png'">
                        <div class="card-category">${categoryName}</div>
                    </div>
                    <div class="card-content">
                        <div class="article-meta">
                            <span class="article-date">${article.dateHuman}</span>
                            <span class="article-author">by ${article.author}</span>
                        </div>
                        <h3 class="card-title">${article.title}</h3>
                        <p class="card-excerpt">${article.excerpt}</p>
                        <div class="card-tags">
                            ${tagsHTML}
                        </div>
                        <div class="card-footer">
                            <span class="read-time">⏱️ ${article.readTime} min</span>
                            <a href="articoli/${article.slug}.html" class="card-link">
                                Leggi
                                <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        blogGrid.innerHTML = html;
        
        // Add fade-in animation with mobile optimization
        const cards = blogGrid.querySelectorAll('.blog-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50); // Faster animation for mobile
        });
    }

    /**
     * Get category name from JSON data only
     */
    getCategoryNameFromJSON(categoryKey) {
        if (this.categoriesData && this.categoriesData[categoryKey]) {
            return this.categoriesData[categoryKey].name;
        }
        return 'Articolo'; // Fallback
    }

    /**
     * Show error message
     */
    showError(message) {
        const blogGrid = document.getElementById('blog-grid');
        const featuredGrid = document.getElementById('featured-grid');
        
        const errorHtml = `
            <div class="error-message">
                <h3>⚠️ ${message}</h3>
                <p>Riprova più tardi o contattaci se il problema persiste.</p>
            </div>
        `;
        
        if (blogGrid) blogGrid.innerHTML = errorHtml;
        if (featuredGrid) featuredGrid.innerHTML = '';
    }

    /**
     * Initialize filter buttons with mobile optimization
     */
    initFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-button');

        filterButtons.forEach(button => {
            // Use touchstart for better mobile responsiveness
            const eventType = 'ontouchstart' in window ? 'touchstart' : 'click';
            
            button.addEventListener(eventType, (e) => {
                e.preventDefault();
                
                const category = button.getAttribute('data-category');
                
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Reset pagination
                this.currentPage = 1;
                this.currentFilter = category;
                
                // Filter and render articles
                this.renderAllArticles();
                this.updateLoadMoreButton();
                
                // Scroll to articles on mobile
                if (window.innerWidth <= 768) {
                    const articlesSection = document.querySelector('.articles-section');
                    if (articlesSection) {
                        articlesSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                }
            });
        });
    }

    /**
     * Initialize load more functionality with mobile optimization
     */
    initLoadMore() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreArticles();
            });
        }
    }

    /**
     * Load more articles with mobile optimization
     */
    loadMoreArticles() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const blogGrid = document.getElementById('blog-grid');
        
        if (!blogGrid || !this.articlesData || this.isLoading) return;

        this.isLoading = true;

        // Show loading state
        loadMoreBtn.innerHTML = '<span>Caricamento...</span><i class="fas fa-spinner fa-spin"></i>';
        loadMoreBtn.disabled = true;

        // Shorter loading delay for mobile
        const loadingDelay = window.innerWidth <= 768 ? 400 : 800;

        setTimeout(() => {
            // Increment page and render more articles
            this.currentPage++;
            
            // Get filtered articles
            let filteredArticles = this.articlesData;
            if (this.currentFilter !== 'all') {
                filteredArticles = this.articlesData.filter(article => 
                    article.category === this.currentFilter
                );
            }

            // Get new articles to display
            const startIndex = this.displayedArticles.length;
            const endIndex = this.currentPage * this.articlesPerPage;
            const newArticles = filteredArticles.slice(startIndex, endIndex);

            // Render new articles
            newArticles.forEach((article, index) => {
                // Get category name from JSON
                const categoryName = this.getCategoryNameFromJSON(article.category);
                
                // Get tags from JSON only
                const tagsHTML = (article.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
                
                const articleHTML = `
                    <article class="blog-card fade-in" data-category="${article.category}">
                        <div class="card-image">
                            <img src="${article.image || './img/logo.png'}" 
                                 alt="${article.imageAlt || article.title}" 
                                 loading="lazy"
                                 onerror="this.src='./img/logo.png'">
                            <div class="card-category">${categoryName}</div>
                        </div>
                        <div class="card-content">
                            <div class="article-meta">
                                <span class="article-date">${article.dateHuman}</span>
                                <span class="article-author">by ${article.author}</span>
                            </div>
                            <h3 class="card-title">${article.title}</h3>
                            <p class="card-excerpt">${article.excerpt}</p>
                            <div class="card-tags">
                                ${tagsHTML}
                            </div>
                            <div class="card-footer">
                                <span class="read-time">⏱️ ${article.readTime} min</span>
                                <a href="articoli/${article.slug}.html" class="card-link">
                                    Leggi
                                    <i class="fas fa-arrow-right"></i>
                                </a>
                            </div>
                        </div>
                    </article>
                `;
                
                blogGrid.insertAdjacentHTML('beforeend', articleHTML);
            });

            // Update displayed articles array
            this.displayedArticles = filteredArticles.slice(0, endIndex);

            // Reset button
            loadMoreBtn.innerHTML = '<span>Altri Articoli</span><i class="fas fa-chevron-down"></i>';
            loadMoreBtn.disabled = false;
            this.isLoading = false;

            // Update load more button visibility
            this.updateLoadMoreButton();

        }, loadingDelay);
    }

    /**
     * Update load more button visibility
     */
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn || !this.articlesData) return;

        // Get filtered articles count
        let filteredArticles = this.articlesData;
        if (this.currentFilter !== 'all') {
            filteredArticles = this.articlesData.filter(article => 
                article.category === this.currentFilter
            );
        }

        const totalArticles = filteredArticles.length;
        const displayedCount = this.displayedArticles.length;

        if (displayedCount >= totalArticles) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    /**
     * Mobile optimizations
     */
    initMobileOptimizations() {
        // Touch-friendly interactions
        this.initTouchOptimizations();
        
        // Lazy loading for mobile
        this.initLazyLoading();
        
        // Mobile-specific event handlers
        this.initMobileEvents();
    }

    /**
     * Touch optimizations for mobile
     */
    initTouchOptimizations() {
        // Add touch feedback to interactive elements
        const interactiveElements = document.querySelectorAll('.filter-button, .card-link, .featured-link');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            }, { passive: true });
            
            element.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
        });
    }

    /**
     * Lazy loading for mobile performance
     */
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });

            // Observe images for lazy loading
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * Mobile-specific event handlers
     */
    initMobileEvents() {
        // Prevent zoom on double tap for iOS
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle viewport resize for mobile keyboards
        let initialViewportHeight = window.innerHeight;
        window.addEventListener('resize', () => {
            // Detect mobile keyboard
            if (window.innerHeight < initialViewportHeight * 0.75) {
                document.body.classList.add('keyboard-open');
            } else {
                document.body.classList.remove('keyboard-open');
            }
        });
    }

    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        // Recalculate layout if needed
        const blogGrid = document.getElementById('blog-grid');
        if (blogGrid) {
            // Force reflow
            blogGrid.style.display = 'none';
            blogGrid.offsetHeight; // Trigger reflow
            blogGrid.style.display = '';
        }
    }

    /**
     * Performance tracking with mobile considerations
     */
    trackPerformance() {
        // Track article clicks with mobile detection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('card-link') || 
                e.target.classList.contains('featured-link') ||
                e.target.closest('.card-link') ||
                e.target.closest('.featured-link')) {
                
                const articleCard = e.target.closest('article');
                const articleTitle = articleCard?.querySelector('.card-title, .featured-title')?.textContent;
                
                if (articleTitle) {
                    console.log('Article clicked:', articleTitle);
                    
                    // Track with analytics if available
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'article_click', {
                            'article_title': articleTitle,
                            'category': articleCard.getAttribute('data-category'),
                            'device_type': window.innerWidth <= 768 ? 'mobile' : 'desktop'
                        });
                    }
                }
            }
        });

        // Track filter usage with mobile detection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-button')) {
                const category = e.target.getAttribute('data-category');
                console.log('Filter used:', category);
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'filter_used', {
                        'filter_category': category,
                        'device_type': window.innerWidth <= 768 ? 'mobile' : 'desktop'
                    });
                }
            }
        });

        // Track load more usage
        document.addEventListener('click', (e) => {
            if (e.target.closest('#loadMoreBtn')) {
                console.log('Load more clicked');
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'load_more_articles', {
                        'current_page': this.currentPage,
                        'device_type': window.innerWidth <= 768 ? 'mobile' : 'desktop'
                    });
                }
            }
        });
    }

    /**
     * Search functionality with mobile optimization
     */
    searchArticles(query) {
        if (!query || query.trim() === '') {
            this.currentFilter = 'all';
            this.currentPage = 1;
            this.renderAllArticles();
            this.updateLoadMoreButton();
            return;
        }

        const searchTerm = query.toLowerCase().trim();
        const searchResults = this.articlesData.filter(article => {
            const titleMatch = article.title.toLowerCase().includes(searchTerm);
            const excerptMatch = article.excerpt.toLowerCase().includes(searchTerm);
            const tagsMatch = (article.tags || []).some(tag => tag.toLowerCase().includes(searchTerm));
            const authorMatch = article.author.toLowerCase().includes(searchTerm);
            const categoryMatch = this.getCategoryNameFromJSON(article.category).toLowerCase().includes(searchTerm);
            
            return titleMatch || excerptMatch || tagsMatch || authorMatch || categoryMatch;
        });

        this.renderSearchResults(searchResults, query);
    }

    /**
     * Render search results
     */
    renderSearchResults(results, query) {
        const blogGrid = document.getElementById('blog-grid');
        const articlesTitle = document.querySelector('.articles-title');
        
        if (!blogGrid) return;

        // Update title
        if (articlesTitle) {
            articlesTitle.textContent = `Risultati per "${query}" (${results.length})`;
        }

        if (results.length === 0) {
            blogGrid.innerHTML = `
                <div class="no-articles">
                    <h3>Nessun risultato trovato</h3>
                    <p>Prova con termini di ricerca diversi.</p>
                </div>
            `;
            return;
        }

        const html = results.map(article => {
            // Get category name from JSON
            const categoryName = this.getCategoryNameFromJSON(article.category);
            
            // Get tags from JSON only
            const tagsHTML = (article.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
            
            return `
                <article class="blog-card" data-category="${article.category}">
                    <div class="card-image">
                        <img src="${article.image || './img/logo.png'}" 
                             alt="${article.imageAlt || article.title}" 
                             loading="lazy"
                             onerror="this.src='./img/logo.png'">
                        <div class="card-category">${categoryName}</div>
                    </div>
                    <div class="card-content">
                        <div class="article-meta">
                            <span class="article-date">${article.dateHuman}</span>
                            <span class="article-author">by ${article.author}</span>
                        </div>
                        <h3 class="card-title">${article.title}</h3>
                        <p class="card-excerpt">${article.excerpt}</p>
                        <div class="card-tags">
                            ${tagsHTML}
                        </div>
                        <div class="card-footer">
                            <span class="read-time">⏱️ ${article.readTime} min</span>
                            <a href="articoli/${article.slug}.html" class="card-link">
                                Leggi
                                <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        blogGrid.innerHTML = html;
        this.displayedArticles = results;
        
        // Hide load more button for search results
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    }

    /**
     * Utility functions for external use
     */
    addArticle(articleData) {
        if (!this.articlesData) {
            this.articlesData = [];
        }
        
        // Validate article data
        if (!articleData.category || !this.categoriesData[articleData.category]) {
            console.error('Invalid category for article:', articleData.category);
            return false;
        }
        
        // Add to data array
        this.articlesData.unshift(articleData);
        
        // Re-render
        this.renderCategoryFilters();
        this.renderFeaturedArticles();
        this.renderAllArticles();
        this.updateLoadMoreButton();
        
        return true;
    }

    /**
     * Get all articles data for external use
     */
    getArticlesData() {
        return this.articlesData;
    }

    /**
     * Get articles by category from JSON only
     */
    getArticlesByCategory(category) {
        if (!this.articlesData) return [];
        
        if (category === 'all') {
            return this.articlesData;
        }
        
        return this.articlesData.filter(article => article.category === category);
    }

    /**
     * Get featured articles from JSON only
     */
    getFeaturedArticles() {
        if (!this.articlesData) return [];
        return this.articlesData.filter(article => article.featured === true);
    }

    /**
     * Get categories from JSON only
     */
    getCategories() {
        return this.categoriesData || {};
    }

    /**
     * Refresh articles data
     */
    async refresh() {
        try {
            await this.loadArticlesData();
        } catch (error) {
            console.error('Error refreshing articles:', error);
        }
    }

    /**
     * Get available tags from JSON only
     */
    getAvailableTags() {
        if (!this.articlesData) return [];
        
        const allTags = new Set();
        this.articlesData.forEach(article => {
            if (article.tags && Array.isArray(article.tags)) {
                article.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        return Array.from(allTags).sort();
    }
}

// Initialize blog when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const blog = new BlogManager();

    // Export to global scope for external access
    window.BlogAPI = {
        addArticle: (articleData) => blog.addArticle(articleData),
        searchArticles: (query) => blog.searchArticles(query),
        getArticlesData: () => blog.getArticlesData(),
        getArticlesByCategory: (category) => blog.getArticlesByCategory(category),
        getFeaturedArticles: () => blog.getFeaturedArticles(),
        getCategories: () => blog.getCategories(),
        getAvailableTags: () => blog.getAvailableTags(),
        refresh: () => blog.refresh()
    };

    // Make blog manager available globally for debugging
    window.blogManager = blog;
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('Blog JavaScript error:', e.error);
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BlogManager
    };
}