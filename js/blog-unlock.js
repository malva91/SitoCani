// Blog unlock system with countdown and password
// Version: 2025.02.01

class BlogUnlockManager {
    constructor() {
        // Configuration
        this.unlockDate = new Date('2025-02-15T00:00:00'); // Data di sblocco del blog
        this.unlockPassword = 'CANIBLOG2025'; // Password di sblocco (case insensitive)
        this.storageKey = 'blog_unlocked';
        
        this.init();
    }

    init() {
        // Check if blog should be unlocked
        if (this.isUnlocked()) {
            this.showBlog();
        } else {
            this.showCountdown();
        }
    }

    isUnlocked() {
        // Check if manually unlocked via password
        if (localStorage.getItem(this.storageKey) === 'true') {
            return true;
        }
        
        // Check if unlock date has passed
        return new Date() >= this.unlockDate;
    }

    showBlog() {
        const blogSection = document.querySelector('.blog-section');
        const featuredSection = document.getElementById('featured-section');
        const articlesSection = document.querySelector('.articles-section');
        
        if (blogSection) blogSection.style.display = 'block';
        if (featuredSection) featuredSection.style.display = 'block';
        if (articlesSection) articlesSection.style.display = 'block';
        
        // Remove countdown overlay if it exists
        const overlay = document.getElementById('blog-countdown-overlay');
        if (overlay) overlay.remove();
    }

    showCountdown() {
        this.createCountdownOverlay();
        this.startCountdown();
        
        // Hide actual blog content
        const blogSection = document.querySelector('.blog-section');
        const featuredSection = document.getElementById('featured-section');
        const articlesSection = document.querySelector('.articles-section');
        
        if (blogSection) blogSection.style.display = 'none';
        if (featuredSection) featuredSection.style.display = 'none';
        if (articlesSection) articlesSection.style.display = 'none';
    }

    createCountdownOverlay() {
        const blogHero = document.querySelector('.blog-hero');
        if (!blogHero) return;

        const overlay = document.createElement('div');
        overlay.id = 'blog-countdown-overlay';
        overlay.innerHTML = `
            <div class="blog-countdown-container">
                <div class="blog-countdown-content">
                    <div class="blog-countdown-icon">📚</div>
                    <h2 class="blog-countdown-title">Cronache in Arrivo</h2>
                    <p class="blog-countdown-description">
                        Il blog dei Cani di Odino aprirà le porte il 
                        <strong>${this.unlockDate.toLocaleDateString('it-IT', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</strong>. Preparati a scoprire <strong>guide per master</strong>, 
                        <strong>recensioni GDR</strong>, <strong>consigli per fiere ludiche</strong> 
                        e contenuti esclusivi dal mondo dei giochi di ruolo.
                    </p>
                    
                    <div class="blog-countdown-timer" id="blog-countdown-timer">
                        <div class="blog-time-unit">
                            <span class="blog-time-value" id="blog-days">00</span>
                            <span class="blog-time-label">Giorni</span>
                        </div>
                        <div class="blog-time-unit">
                            <span class="blog-time-value" id="blog-hours">00</span>
                            <span class="blog-time-label">Ore</span>
                        </div>
                        <div class="blog-time-unit">
                            <span class="blog-time-value" id="blog-minutes">00</span>
                            <span class="blog-time-label">Minuti</span>
                        </div>
                        <div class="blog-time-unit">
                            <span class="blog-time-value" id="blog-seconds">00</span>
                            <span class="blog-time-label">Secondi</span>
                        </div>
                    </div>

                    <div class="blog-password-section">
                        <button class="blog-password-toggle" id="blog-password-toggle">
                            🗝️ Hai una password di accesso anticipato?
                        </button>
                        <div class="blog-password-form" id="blog-password-form" style="display: none;">
                            <div class="blog-password-input-group">
                                <input type="password" id="blog-unlock-password" placeholder="Inserisci la password..." autocomplete="off">
                                <button type="button" id="blog-unlock-submit">Sblocca</button>
                            </div>
                            <p class="blog-password-hint">Inserisci la password per accedere al blog in anteprima</p>
                            <div class="blog-password-feedback" id="blog-password-feedback"></div>
                        </div>
                    </div>

                    <div class="blog-preview-features">
                        <h3>📖 Contenuti in Arrivo:</h3>
                        <div class="blog-features-grid">
                            <div class="blog-feature-preview">
                                <span class="blog-feature-icon">🎯</span>
                                <span class="blog-feature-name">Guide per Master</span>
                            </div>
                            <div class="blog-feature-preview">
                                <span class="blog-feature-icon">📝</span>
                                <span class="blog-feature-name">Recensioni GDR</span>
                            </div>
                            <div class="blog-feature-preview">
                                <span class="blog-feature-icon">🎪</span>
                                <span class="blog-feature-name">Resoconti Fiere</span>
                            </div>
                            <div class="blog-feature-preview">
                                <span class="blog-feature-icon">💡</span>
                                <span class="blog-feature-name">Consigli Pratici</span>
                            </div>
                            <div class="blog-feature-preview">
                                <span class="blog-feature-icon">📚</span>
                                <span class="blog-feature-name">Storie dalla Taverna</span>
                            </div>
                            <div class="blog-feature-preview">
                                <span class="blog-feature-icon">🔧</span>
                                <span class="blog-feature-name">Tips & Tricks</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert after hero section
        blogHero.insertAdjacentElement('afterend', overlay);
        
        this.initPasswordForm();
    }

    initPasswordForm() {
        const passwordToggle = document.getElementById('blog-password-toggle');
        const passwordForm = document.getElementById('blog-password-form');
        const passwordInput = document.getElementById('blog-unlock-password');
        const unlockSubmit = document.getElementById('blog-unlock-submit');
        const passwordFeedback = document.getElementById('blog-password-feedback');

        passwordToggle?.addEventListener('click', () => {
            const isVisible = passwordForm.style.display !== 'none';
            passwordForm.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                setTimeout(() => passwordInput?.focus(), 100);
            }
        });

        unlockSubmit?.addEventListener('click', () => {
            this.checkPassword();
        });

        passwordInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.checkPassword();
            }
        });

        passwordInput?.addEventListener('input', () => {
            passwordFeedback.textContent = '';
            passwordFeedback.className = 'blog-password-feedback';
        });
    }

    checkPassword() {
        const passwordInput = document.getElementById('blog-unlock-password');
        const passwordFeedback = document.getElementById('blog-password-feedback');
        const unlockSubmit = document.getElementById('blog-unlock-submit');
        
        if (!passwordInput || !passwordFeedback || !unlockSubmit) return;

        const enteredPassword = passwordInput.value.trim().toUpperCase();
        
        if (!enteredPassword) {
            this.showPasswordFeedback('Inserisci una password', 'error');
            return;
        }

        // Show loading state
        unlockSubmit.textContent = 'Verifica...';
        unlockSubmit.disabled = true;

        setTimeout(() => {
            if (enteredPassword === this.unlockPassword) {
                // Correct password
                localStorage.setItem(this.storageKey, 'true');
                this.showPasswordFeedback('🎉 Password corretta! Sblocco del blog in corso...', 'success');
                
                setTimeout(() => {
                    this.unlockBlog();
                }, 1500);
            } else {
                // Wrong password
                this.showPasswordFeedback('❌ Password non corretta', 'error');
                passwordInput.select();
            }
            
            // Reset button
            unlockSubmit.textContent = 'Sblocca';
            unlockSubmit.disabled = false;
        }, 1000);
    }

    showPasswordFeedback(message, type) {
        const passwordFeedback = document.getElementById('blog-password-feedback');
        if (!passwordFeedback) return;

        passwordFeedback.textContent = message;
        passwordFeedback.className = `blog-password-feedback ${type}`;
    }

    unlockBlog() {
        // Add unlock animation
        const overlay = document.getElementById('blog-countdown-overlay');
        if (overlay) {
            overlay.style.animation = 'blogUnlockFadeOut 1s ease-out forwards';
            
            setTimeout(() => {
                this.showBlog();
            }, 1000);
        } else {
            this.showBlog();
        }
    }

    startCountdown() {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = this.unlockDate.getTime() - now;

            if (distance < 0) {
                // Time's up - unlock automatically
                localStorage.setItem(this.storageKey, 'true');
                this.unlockBlog();
                return;
            }

            // Calculate time units
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Update display
            this.updateCountdownDisplay(days, hours, minutes, seconds);
        };

        // Update immediately and then every second
        updateCountdown();
        this.countdownInterval = setInterval(updateCountdown, 1000);
    }

    updateCountdownDisplay(days, hours, minutes, seconds) {
        const daysEl = document.getElementById('blog-days');
        const hoursEl = document.getElementById('blog-hours');
        const minutesEl = document.getElementById('blog-minutes');
        const secondsEl = document.getElementById('blog-seconds');

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    destroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on blog page
    if (window.location.pathname.includes('blog.html') || document.querySelector('.blog-section')) {
        window.blogUnlockManager = new BlogUnlockManager();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.blogUnlockManager) {
        window.blogUnlockManager.destroy();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlogUnlockManager };
}