// Article page functionality
// Version: 2025.02.01 - Simplified with JSON date handling

class ArticleManager {
    constructor() {
        this.currentArticleSlug = this.getCurrentArticleSlug();
        this.init();
    }

    init() {
        this.loadRelatedArticles();
        this.initSocialSharing();
        this.trackReadingProgress();
    }

    getCurrentArticleSlug() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '');
    }

    async loadRelatedArticles() {
        try {
            const response = await fetch('../data/articles.json');
            const data = await response.json();
            
            // Find current article
            const currentArticle = data.articles.find(article => 
                article.slug === this.currentArticleSlug
            );

            if (!currentArticle) return;

            // Get related articles (same category, excluding current)
            const relatedArticles = data.articles
                .filter(article => 
                    article.category === currentArticle.category && 
                    article.slug !== this.currentArticleSlug &&
                    this.isArticleUnlocked(article)
                )
                .slice(0, 3);

            // If not enough from same category, add from other categories
            if (relatedArticles.length < 3) {
                const additionalArticles = data.articles
                    .filter(article => 
                        article.category !== currentArticle.category && 
                        article.slug !== this.currentArticleSlug &&
                        this.isArticleUnlocked(article)
                    )
                    .slice(0, 3 - relatedArticles.length);
                
                relatedArticles.push(...additionalArticles);
            }

            this.renderRelatedArticles(relatedArticles);

        } catch (error) {
            console.error('Error loading related articles:', error);
        }
    }

    /**
     * Check if article is unlocked based on JSON date
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
     * Format date using JSON date
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

    renderRelatedArticles(articles) {
        const container = document.getElementById('related-articles');
        if (!container || articles.length === 0) return;

        const html = articles.map(article => `
            <a href="${article.slug}.html" class="related-card">
                <h4>${article.title}</h4>
                <p>${article.excerpt}</p>
                <div class="related-meta">
                    <span class="related-category">${article.categoryName}</span>
                    <span class="related-date">${this.formatDate(article.date)}</span>
                </div>
            </a>
        `).join('');

        container.innerHTML = html;
    }

    initSocialSharing() {
        // Add social sharing functionality if needed
        const shareButtons = document.querySelectorAll('.share-button');
        
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = button.getAttribute('data-platform');
                this.shareOnPlatform(platform);
            });
        });
    }

    shareOnPlatform(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        
        let shareUrl = '';
        
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }

    trackReadingProgress() {
        // Track reading progress for analytics
        let maxScroll = 0;
        
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                // Track milestones
                if (maxScroll >= 25 && maxScroll < 50) {
                    console.log('Article 25% read');
                } else if (maxScroll >= 50 && maxScroll < 75) {
                    console.log('Article 50% read');
                } else if (maxScroll >= 75 && maxScroll < 100) {
                    console.log('Article 75% read');
                } else if (maxScroll >= 100) {
                    console.log('Article 100% read');
                }
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ArticleManager();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArticleManager };
}