// Blog functionality for Cani di Odino website
// Version: 2025.09.17 - Robust windows/cards, local-date parsing, stable pagination

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
            this.initFilterButtons(); // bind after first render
            this.initLoadMore();
        } catch (error) {
            console.error('Error initializing blog:', error);
            this.showError('Errore nell\'inizializzazione del blog');
        }
    }

    /**
     * Parse a JSON date like "YYYY-MM-DD" or ISO, forcing LOCAL midnight to avoid TZ shifts
     */
    parseDateLocal(dateString) {
        if (!dateString) return null;
        // If already full ISO with time, let Date handle it (keeps local TZ)
        if (/\d{2}:\d{2}/.test(dateString)) {
            const d = new Date(dateString);
            return isNaN(d) ? null : d;
        }
        // Expecting "YYYY-MM-DD" -> build local date
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
        if (m) {
            const [ , y, mo, da ] = m.map(Number);
            const d = new Date(y, mo - 1, da, 0, 0, 0, 0);
            return isNaN(d) ? null : d;
        }
        const d = new Date(dateString);
        return isNaN(d) ? null : d;
    }

    /**
     * Check if article is unlocked based on date from JSON
     */
    isArticleUnlocked(article) {
        if (!article.date) return true;
        const articleDate = this.parseDateLocal(article.date);
        if (!articleDate) return true;
        const now = new Date();
        return now >= articleDate;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = this.parseDateLocal(dateString);
        if (!date) return '';
        try {
            return date.toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateString || '';
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

            this.categoriesData = data.categories;

            // Normalize, enrich, filter, sort
            this.articlesData = data.articles
                .map((a) => {
                    const categoryObj = this.categoriesData[a.category] || {};
                    return {
                        id: a.id ?? Date.now() + Math.random(),
                        title: a.title?.trim(),
                        slug: a.slug?.trim(),
                        excerpt: a.excerpt?.trim(),
                        category: a.category,
                        categoryName: a.categoryName || categoryObj.name || a.category || 'Altro',
                        author: a.author?.trim() || 'Redazione',
                        date: a.date,
                        image: a.image || './img/logo.png',
                        imageAlt: a.imageAlt || a.title || 'Articolo',
                        tags: Array.isArray(a.tags) ? a.tags : [],
                        featured: !!a.featured
                    };
                })
                .filter(article => {
                    const isValid = article.title && article.slug && article.category && article.excerpt;
                    const isUnlocked = this.isArticleUnlocked(article);
                    return isValid && isUnlocked;
                })
                .sort((a, b) => {
                    const da = this.parseDateLocal(a.date) || new Date(0);
                    const db = this.parseDateLocal(b.date) || new Date(0);
                    return db - da;
                });

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

        let html = '<button class="filter-button active" data-category="all" aria-pressed="true">Tutti</button>';

        Object.entries(this.categoriesData).forEach(([key, category]) => {
            const hasArticles = this.articlesData.some(article => article.category === key);
            if (hasArticles) {
                const title = category?.description ? ` title="${category.description}"` : '';
                html += `<button class="filter-button" data-category="${key}"${title} aria-pressed="false">${category?.name || key}</button>`;
            }
        });

        filtersContainer.innerHTML = html;

        // IMPORTANT: re-bind after re-render
        this.initFilterButtons();
    }

    /**
     * Show loading state
     */
    showLoading() {
        const blogGrid = document.getElementById('blog-grid');

        const loadingHTML = `
            <div class="loading" role="status" aria-live="polite">
                <span>Caricamento articoli...</span>
            </div>
        `;

        if (blogGrid) blogGrid.innerHTML = loadingHTML;
    }

    /**
     * Render featured articles (optional section hidden by default)
     */
    renderFeaturedArticles() {
        const featuredSection = document.getElementById('featured-section');
        if (featuredSection) featuredSection.style.display = 'none';
    }

    /**
     * Compute filtered list respecting current filter and unlock status
     */
    getFilteredArticles() {
        const base = this.articlesData || [];
        const unlocked = base.filter(a => this.isArticleUnlocked(a));
        if (this.currentFilter === 'all') return unlocked;
        return unlocked.filter(a => a.category === this.currentFilter);
    }

    /**
     * Render all articles (paginated)
     */
    renderAllArticles() {
        const blogGrid = document.getElementById('blog-grid');
        if (!blogGrid || !this.articlesData) return;

        const filteredArticles = this.getFilteredArticles();

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

            // Build safe image element
            const imgSrc = article.image || './img/logo.png';
            const imgAlt = (article.imageAlt || article.title || 'Articolo').replace(/"/g, '&quot;');

            return `
                <article class="blog-card" data-category="${article.category}">
                    <div class="card-image">
                        <img src="${imgSrc}"
                             alt="${imgAlt}"
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
                            <a href="articoli/${article.slug}.html" class="card-link" aria-label="Leggi ${article.title}">
                                Leggi Articolo
                                <i class="fas fa-arrow-right" aria-hidden="true"></i>
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
            <div class="error-message" role="alert">
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
        if (!filterButtons.length) return;

        filterButtons.forEach(button => {
            // Remove previous listener by cloning (prevents stacking)
            const clone = button.cloneNode(true);
            button.parentNode.replaceChild(clone, button);

            clone.addEventListener('click', (e) => {
                e.preventDefault();

                const category = clone.getAttribute('data-category');

                document.querySelectorAll('.filter-button').forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                clone.classList.add('active');
                clone.setAttribute('aria-pressed', 'true');

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
        if (!loadMoreBtn) return;

        const bind = () => {
            loadMoreBtn.addEventListener('click', () => this.loadMoreArticles());
            loadMoreBtn.addEventListener('keyup', (e) => {
                if (e.key === 'Enter' || e.key === ' ') this.loadMoreArticles();
            });
        };

        // Replace to clear old listeners if any
        const clone = loadMoreBtn.cloneNode(true);
        loadMoreBtn.parentNode.replaceChild(clone, loadMoreBtn);
        clone.setAttribute('aria-live', 'polite');
        clone.setAttribute('aria-controls', 'blog-grid');
        clone.setAttribute('type', 'button');
        bind();
    }

    /**
     * Load more articles
     */
    loadMoreArticles() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!this.articlesData || this.isLoading) return;

        this.isLoading = true;
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<span>Caricamento...</span><i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
            loadMoreBtn.disabled = true;
        }

        // Small delay to show spinner (optional)
        setTimeout(() => {
            this.currentPage++;
            this.renderAllArticles();
            this.updateLoadMoreButton();

            if (loadMoreBtn) {
                loadMoreBtn.innerHTML = '<span>Carica Altri Articoli</span><i class="fas fa-chevron-down" aria-hidden="true"></i>';
                loadMoreBtn.disabled = false;
            }
            this.isLoading = false;
        }, 300);
    }

    /**
     * Update load more button visibility
     */
    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn || !this.articlesData) return;

        const filteredArticles = this.getFilteredArticles();
        const totalArticles = filteredArticles.length;
        const displayedCount = this.displayedArticles.length;

        if (displayedCount >= totalArticles) {
            loadMoreBtn.style.display = 'none';
            loadMoreBtn.setAttribute('aria-hidden', 'true');
        } else {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.setAttribute('aria-hidden', 'false');
        }
    }

    /**
     * Add new article - simplified for easy management
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

        // Ensure categoryName from categories map if not provided
        const categoryObj = (this.categoriesData && this.categoriesData[articleData.category]) || {};
        const newArticle = {
            id: Date.now(),
            image: './img/logo.png',
            imageAlt: articleData.title,
            tags: [],
            categoryName: articleData.categoryName || categoryObj.name || articleData.category,
            ...articleData
        };

        // Add to beginning of array (newest first)
        this.articlesData.unshift(newArticle);

        // Re-render
        this.renderCategoryFilters(); // also re-binds buttons
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