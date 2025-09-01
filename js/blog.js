// Blog functionality for Cani di Odino website
// Version: 2025.02.01 - Simplified system with JSON date handling

/**
 * Blog manager class - Optimized for easy article management
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
     * Check if article is unlocked based on date from JSON
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
     * Format date for display using JSON date
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
            
            // Filter unlocked articles and sort by date (newest first)
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
        const blogGrid = document.getElementById('blog-grid');
        
        const loadingHTML = `
            <div class="loading">
                <span>Caricamento articoli...</span>
            </div>
        `;
        
        if (blogGrid) blogGrid.innerHTML = loadingHTML;
    }

    /**
     * Render featured articles (if any have featured: true)
     */
    renderFeaturedArticles() {
        // Featured articles are handled by checking if any article has featured: true
        // For now, we'll skip featured section since it's not in the simplified structure
        const featuredSection = document.getElementById('featured-section');
        if (featuredSection) featuredSection.style.display = 'none';
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
            const formattedDate = this.formatDate(article.date);
            const tagsHTML = (article.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
            
            return `
                <article class="blog-card" data-category="${article.category}">
                    <div class="card-image">
                        <img src="${article.image || './img/logo.png'}" 
                             alt="${article.imageAlt || article.title}" 
                             loading="lazy"
                             onerror="this.src='./img/logo.png'">
                        <div class="card-category">${article.categoryName}</div>
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
     * Show error message
     */
    showError(message) {
        const blogGrid = document.getElementById('blog-grid');
        
        const errorHtml = `
            <div class="error-message">
                <h3>⚠️ ${message}</h3>
                <p>Riprova più tardi o contattaci se il problema persiste.</p>
            </div>
        `;
        
        if (blogGrid) blogGrid.innerHTML = errorHtml;
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
     * Add new article - simplified for easy management
     */
    addArticle(articleData) {
        // Validate required fields
        const required = ['title', 'slug', 'excerpt', 'category', 'categoryName', 'author', 'date'];
        for (const field of required) {
            if (!articleData[field]) {
                console.error(`Campo obbligatorio mancante: ${field}`);
                return false;
            }
        }

        // Set defaults for optional fields
        const newArticle = {
            id: Date.now(), // Auto-generate ID
            image: './img/logo.png',
            imageAlt: articleData.title,
            tags: [],
            ...articleData
        };

        // Add to beginning of array (newest first)
        this.articlesData.unshift(newArticle);
        
        // Re-render
        this.renderCategoryFilters();
        this.renderAllArticles();
        this.updateLoadMoreButton();
        
        return true;
    }
}

// Initialize blog when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const blog = new BlogManager();

    // Simple API for external access
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