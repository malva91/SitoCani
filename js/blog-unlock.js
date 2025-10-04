// Blog unlock system - REMOVED GENERAL BLOG LOCK
// Version: 2025.02.01 - Only individual article unlocking based on JSON dates

class BlogUnlockManager {
    constructor() {
        // No general blog lock - only individual article dates from JSON

    }

    init() {
        // Blog is always unlocked - individual articles controlled by JSON dates
        this.showBlog();
    }

    showBlog() {
        const blogSection = document.querySelector('.blog-section');
        const featuredSection = document.getElementById('featured-section');
        const articlesSection = document.querySelector('.articles-section');
        
        if (blogSection) blogSection.style.display = 'block';
        if (featuredSection) featuredSection.style.display = 'block';
        if (articlesSection) articlesSection.style.display = 'block';
        
        // Remove any countdown overlay if it exists
        const overlay = document.getElementById('blog-countdown-overlay');
        if (overlay) overlay.remove();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on blog page
    if (window.location.pathname.includes('blog.html') || document.querySelector('.blog-section')) {
        window.blogUnlockManager = new BlogUnlockManager();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlogUnlockManager };
}