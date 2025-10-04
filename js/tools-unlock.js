// Tools unlock system with countdown and password
// Version: 2025.02.01

class ToolsUnlockManager {
    constructor() {
        // Configuration
        this.unlockDate = new Date('2025-10-01T00:00:00'); // Data di sblocco
        this.unlockPassword = 'CANITOPLAY'; // Password di sblocco (case insensitive)
        this.storageKey = 'tools_unlocked';
        
        this.init();
    }

    init() {
        // Check if tools should be unlocked
        if (this.isUnlocked()) {
            this.showTools();
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

    showTools() {
        const toolsSection = document.querySelector('.tools-section');
        const toolsHero = document.querySelector('.tools-hero');
        
        if (toolsSection) toolsSection.style.display = 'block';
        if (toolsHero) toolsHero.style.display = 'block';
        
        // Remove countdown overlay if it exists
        const overlay = document.getElementById('tools-countdown-overlay');
        if (overlay) overlay.remove();
    }

    showCountdown() {
        this.createCountdownOverlay();
        this.startCountdown();
        
        // Hide actual tools content
        const toolsSection = document.querySelector('.tools-section');
        if (toolsSection) toolsSection.style.display = 'none';
    }

    createCountdownOverlay() {
        const toolsHero = document.querySelector('.tools-hero');
        if (!toolsHero) return;

        const overlay = document.createElement('div');
        overlay.id = 'tools-countdown-overlay';
        overlay.innerHTML = `
            <div class="countdown-container">
                <div class="countdown-content">
                    <div class="countdown-icon">🔒</div>
                    <h2 class="countdown-title">Strumenti in Arrivo</h2>
                    <p class="countdown-description">
                        I nostri strumenti GDR professionali saranno disponibili il 
                        <p>${this.unlockDate.toLocaleDateString('it-IT', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</p>
                    </p>
                    
                    <div class="countdown-timer" id="countdown-timer">
                        <div class="time-unit">
                            <span class="time-value" id="days">00</span>
                            <span class="time-label">Giorni</span>
                        </div>
                        <div class="time-unit">
                            <span class="time-value" id="hours">00</span>
                            <span class="time-label">Ore</span>
                        </div>
                        <div class="time-unit">
                            <span class="time-value" id="minutes">00</span>
                            <span class="time-label">Minuti</span>
                        </div>
                        <div class="time-unit">
                            <span class="time-value" id="seconds">00</span>
                            <span class="time-label">Secondi</span>
                        </div>
                    </div>

                    <div class="password-section">
                        <button class="password-toggle" id="password-toggle">
                            🗝️ Hai una password di accesso anticipato?
                        </button>
                        <div class="password-form" id="password-form" style="display: none;">
                            <div class="password-input-group">
                                <input type="password" id="unlock-password" placeholder="Inserisci la password..." autocomplete="off">
                                <button type="button" id="unlock-submit">Sblocca</button>
                            </div>
                            <p class="password-hint">Inserisci la password per accedere agli strumenti in anteprima</p>
                            <div class="password-feedback" id="password-feedback"></div>
                        </div>
                    </div>

                    <div class="preview-features">
                        <h3>🛠️ Strumenti in Arrivo:</h3>
                        <div class="features-grid">
                            <div class="feature-preview">
                                <span class="feature-icon">🎲</span>
                                <span class="feature-name">Generatore Dadi Avanzato</span>
                            </div>
                            <div class="feature-preview">
                                <span class="feature-icon">👤</span>
                                <span class="feature-name">Generatore Nomi Fantasy</span>
                            </div>
                            <div class="feature-preview">
                                <span class="feature-icon">⚔️</span>
                                <span class="feature-name">Generatore Avventure</span>
                            </div>
                            <div class="feature-preview">
                                <span class="feature-icon">💎</span>
                                <span class="feature-name">Generatore Tesori</span>
                            </div>
                            <div class="feature-preview">
                                <span class="feature-icon">🗡️</span>
                                <span class="feature-name">Generatore Armi</span>
                            </div>
                            <div class="feature-preview">
                                <span class="feature-icon">🏰</span>
                                <span class="feature-name">Generatore Città</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert after hero section
        toolsHero.insertAdjacentElement('afterend', overlay);
        
        this.initPasswordForm();
    }

    initPasswordForm() {
        const passwordToggle = document.getElementById('password-toggle');
        const passwordForm = document.getElementById('password-form');
        const passwordInput = document.getElementById('unlock-password');
        const unlockSubmit = document.getElementById('unlock-submit');
        const passwordFeedback = document.getElementById('password-feedback');

        passwordToggle?.addEventListener('click', () => {
            const isVisible = passwordForm.style.display !== 'none';
            passwordForm.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                setTimeout(() => passwordInput?.focus({ preventScroll: true }), 100);
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
            passwordFeedback.className = 'password-feedback';
        });
    }

    checkPassword() {
        const passwordInput = document.getElementById('unlock-password');
        const passwordFeedback = document.getElementById('password-feedback');
        const unlockSubmit = document.getElementById('unlock-submit');
        
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
                this.showPasswordFeedback('🎉 Password corretta! Sblocco in corso...', 'success');
                
                setTimeout(() => {
                    this.unlockTools();
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
        const passwordFeedback = document.getElementById('password-feedback');
        if (!passwordFeedback) return;

        passwordFeedback.textContent = message;
        passwordFeedback.className = `password-feedback ${type}`;
    }

    unlockTools() {
        // Add unlock animation
        const overlay = document.getElementById('tools-countdown-overlay');
        if (overlay) {
            overlay.style.animation = 'unlockFadeOut 1s ease-out forwards';
            
            setTimeout(() => {
                this.showTools();
            }, 1000);
        } else {
            this.showTools();
        }
    }

    startCountdown() {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = this.unlockDate.getTime() - now;

            if (distance < 0) {
                // Time's up - unlock automatically
                localStorage.setItem(this.storageKey, 'true');
                this.unlockTools();
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
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

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
    // Only initialize on tools page
    if (window.location.pathname.includes('tools.html') || document.querySelector('.tools-section')) {
        window.toolsUnlockManager = new ToolsUnlockManager();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.toolsUnlockManager) {
        window.toolsUnlockManager.destroy();
    }
});