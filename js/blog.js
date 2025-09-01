// Blog functionality for Cani di Odino website
// Version: 2025.02.01 - Simplified system with unified date handling

/**
 * Blog manager class - Simplified
 */
class BlogManager {
    constructor() {
        this.currentFilter = 'all';
        this.articlesPerPage = 6;
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
        } catch (error) {
            console.error('Error initializing blog:', error);
            this.showError('Errore nell\'inizializzazione del blog');
        }
    }

    /**
     * Check if article is unlocked based on date
     */
    isArticleUnlocked(article) {
        if (!article.date) return true;
        
        try {
            const articleDate = new Date(article.date);
            return new Date() >= articleDate;
        } catch {
            return true;
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    /**
     * Load articles data from JSON
     */
    async loadArticlesData() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
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
            
            this.articlesData = data.articles;
            this.categoriesData = data.categories;
            
            // Filter unlocked articles and sort by date
            this.articlesData = this.articlesData
                .filter(article => {
                    const isValid = article.id && article.title && article.slug && article.category && article.excerpt;
                    const isUnlocked = this.isArticleUnlocked(article);
                    return isValid && isUnlocked;
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
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
     * Render category filters
     */
    renderCategoryFilters() {
        const filtersContainer = document.querySelector('.blog-filters');
        if (!filtersContainer || !this.categoriesData) return;

        let html = '<button class="filter-button active" data-category="all">Tutti</button>';
        
        Object.entries(this.categoriesData).forEach(([key, category]) => {
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
     * Render featured articles
     */
    renderFeaturedArticles() {
        const featuredGrid = document.getElementById('featured-grid');
        const featuredSection = document.getElementById('featured-section');
        
        if (!featuredGrid || !this.articlesData) return;

        const featuredArticles = this.articlesData.filter(article => 
            article.featured === true && this.isArticleUnlocked(article)
        );
        
        if (featuredArticles.length === 0) {
            if (featuredSection) featuredSection.style.display = 'none';
            return;
        }

        if (featuredSection) featuredSection.style.display = 'block';
        
        const html = featuredArticles.map(article => {
            const categoryName = this.getCategoryName(article.category);
            const formattedDate = this.formatDate(article.date);
            
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
                            <span class="featured-date">${formattedDate}</span>
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
     * Render all articles (paginated)
     */
    renderAllArticles() {
        const blogGrid = document.getElementById('blog-grid');
        if (!blogGrid || !this.articlesData) return;

        // Filter articles
        let filteredArticles = this.articlesData;
        
        if (this.currentFilter !== 'all') {
            filteredArticles = this.articlesData.filter(article => 
                article.category === this.currentFilter && this.isArticleUnlocked(article)
            );
        } else {
            filteredArticles = this.articlesData.filter(article => 
                this.isArticleUnlocked(article)
            );
        }

        // Get articles for current page
        const endIndex = this.currentPage * this.articlesPerPage;
        this.displayedArticles = filteredArticles.slice(0, endIndex);
        
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
            const categoryName = this.getCategoryName(article.category);
            const formattedDate = this.formatDate(article.date);
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
                            <span class="article-date">${formattedDate}</span>
                            <span class="article-author">by ${article.author}</span>
                        </div>
                        <h3 class="card-title">${article.title}</h3>
                        <p class="card-excerpt">${article.excerpt}</p>
                        <div class="card-tags">
                            ${tagsHTML}
                        </div>
                        <div class="card-footer">
                            <a href="articoli/${article.slug}.html" class="card-link">
                                Leggi Articolo
                                <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        blogGrid.innerHTML = html;
    }

    /**
     * Get category name
     */
    getCategoryName(categoryKey) {
        if (this.categoriesData && this.categoriesData[categoryKey]) {
            return this.categoriesData[categoryKey].name;
        }
        return 'Articolo';
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
     * Initialize filter buttons
     */
    initFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-button');

        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                const category = button.getAttribute('data-category');
                
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                this.currentPage = 1;
                this.currentFilter = category;
                
                this.renderAllArticles();
                this.updateLoadMoreButton();
            });
        });
    }

    /**
     * Initialize load more functionality
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
     * Load more articles
     */
    loadMoreArticles() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (!this.articlesData || this.isLoading) return;

        this.isLoading = true;
        loadMoreBtn.innerHTML = '<span>Caricamento...</span><i class="fas fa-spinner fa-spin"></i>';
        loadMoreBtn.disabled = true;

        setTimeout(() => {
            this.currentPage++;
            this.renderAllArticles();
            this.updateLoadMoreButton();
            
            loadMoreBtn.innerHTML = '<span>Carica Altri Articoli</span><i class="fas fa-chevron-down"></i>';
            loadMoreBtn.disabled = false;
            this.isLoading = false;
        }, 500);
    }

    /**
     * Update load more button visibility
     */
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn || !this.articlesData) return;

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
     * Add new article (simplified)
     */
    addArticle(articleData) {
        // Validate required fields
        const required = ['title', 'slug', 'excerpt', 'category', 'author', 'date'];
        for (const field of required) {
            if (!articleData[field]) {
                console.error(`Campo obbligatorio mancante: ${field}`);
                return false;
            }
        }

        // Set defaults
        const newArticle = {
            id: Date.now(), // Auto-generate ID
            featured: false,
            published: true,
            image: './img/logo.png',
            imageAlt: articleData.title,
            tags: [],
            seo: {
                metaDescription: articleData.excerpt,
                keywords: []
            },
            ...articleData
        };

        // Add category name if not provided
        if (!newArticle.categoryName && this.categoriesData[newArticle.category]) {
            newArticle.categoryName = this.categoriesData[newArticle.category].name;
        }

        // Add to beginning of array
        this.articlesData.unshift(newArticle);
        
        // Re-render
        this.renderCategoryFilters();
        this.renderFeaturedArticles();
        this.renderAllArticles();
        this.updateLoadMoreButton();
        
        return true;
    }
}

// Initialize blog when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const blog = new BlogManager();

    // Simplified API for external access
    window.BlogAPI = {
        addArticle: (articleData) => blog.addArticle(articleData),
        getArticles: () => blog.articlesData,
        getCategories: () => blog.categoriesData,
        refresh: () => blog.loadArticlesData()
    };

    window.blogManager = blog;
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlogManager };
}