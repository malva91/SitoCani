// Main JavaScript functionality for Cani di Odino website
// Version: 2025.01.31 - Optimized

/**
 * Performance monitoring and initialization
 */
class PerformanceMonitor {
    static init() {
        if ('performance' in window) {
            window.addEventListener('load', function() {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];

                }, 0);
            });
        }
    }
}

/**
 * Navigation functionality
 */
class Navigation {
    constructor() {
        this.navToggle = document.getElementById('nav-toggle');
        this.navMenu = document.getElementById('nav-menu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.navbar = document.querySelector('.navbar');
        this.sections = document.querySelectorAll('section[id]');
        
        this.init();
    }

    init() {
        this.initMobileMenu();
        this.initSmoothScrolling();
        this.initScrollEffects();
    }

    initMobileMenu() {
        // Mobile menu toggle
        this.navToggle?.addEventListener('click', () => {
            this.navToggle.classList.toggle('active');
            this.navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = this.navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close mobile menu when clicking on a link
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.navToggle?.classList.remove('active');
                this.navMenu?.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.navToggle && this.navMenu && 
                !this.navToggle.contains(e.target) && 
                !this.navMenu.contains(e.target)) {
                this.navToggle.classList.remove('active');
                this.navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    initSmoothScrolling() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Only handle internal anchor links
                if (href?.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    
                    // Special handling for home link - scroll to top
                    if (targetId === 'home') {
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                        return;
                    }
                    
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        const navHeight = this.navbar?.offsetHeight || 0;
                        const targetPosition = targetElement.offsetTop - navHeight;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                } else if (href && !href.startsWith('http') && !href.includes('.html')) {
                    // Handle relative links without causing redirects
                    e.preventDefault();
                    window.location.href = href;
                }
            });
        });
    }

    initScrollEffects() {
        // Throttled scroll handler
        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateNavbar();
                    this.updateActiveSection();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll);
        
        // Initial call
        this.updateNavbar();
        this.updateActiveSection();
    }

    updateNavbar() {
        if (!this.navbar) return;
        
        if (window.scrollY > 50) {
            this.navbar.style.background = 'rgba(13, 13, 13, 0.98)';
        } else {
            this.navbar.style.background = 'rgba(13, 13, 13, 0.95)';
        }
    }

    updateActiveSection() {
        const scrollPosition = window.scrollY + 100;

        this.sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                // Remove active class from all links
                this.navLinks.forEach(link => link.classList.remove('active'));
                
                // Add active class to current section link
                const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                activeLink?.classList.add('active');
            }
        });
    }
}

/**
 * Achievements functionality
 */
class Achievements {
    constructor() {
        this.toggleButton = document.getElementById('toggle-achievements');
        this.achievementsFull = document.getElementById('achievements-full');
        
        this.init();
    }

    init() {
        if (this.toggleButton && this.achievementsFull) {
            this.toggleButton.addEventListener('click', () => {
                this.toggleAchievements();
            });
        }
    }

    toggleAchievements() {
        const isVisible = this.achievementsFull.style.display !== 'none';
        
        if (isVisible) {
            this.achievementsFull.style.display = 'none';
            this.toggleButton.textContent = 'Mostra Tutte le Imprese';
        } else {
            this.achievementsFull.style.display = 'block';
            this.toggleButton.textContent = 'Nascondi Imprese';
            
            // Smooth scroll to the expanded content
            setTimeout(() => {
                this.achievementsFull.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 100);
        }
    }
}

/**
 * Animation and interaction effects
 */
class Animations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.init();
    }

    init() {
        this.initIntersectionObserver();
        this.initHoverEffects();
    }

    initIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, this.observerOptions);

        // Observe elements for animation
        const animatedElements = document.querySelectorAll(
            '.stat-card, .tool-card, .feature-card, .achievement-card, .cane-card, .preview-item'
        );
        
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }


    initHoverEffects() {
        // Only add hover effects on non-touch devices
        if ('ontouchstart' in window) return;
        
        const interactiveElements = document.querySelectorAll(
            '.cta-button, .tool-card, .social-shield, .preview-item'
        );
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            el.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
}

/**
 * Lazy loading functionality
 */
class LazyLoader {
    static init() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
}

/**
 * Utility functions
 */
class Utils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static preventHorizontalScroll() {
        // Prevent horizontal scroll on mobile
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
        
        // Fix viewport issues on mobile
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }
}

/**
 * Error handling
 */
class ErrorHandler {
    static init() {
        window.addEventListener('error', function(e) {
            console.error('JavaScript error:', e.error);
        });
    }
}

/**
 * Main application initialization
 */
class App {
    constructor() {
        this.navigation = null;
        this.achievements = null;
        this.animations = null;
    }

    init() {
        // Initialize performance monitoring
        PerformanceMonitor.init();
        
        // Prevent horizontal scroll
        Utils.preventHorizontalScroll();
        
        // Initialize core functionality
        this.navigation = new Navigation();
        this.achievements = new Achievements();
        this.animations = new Animations();
        
        // Initialize utilities
        LazyLoader.init();
        ErrorHandler.init();

    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const app = new App();
    app.init();
    
    // Initialize tools unlock status on homepage
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        initToolsUnlockStatus();
    }
});

/**
 * Initialize tools unlock status on homepage
 */
function initToolsUnlockStatus() {
    const unlockDate = new Date('2025-02-15T00:00:00');
    const isUnlocked = localStorage.getItem('tools_unlocked') === 'true' || new Date() >= unlockDate;
    const statusElement = document.getElementById('tools-unlock-status');
    
    if (statusElement) {
        if (isUnlocked) {
            statusElement.innerHTML = `
                <div style="background: rgba(76, 175, 80, 0.2); border: 2px solid #4CAF50; border-radius: 10px; padding: 1rem; display: inline-block;">
                    <span style="color: #4CAF50; font-weight: 600;">🎉 Strumenti GDR ora disponibili!</span>
                </div>
            `;
        } else {
            // Update countdown on homepage
            const updateHomepageCountdown = () => {
                const now = new Date().getTime();
                const distance = unlockDate.getTime() - now;
                
                if (distance < 0) {
                    statusElement.innerHTML = `
                        <div style="background: rgba(76, 175, 80, 0.2); border: 2px solid #4CAF50; border-radius: 10px; padding: 1rem; display: inline-block;">
                            <span style="color: #4CAF50; font-weight: 600;">🎉 Strumenti GDR ora disponibili!</span>
                        </div>
                    `;
                    return;
                }
                
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                statusElement.innerHTML = `
                    <div style="background: rgba(45, 45, 45, 0.5); border: 2px solid var(--muted-brass); border-radius: 10px; padding: 1rem; display: inline-block;">
                        <span style="color: var(--muted-brass); font-weight: 600;">🔒 Strumenti disponibili tra ${days}g ${hours}h</span>
                    </div>
                `;
            };
            
            updateHomepageCountdown();
            setInterval(updateHomepageCountdown, 60000); // Update every minute
        }
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Navigation,
        Achievements,
        Animations,
        Utils,
        App
    };
}