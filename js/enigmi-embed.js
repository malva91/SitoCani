// /js/enigmi-embed.js
// Carica la rubrica enigmi **senza iframe**, inserendola direttamente nella pagina
(function() {
  function onReady(fn){document.readyState!=='loading'?fn():document.addEventListener('DOMContentLoaded',fn);}
  onReady(() => {
    // 1) Trova o crea la sezione #enigmi
    let section = document.querySelector('section#enigmi.section.section-dark');
    if (!section) {
      section = document.createElement('section');
      section.id = 'enigmi';
      section.className = 'section section-dark';
      const after = document.querySelector('script[src*="enigmi-embed.js"]');
      (after?.parentElement || document.body).insertBefore(section, after);
    }
    let container = section.querySelector('.container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'container';
      section.appendChild(container);
    }

    // 2) Assicura i CSS
    const cssHref = '/css/enigma.css';
    if (!document.querySelector('link[href="'+cssHref+'"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    }

    // 3) Inietta il markup della rubrica (copiato da enigmi.html)
    container.innerHTML = `<div aria-label="Rubrica di Enigmi" class="card" id="weekly-riddle" role="region">
<div class="riddle-header">
<div class="riddle-title">Enigma settimanale</div>
<div class="header-actions">
<div class="rank-badge current" id="currentRankDisplay" style="display:none">
<span class="rank-icon" id="currentRankIcon">🌱</span>
<span id="currentRankName">Novizio</span>
</div>
<button aria-controls="pw-modal" aria-haspopup="dialog" class="btn ghost" id="openPw" title="Inserisci password per saltare a un livello specifico">🗝️ Salta livello</button>
</div>
</div>
<div class="riddle-body">
<div id="content">
<div class="loading">Caricamento enigma...</div>
</div>
<div class="progress-info" id="progressInfo" style="display:none">
<div class="level-info">
<span class="level-number" id="levelNumber">1</span>
<span id="levelTitle">Livello 1</span>
</div>
<div class="rank-badge" id="enigmaRankBadge">
<span class="rank-icon" id="enigmaRankIcon">🌱</span>
<span id="enigmaRankName">Novizio</span>
</div>
<div class="progress-stats">
<div class="stat">
<span>🏆</span>
<span id="solvedCount">0</span>
</div>
<div class="stat">
<span>📊</span>
<span id="totalCount">0</span>
</div>
</div>
</div>
<div class="riddle-actions" id="answerBox" style="display:none">
<label class="sr-only" for="answer">Risposta</label>
<input autocomplete="off" id="answer" placeholder="Inserisci la tua risposta..." type="text"/>
<button class="btn" id="check">Verifica</button>
<button class="btn ghost" id="hintBtn" style="display:none">💡 Aiuto</button>
</div>
<div aria-live="polite" class="status" id="feedback"></div>
</div>
</div><div aria-labelledby="pw-title" aria-modal="true" id="pw-modal" role="dialog">
<div class="dialog">
<h3 id="pw-title">🗝️ Salta a un livello specifico</h3>
<div class="row">
<input autocomplete="off" id="pw-input" inputmode="text" placeholder="Es. Cani10ex" type="text"/>
<button class="btn" id="pw-apply">Applica</button>
<button class="btn ghost" id="pw-close">Chiudi</button>
</div>
<p class="small">Inserisci la password che hai ricevuto dopo aver risolto un enigma per saltare direttamente al livello successivo.</p>
</div>
</div><script type="module">
    // ========== CONFIGURAZIONE ==========
    const VERSION = "2025-01-27-v3";
    const JSON_URL = \`/enigmi/enigmi.json?v=\${VERSION}\`;
    
    // ========== SELETTORI DOM ==========
    const $ = (s, r = document) => r.querySelector(s);
    const elements = {
      content: $("#content"),
      feedback: $("#feedback"),
      answerBox: $("#answerBox"),
      progressInfo: $("#progressInfo"),
      levelNumber: $("#levelNumber"),
      levelTitle: $("#levelTitle"),
      enigmaRankBadge: $("#enigmaRankBadge"),
      enigmaRankIcon: $("#enigmaRankIcon"),
      enigmaRankName: $("#enigmaRankName"),
      currentRankDisplay: $("#currentRankDisplay"),
      currentRankIcon: $("#currentRankIcon"),
      currentRankName: $("#currentRankName"),
      solvedCount: $("#solvedCount"),
      totalCount: $("#totalCount"),
      input: $("#answer"),
      checkBtn: $("#check"),
      hintBtn: $("#hintBtn"),
      pwModal: $("#pw-modal"),
      openPw: $("#openPw"),
      pwInput: $("#pw-input"),
      pwApply: $("#pw-apply"),
      pwClose: $("#pw-close")
    };

    // ========== STATO GLOBALE ==========
    let ENIGMI = [];
    let currentId = null;
    let isLoading = false;

    // ========== UTILITÀ ==========
    const utils = {
      // Normalizzazione case-insensitive per input non testuali
      normalizeAnswer: (str) => {
        if (!str) return "";
        return str.toString().trim().toUpperCase().replace(/\\s+/g, "");
      },
      
      // Normalizzazione per password (case-insensitive)
      normalizePassword: (str) => {
        if (!str) return "";
        return str.toString().trim().toLowerCase();
      },
      
      // Parsing sicuro delle date
      parseDate: (dateStr) => {
        if (!dateStr) return null;
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        } catch {
          return null;
        }
      },
      
      // Controllo se una data è sbloccata
      isDateUnlocked: (dateStr) => {
        if (!dateStr) return true;
        const unlockDate = utils.parseDate(dateStr);
        return !unlockDate || new Date() >= unlockDate;
      },
      
      // Gestione localStorage sicura
      storage: {
        get: (key, defaultValue = 0) => {
          try {
            const value = localStorage.getItem(key);
            if (!value) return defaultValue;
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
          } catch {
            return defaultValue;
          }
        },
        
        set: (key, value) => {
          try {
            const validValue = Math.max(0, parseInt(value, 10) || 0);
            localStorage.setItem(key, String(validValue));
            return true;
          } catch {
            return false;
          }
        }
      },
      
      // Comunicazione con parent frame
      postHeight: (() => {
        let timeout;
        return () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            try {
              const height = Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight
              );
              parent?.postMessage?.({ 
                type: "ENIGMI_IFRAME_HEIGHT", 
                height 
              }, "*");
            } catch (e) {
              console.warn("Errore comunicazione parent:", e);
            }
          }, 100);
        };
      })()
    };

    // ========== GESTIONE DATI ==========
    const dataManager = {
      async load() {
        if (isLoading) return;
        
        try {
          isLoading = true;
          
          const response = await fetch(JSON_URL, { 
            cache: "no-store",
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
          }
          
          const data = await response.json();
          
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Dati non validi o vuoti");
          }
          
          ENIGMI = data
            .filter(e => e?.id && e?.answer && e?.rank && e?.rankIcon)
            .map(e => ({
              ...e,
              id: parseInt(e.id, 10),
              answer: utils.normalizeAnswer(e.answer),
              title: e.title || \`Enigma \${e.id}\`,
              rank: e.rank || "Sconosciuto",
              rankIcon: e.rankIcon || "❓",
              password: e.password || \`Cani\${e.id}ex\`,
              hint: e.hint || null,
              unlockDate: e.unlockDate || null
            }))
            .sort((a, b) => a.id - b.id);
          
          if (ENIGMI.length === 0) {
            throw new Error("Nessun enigma valido trovato");
          }
          
        } catch (error) {
          console.error("Errore caricamento:", error);
          throw error;
        } finally {
          isLoading = false;
        }
      }
    };

    // ========== GESTIONE PROGRESSO ==========
    const progressManager = {
      getLastSolved: () => utils.storage.get("riddle_lastSolvedId"),
      
      setLastSolved: (id) => utils.storage.set("riddle_lastSolvedId", id),
      
      isLevelUnlocked: (levelId) => {
        if (!levelId || levelId < 1) return false;
        
        const enigma = ENIGMI.find(x => x.id === levelId);
        if (!enigma) return false;
        
        const lastSolved = progressManager.getLastSolved();
        
        // Controllo propedeuticità
        if (levelId > lastSolved + 1) return false;
        
        // Controllo data
        return utils.isDateUnlocked(enigma.unlockDate);
      },
      
      getNextAvailable: () => {
        const lastSolved = progressManager.getLastSolved();
        const nextLevel = lastSolved + 1;
        
        return progressManager.isLevelUnlocked(nextLevel) ? nextLevel : 
               lastSolved > 0 ? lastSolved : 1;
      }
    };

    // ========== GESTIONE PASSWORD ==========
    const passwordManager = {
      parse: (pw) => {
        if (!pw || typeof pw !== 'string') return null;
        
        const normalized = utils.normalizePassword(pw);
        const match = /^cani(\\d+)ex$/.exec(normalized);
        
        if (!match) return null;
        
        const level = parseInt(match[1], 10);
        return (isNaN(level) || level < 1) ? null : level;
      },
      
      apply: (password) => {
        const targetLevel = passwordManager.parse(password);
        if (!targetLevel) {
          ui.showError("Password non valida. Formato: Cani[numero]ex");
          return false;
        }
        
        const targetEnigma = ENIGMI.find(x => x.id === targetLevel);
        if (!targetEnigma) {
          ui.showError(\`Livello \${targetLevel} non trovato\`);
          return false;
        }
        
        const levelsToUnlock = targetLevel - 1;
        if (levelsToUnlock > 0) {
          progressManager.setLastSolved(levelsToUnlock);
          ui.updateCurrentRank();
        }
        
        const nextAvailable = progressManager.getNextAvailable();
        navigation.goToLevel(nextAvailable);
        
        setTimeout(() => {
          ui.showFeedback("ok", 
            \`🗝️ Password applicata! Livelli 1-\${levelsToUnlock} sbloccati.\`
          );
        }, 500);
        
        return true;
      }
    };

    // ========== NAVIGAZIONE ==========
    const navigation = {
      goToLevel: (id) => {
        if (!id || id < 1) {
          ui.showError("ID livello non valido");
          return;
        }
        
        const enigma = ENIGMI.find(x => x.id === id);
        if (!enigma) {
          ui.showError(\`Enigma \${id} non trovato\`);
          return;
        }
        
        if (!progressManager.isLevelUnlocked(id)) {
          ui.showLocked(id, enigma);
          return;
        }
        
        currentId = id;
        ui.renderEnigma(enigma);
      }
    };

    // ========== INTERFACCIA UTENTE ==========
    const ui = {
      showError: (message) => {
        elements.content.innerHTML = \`
          <div class="special-message error">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <h3>Errore</h3>
            <p>\${message}</p>
          </div>
        \`;
        ui.hideControls();
      },
      
      showLocked: (id, enigma) => {
        const lastSolved = progressManager.getLastSolved();
        let message, details;
        
        if (id > lastSolved + 1) {
          message = "🔒 Livello non ancora sbloccato";
          details = \`Devi completare prima il livello \${lastSolved + 1}.\`;
        } else {
          const unlockDate = utils.parseDate(enigma.unlockDate);
          const dateStr = unlockDate?.toLocaleDateString('it-IT', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          }) || enigma.unlockDate;
          message = "⏰ Enigma non ancora disponibile";
          details = \`Sarà sbloccato il \${dateStr}.\`;
        }
        
        elements.content.innerHTML = \`
          <div class="special-message locked">
            <div style="font-size: 3rem; margin-bottom: 1rem;">
              \${id > lastSolved + 1 ? '🔒' : '⏰'}
            </div>
            <h3>\${message}</h3>
            <p>\${details}</p>
          </div>
        \`;
        ui.hideControls();
      },
      
      renderEnigma: (enigma) => {
        ui.updateProgress(enigma);
        
        let html = "";
        
        try {
          if (enigma.type === "image" && enigma.image) {
            html = \`
              <figure>
                <img src="\${enigma.image}" alt="\${enigma.alt || enigma.title}" 
                     loading="lazy" onerror="this.style.display='none';">
                \${enigma.question ? \`<figcaption>\${enigma.question}</figcaption>\` : ''}
              </figure>
            \`;
          } else if (enigma.type === "mixed") {
            if (enigma.html) html += enigma.html;
            if (enigma.image) {
              html += \`
                <figure>
                  <img src="\${enigma.image}" alt="\${enigma.alt || enigma.title}" 
                       loading="lazy" onerror="this.style.display='none';">
                </figure>
              \`;
            }
            if (enigma.question) {
              html += \`
                <div style="margin-top: 1.5rem;">
                  <h3>❓ Domanda:</h3>
                  <p><strong>\${enigma.question}</strong></p>
                </div>
              \`;
            }
          } else {
            html = \`
              <div class="text-enigma">
                <h3>🤔 \${enigma.title}</h3>
                <p><strong>\${enigma.question || 'Risolvi questo enigma:'}</strong></p>
              </div>
            \`;
          }
          
          elements.content.innerHTML = html;
        } catch (e) {
          console.error("Errore rendering:", e);
          elements.content.innerHTML = \`
            <p><strong>\${enigma.question || 'Risolvi questo enigma:'}</strong></p>
          \`;
        }
        
        ui.showControls(enigma);
        ui.resetInput();
        utils.postHeight();
      },
      
      updateProgress: (enigma) => {
        const solved = progressManager.getLastSolved();
        const total = ENIGMI.length;
        
        elements.levelNumber.textContent = enigma.id;
        elements.levelTitle.textContent = enigma.title;
        elements.enigmaRankIcon.textContent = enigma.rankIcon;
        elements.enigmaRankName.textContent = enigma.rank;
        elements.solvedCount.textContent = solved;
        elements.totalCount.textContent = total;
        
        // Animazione badge
        elements.enigmaRankBadge.style.transform = 'scale(1.05)';
        setTimeout(() => {
          elements.enigmaRankBadge.style.transform = 'scale(1)';
        }, 200);
      },
      
      updateCurrentRank: () => {
        const lastSolved = progressManager.getLastSolved();
        
        if (lastSolved > 0) {
          const lastEnigma = ENIGMI.find(x => x.id === lastSolved);
          if (lastEnigma) {
            elements.currentRankIcon.textContent = lastEnigma.rankIcon;
            elements.currentRankName.textContent = lastEnigma.rank;
            elements.currentRankDisplay.style.display = "inline-flex";
            return;
          }
        }
        
        elements.currentRankDisplay.style.display = "none";
      },
      
      showControls: (enigma) => {
        elements.answerBox.style.display = "flex";
        elements.progressInfo.style.display = "flex";
        elements.hintBtn.style.display = enigma.hint ? "inline-block" : "none";
      },
      
      hideControls: () => {
        elements.answerBox.style.display = "none";
        elements.progressInfo.style.display = "none";
        ui.clearFeedback();
      },
      
      resetInput: () => {
        elements.input.value = "";
        ui.clearFeedback();
        setTimeout(() => elements.input.focus({ preventScroll: true }), 150);
      },
      
      showFeedback: (type, message) => {
        elements.feedback.className = \`status \${type}\`;
        elements.feedback.innerHTML = message;
        utils.postHeight();
      },
      
      clearFeedback: () => {
        elements.feedback.textContent = "";
        elements.feedback.className = "status";
      },
      
      showHint: () => {
        const enigma = ENIGMI.find(x => x.id === currentId);
        if (!enigma?.hint) return;
        
        const existing = document.querySelector('.hint-message');
        if (existing) existing.remove();
        
        const hintDiv = document.createElement('div');
        hintDiv.className = 'status hint-message';
        hintDiv.innerHTML = \`💡 <strong>Suggerimento:</strong> \${enigma.hint}\`;
        
        elements.feedback.parentNode.insertBefore(hintDiv, elements.feedback);
        utils.postHeight();
      }
    };

    // ========== GESTIONE RISPOSTE ==========
    const answerManager = {
      check: () => {
        if (!currentId) {
          ui.showFeedback("err", "Nessun enigma attivo");
          return;
        }
        
        const enigma = ENIGMI.find(x => x.id === currentId);
        if (!enigma) {
          ui.showFeedback("err", "Enigma non trovato");
          return;
        }
        
        const userAnswer = utils.normalizeAnswer(elements.input.value);
        if (!userAnswer) {
          ui.showFeedback("err", "Inserisci una risposta");
          elements.input.focus({ preventScroll: true });
          return;
        }
        
        const isCorrect = userAnswer === enigma.answer;
        
        if (isCorrect) {
          answerManager.handleCorrect(enigma);
        } else {
          ui.showFeedback("err", "Risposta non corretta. Riprova!");
          elements.input.select();
        }
      },
      
      handleCorrect: (enigma) => {
        progressManager.setLastSolved(enigma.id);
        ui.updateCurrentRank();
        elements.solvedCount.textContent = enigma.id;
        
        let congratsHtml = \`
          <div class="congrats-header">
            <span class="congrats-icon">\${enigma.rankIcon}</span>
            <div>
              <div class="congrats-title">🎉 Congratulazioni!</div>
              <div class="congrats-rank">Ora il tuo grado è: \${enigma.rank}</div>
            </div>
          </div>
          <div class="password-box">
            <div class="password-label">🗝️ Password per questo livello:</div>
            <code class="password-code">\${enigma.password}</code>
          </div>
        \`;
        
        const nextEnigma = ENIGMI.find(x => x.id === enigma.id + 1);
        if (nextEnigma) {
          if (progressManager.isLevelUnlocked(nextEnigma.id)) {
            congratsHtml += \`
              <div class="next-level-info">
                🚀 Passaggio al prossimo livello tra poco...
              </div>
            \`;
            
            ui.showFeedback("ok", congratsHtml);
            
            setTimeout(() => {
              navigation.goToLevel(nextEnigma.id);
            }, 3000);
          } else {
            const unlockDate = utils.parseDate(nextEnigma.unlockDate);
            const dateStr = unlockDate?.toLocaleDateString('it-IT', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }) || nextEnigma.unlockDate;
            
            congratsHtml += \`
              <div class="next-enigma-locked">
                <div class="next-enigma-header">
                  <span>⏰</span>
                  <div class="next-enigma-title">Prossimo Enigma</div>
                </div>
                <div class="next-enigma-details">
                  <span>\${nextEnigma.rankIcon}</span>
                  <strong>\${nextEnigma.title}</strong>
                  <span>•</span>
                  <span class="next-enigma-rank">\${nextEnigma.rank}</span>
                  <span>(Livello \${nextEnigma.id})</span>
                </div>
                <div class="next-enigma-date">
                  Sarà disponibile <strong>\${dateStr}</strong>.<br>
                  Torna più tardi per continuare!
                </div>
              </div>
            \`;
            
            ui.showFeedback("ok", congratsHtml);
          }
        } else {
          congratsHtml += \`
            <div class="mission-complete">
              <div class="mission-icon">🏆</div>
              <div class="mission-title">Missione Completata!</div>
              <div class="mission-subtitle">Hai risolto tutti gli enigmi!</div>
            </div>
          \`;
          
          ui.showFeedback("ok", congratsHtml);
        }
      }
    };

    // ========== GESTIONE MODAL ==========
    const modalManager = {
      open: () => {
        elements.pwModal.setAttribute('open', '');
        elements.pwInput.value = '';
        setTimeout(() => elements.pwInput.focus({ preventScroll: true }), 100);
        utils.postHeight();
      },
      
      close: () => {
        elements.pwModal.removeAttribute('open');
        elements.openPw.focus({ preventScroll: true });
        utils.postHeight();
      },
      
      apply: () => {
        const password = elements.pwInput.value.trim();
        if (!password) {
          elements.pwInput.focus({ preventScroll: true });
          return;
        }
        
        if (passwordManager.apply(password)) {
          modalManager.close();
        } else {
          elements.pwInput.select();
        }
      }
    };

    // ========== INIZIALIZZAZIONE ==========
    const app = {
      async init() {
        try {
          elements.content.innerHTML = '<div class="loading">Caricamento enigmi...</div>';
          
          await dataManager.load();
          
          if (ENIGMI.length === 0) {
            ui.showError("Nessun enigma disponibile");
            return;
          }
          
          ui.updateCurrentRank();
          
          const nextLevel = progressManager.getNextAvailable();
          
          if (nextLevel < 1) {
            const firstEnigma = ENIGMI[0];
            if (firstEnigma && !utils.isDateUnlocked(firstEnigma.unlockDate)) {
              const unlockDate = utils.parseDate(firstEnigma.unlockDate);
              const dateStr = unlockDate?.toLocaleDateString('it-IT', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              }) || firstEnigma.unlockDate;
              
              elements.content.innerHTML = \`
                <div class="special-message warning">
                  <div style="font-size: 3rem; margin-bottom: 1rem;">⏰</div>
                  <h3>Enigmi in arrivo!</h3>
                  <p>Il primo enigma sarà disponibile <strong>\${dateStr}</strong>.<br>
                     Torna più tardi per iniziare!</p>
                </div>
              \`;
            } else {
              ui.showError("Nessun enigma disponibile");
            }
            
            ui.hideControls();
            return;
          }
          
          navigation.goToLevel(nextLevel);
          
        } catch (error) {
          console.error("Errore inizializzazione:", error);
          ui.showError("Errore di caricamento. Riprova più tardi.");
        }
      },
      
      bindEvents() {
        // Eventi principali
        elements.checkBtn.addEventListener('click', answerManager.check);
        elements.hintBtn.addEventListener('click', ui.showHint);
        
        // Eventi modal
        elements.openPw.addEventListener('click', modalManager.open);
        elements.pwClose.addEventListener('click', modalManager.close);
        elements.pwApply.addEventListener('click', modalManager.apply);
        
        // Click esterno modal
        elements.pwModal.addEventListener('click', (e) => {
          if (e.target === elements.pwModal) modalManager.close();
        });
        
        // Eventi tastiera
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && elements.pwModal.hasAttribute('open')) {
            e.preventDefault();
            modalManager.close();
          }
        });
        
        elements.input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            answerManager.check();
          }
        });
        
        elements.pwInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            modalManager.apply();
          }
        });
        
        // Observer per altezza
        new ResizeObserver(utils.postHeight).observe(document.documentElement);
        window.addEventListener('load', utils.postHeight);
      }
    };

    // ========== AVVIO APPLICAZIONE ==========
    app.bindEvents();
    app.init();
  </script>`;
  });
})();

// 4) Logica applicativa (copiata da <script type="module"> di enigmi.html)

    // ========== CONFIGURAZIONE ==========
    const VERSION = "2025-01-27-v3";
    const JSON_URL = `/enigmi/enigmi.json?v=${VERSION}`;
    
    // ========== SELETTORI DOM ==========
    const $ = (s, r = document) => r.querySelector(s);
    const elements = {
      content: $("#content"),
      feedback: $("#feedback"),
      answerBox: $("#answerBox"),
      progressInfo: $("#progressInfo"),
      levelNumber: $("#levelNumber"),
      levelTitle: $("#levelTitle"),
      enigmaRankBadge: $("#enigmaRankBadge"),
      enigmaRankIcon: $("#enigmaRankIcon"),
      enigmaRankName: $("#enigmaRankName"),
      currentRankDisplay: $("#currentRankDisplay"),
      currentRankIcon: $("#currentRankIcon"),
      currentRankName: $("#currentRankName"),
      solvedCount: $("#solvedCount"),
      totalCount: $("#totalCount"),
      input: $("#answer"),
      checkBtn: $("#check"),
      hintBtn: $("#hintBtn"),
      pwModal: $("#pw-modal"),
      openPw: $("#openPw"),
      pwInput: $("#pw-input"),
      pwApply: $("#pw-apply"),
      pwClose: $("#pw-close")
    };

    // ========== STATO GLOBALE ==========
    let ENIGMI = [];
    let currentId = null;
    let isLoading = false;

    // ========== UTILITÀ ==========
    const utils = {
      // Normalizzazione case-insensitive per input non testuali
      normalizeAnswer: (str) => {
        if (!str) return "";
        // Normalizzazione più robusta che gestisce tutti i caratteri speciali
        return str.toString()
          .trim()
          .toLowerCase() // Cambiato in lowercase per maggiore compatibilità
          .replace(/\s+/g, "") // Rimuove spazi
          .replace(/[àáâãäå]/g, "a")
          .replace(/[èéêë]/g, "e")
          .replace(/[ìíîï]/g, "i")
          .replace(/[òóôõö]/g, "o")
          .replace(/[ùúûü]/g, "u")
          .replace(/[ñ]/g, "n")
          .replace(/[ç]/g, "c")
          .replace(/[^a-z0-9]/g, ""); // Rimuove tutti i caratteri non alfanumerici
      },
      
      // Normalizzazione per password (case-insensitive)
      normalizePassword: (str) => {
        if (!str) return "";
        return str.toString().trim().toLowerCase();
      },
      
      // Parsing sicuro delle date
      parseDate: (dateStr) => {
        if (!dateStr) return null;
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        } catch {
          return null;
        }
      },
      
      // Controllo se una data è sbloccata
      isDateUnlocked: (dateStr) => {
        if (!dateStr) return true;
        const unlockDate = utils.parseDate(dateStr);
        return !unlockDate || new Date() >= unlockDate;
      },
      
      // Gestione localStorage sicura
      storage: {
        get: (key, defaultValue = 0) => {
          try {
            const value = localStorage.getItem(key);
            if (!value) return defaultValue;
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
          } catch {
            return defaultValue;
          }
        },
        
        set: (key, value) => {
          try {
            const validValue = Math.max(0, parseInt(value, 10) || 0);
            localStorage.setItem(key, String(validValue));
            return true;
          } catch {
            return false;
          }
        }
      },
      
      // Comunicazione con parent frame
      postHeight: (() => {
        let timeout;
        return () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            try {
              const height = Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight
              );
              parent?.postMessage?.({ 
                type: "ENIGMI_IFRAME_HEIGHT", 
                height 
              }, "*");
            } catch (e) {
              console.warn("Errore comunicazione parent:", e);
            }
          }, 100);
        };
      })()
    };

    // ========== GESTIONE DATI ==========
    const dataManager = {
      async load() {
        if (isLoading) return;
        
        try {
          isLoading = true;
          
          const response = await fetch(JSON_URL, { 
            cache: "no-store",
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Dati non validi o vuoti");
          }
          
          ENIGMI = data
            .filter(e => e?.id && e?.answer && e?.rank && e?.rankIcon)
            .map(e => ({
              ...e,
              id: parseInt(e.id, 10),
              answer: utils.normalizeAnswer(e.answer), // Ora normalizzato in lowercase
              title: e.title || `Enigma ${e.id}`,
              rank: e.rank || "Sconosciuto",
              rankIcon: e.rankIcon || "❓",
              password: e.password || `Cani${e.id}ex`,
              hint: e.hint || null,
              unlockDate: e.unlockDate || null
            }))
            .sort((a, b) => a.id - b.id);
          
          if (ENIGMI.length === 0) {
            throw new Error("Nessun enigma valido trovato");
          }
          
        } catch (error) {
          console.error("Errore caricamento:", error);
          throw error;
        } finally {
          isLoading = false;
        }
      }
    };

    // ========== GESTIONE PROGRESSO ==========
    const progressManager = {
      getLastSolved: () => utils.storage.get("riddle_lastSolvedId"),
      
      setLastSolved: (id) => utils.storage.set("riddle_lastSolvedId", id),
      
      isLevelUnlocked: (levelId) => {
        if (!levelId || levelId < 1) return false;
        
        const enigma = ENIGMI.find(x => x.id === levelId);
        if (!enigma) return false;
        
        const lastSolved = progressManager.getLastSolved();
        
        // Controllo propedeuticità
        if (levelId > lastSolved + 1) return false;
        
        // Controllo data
        return utils.isDateUnlocked(enigma.unlockDate);
      },
      
      getNextAvailable: () => {
        const lastSolved = progressManager.getLastSolved();
        const nextLevel = lastSolved + 1;
        
        return progressManager.isLevelUnlocked(nextLevel) ? nextLevel : 
               lastSolved > 0 ? lastSolved : 1;
      }
    };

    // ========== GESTIONE PASSWORD ==========
    const passwordManager = {
      parse: (pw) => {
        if (!pw || typeof pw !== 'string') return null;
        
        const normalized = utils.normalizePassword(pw);
        const match = /^cani(\d+)ex$/.exec(normalized);
        
        if (!match) return null;
        
        const level = parseInt(match[1], 10);
        return (isNaN(level) || level < 1) ? null : level;
      },
      
      apply: (password) => {
        const targetLevel = passwordManager.parse(password);
        if (!targetLevel) {
          ui.showError("Password non valida. Formato: Cani[numero]ex");
          return false;
        }
        
        const targetEnigma = ENIGMI.find(x => x.id === targetLevel);
        if (!targetEnigma) {
          ui.showError(`Livello ${targetLevel} non trovato`);
          return false;
        }
        
        const levelsToUnlock = targetLevel - 1;
        if (levelsToUnlock > 0) {
          progressManager.setLastSolved(levelsToUnlock);
          ui.updateCurrentRank();
        }
        
        const nextAvailable = progressManager.getNextAvailable();
        navigation.goToLevel(nextAvailable);
        
        setTimeout(() => {
          ui.showFeedback("ok", 
            `🗝️ Password applicata! Livelli 1-${levelsToUnlock} sbloccati.`
          );
        }, 500);
        
        return true;
      }
    };

    // ========== NAVIGAZIONE ==========
    const navigation = {
      goToLevel: (id) => {
        if (!id || id < 1) {
          ui.showError("ID livello non valido");
          return;
        }
        
        const enigma = ENIGMI.find(x => x.id === id);
        if (!enigma) {
          ui.showError(`Enigma ${id} non trovato`);
          return;
        }
        
        if (!progressManager.isLevelUnlocked(id)) {
          ui.showLocked(id, enigma);
          return;
        }
        
        currentId = id;
        ui.renderEnigma(enigma);
      }
    };

    // ========== INTERFACCIA UTENTE ==========
    const ui = {
      showError: (message) => {
        elements.content.innerHTML = `
          <div class="special-message error">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <h3>Errore</h3>
            <p>${message}</p>
          </div>
        `;
        ui.hideControls();
      },
      
      showLocked: (id, enigma) => {
        const lastSolved = progressManager.getLastSolved();
        let message, details;
        
        if (id > lastSolved + 1) {
          message = "🔒 Livello non ancora sbloccato";
          details = `Devi completare prima il livello ${lastSolved + 1}.`;
        } else {
          const unlockDate = utils.parseDate(enigma.unlockDate);
          const dateStr = unlockDate?.toLocaleDateString('it-IT', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          }) || enigma.unlockDate;
          message = "⏰ Enigma non ancora disponibile";
          details = `Sarà sbloccato il ${dateStr}.`;
        }
        
        elements.content.innerHTML = `
          <div class="special-message locked">
            <div style="font-size: 3rem; margin-bottom: 1rem;">
              ${id > lastSolved + 1 ? '🔒' : '⏰'}
            </div>
            <h3>${message}</h3>
            <p>${details}</p>
          </div>
        `;
        ui.hideControls();
      },
      
      renderEnigma: (enigma) => {
        ui.updateProgress(enigma);
        
        let html = "";
        
        try {
          if (enigma.type === "image" && enigma.image) {
            html = `
              <figure>
                <img src="${enigma.image}" alt="${enigma.alt || enigma.title}" 
                     loading="lazy" onerror="this.style.display='none';">
                ${enigma.question ? `<figcaption>${enigma.question}</figcaption>` : ''}
              </figure>
            `;
          } else if (enigma.type === "mixed") {
            if (enigma.html) html += enigma.html;
            if (enigma.image) {
              html += `
                <figure>
                  <img src="${enigma.image}" alt="${enigma.alt || enigma.title}" 
                       loading="lazy" onerror="this.style.display='none';">
                </figure>
              `;
            }
            if (enigma.question) {
              html += `
                <div style="margin-top: 1.5rem;">
                  <h3>❓ Domanda:</h3>
                  <p><strong>${enigma.question}</strong></p>
                </div>
              `;
            }
          } else {
            html = `
              <div class="text-enigma">
                <h3>🤔 ${enigma.title}</h3>
                <p><strong>${enigma.question || 'Risolvi questo enigma:'}</strong></p>
              </div>
            `;
          }
          
          // Aggiungi sempre la password del livello corrente
          html += `
            <div class="current-password-box" style="background: rgba(13, 13, 13, 0.8); border: 2px solid var(--muted-brass); border-radius: 10px; padding: 1rem; margin-top: 1.5rem; text-align: center;">
              <div style="color: var(--dark-parchment); font-size: 0.875rem; margin-bottom: 0.5rem;">🗝️ Password di questo livello:</div>
              <code style="background: var(--bg-tertiary); color: var(--brass); padding: 0.5rem 0.75rem; border-radius: 5px; font-family: var(--font-mono); font-size: 1.05rem; font-weight: 500; border: 1px solid var(--border); display: inline-block;">${enigma.password}</code>
            </div>
          `;
          
          elements.content.innerHTML = html;
        } catch (e) {
          console.error("Errore rendering:", e);
          elements.content.innerHTML = `
            <p><strong>${enigma.question || 'Risolvi questo enigma:'}</strong></p>
          `;
        }
        
        ui.showControls(enigma);
        ui.resetInput();
        utils.postHeight();
      },
      
      updateProgress: (enigma) => {
        const solved = progressManager.getLastSolved();
        const total = ENIGMI.length;
        
        elements.levelNumber.textContent = enigma.id;
        elements.levelTitle.textContent = enigma.title;
        elements.enigmaRankIcon.textContent = enigma.rankIcon;
        elements.enigmaRankName.textContent = enigma.rank;
        elements.solvedCount.textContent = solved;
        elements.totalCount.textContent = total;
        
        // Animazione badge
        elements.enigmaRankBadge.style.transform = 'scale(1.05)';
        setTimeout(() => {
          elements.enigmaRankBadge.style.transform = 'scale(1)';
        }, 200);
      },
      
      updateCurrentRank: () => {
        const lastSolved = progressManager.getLastSolved();
        
        if (lastSolved > 0) {
          const lastEnigma = ENIGMI.find(x => x.id === lastSolved);
          if (lastEnigma) {
            elements.currentRankIcon.textContent = lastEnigma.rankIcon;
            elements.currentRankName.textContent = lastEnigma.rank;
            elements.currentRankDisplay.style.display = "inline-flex";
            return;
          }
        }
        
        elements.currentRankDisplay.style.display = "none";
      },
      
      showControls: (enigma) => {
        elements.answerBox.style.display = "flex";
        elements.progressInfo.style.display = "flex";
        elements.hintBtn.style.display = enigma.hint ? "inline-block" : "none";
      },
      
      hideControls: () => {
        elements.answerBox.style.display = "none";
        elements.progressInfo.style.display = "none";
        ui.clearFeedback();
      },
      
      resetInput: () => {
        elements.input.value = "";
        ui.clearFeedback();
        setTimeout(() => elements.input.focus({ preventScroll: true }), 150);
      },
      
      showFeedback: (type, message) => {
        elements.feedback.className = `status ${type}`;
        elements.feedback.innerHTML = message;
        utils.postHeight();
      },
      
      clearFeedback: () => {
        elements.feedback.textContent = "";
        elements.feedback.className = "status";
      },
      
      showHint: () => {
        const enigma = ENIGMI.find(x => x.id === currentId);
        if (!enigma?.hint) return;
        
        const existing = document.querySelector('.hint-message');
        if (existing) existing.remove();
        
        const hintDiv = document.createElement('div');
        hintDiv.className = 'status hint-message';
        hintDiv.innerHTML = `💡 <strong>Suggerimento:</strong> ${enigma.hint}`;
        
        elements.feedback.parentNode.insertBefore(hintDiv, elements.feedback);
        utils.postHeight();
      }
    };

    // ========== GESTIONE RISPOSTE ==========
    const answerManager = {
      check: () => {
        if (!currentId) {
          ui.showFeedback("err", "Nessun enigma attivo");
          return;
        }
        
        const enigma = ENIGMI.find(x => x.id === currentId);
        if (!enigma) {
          ui.showFeedback("err", "Enigma non trovato");
          return;
        }
        
        const userAnswer = utils.normalizeAnswer(elements.input.value);
        if (!userAnswer) {
          ui.showFeedback("err", "Inserisci una risposta");
          elements.input.focus({ preventScroll: true });
          return;
        }
        
        const isCorrect = userAnswer === enigma.answer;
        
        if (isCorrect) {
          answerManager.handleCorrect(enigma);
        } else {
          ui.showFeedback("err", "Risposta non corretta. Riprova!");
          elements.input.select();
        }
      },
      
      handleCorrect: (enigma) => {
        progressManager.setLastSolved(enigma.id);
        ui.updateCurrentRank();
        elements.solvedCount.textContent = enigma.id;
        
        let congratsHtml = `
          <div class="congrats-header">
            <span class="congrats-icon">${enigma.rankIcon}</span>
            <div>
              <div class="congrats-title">🎉 Congratulazioni!</div>
              <div class="congrats-rank">Ora il tuo grado è: ${enigma.rank}</div>
            </div>
          </div>
          <div class="password-box">
            <div class="password-label">🗝️ Password per questo livello:</div>
            <code class="password-code">${enigma.password}</code>
          </div>
        `;
        
        const nextEnigma = ENIGMI.find(x => x.id === enigma.id + 1);
        if (nextEnigma) {
          if (progressManager.isLevelUnlocked(nextEnigma.id)) {
            congratsHtml += `
              <div class="next-level-info">
                🚀 Passaggio al prossimo livello tra poco...
              </div>
            `;
            
            ui.showFeedback("ok", congratsHtml);
            
            setTimeout(() => {
              navigation.goToLevel(nextEnigma.id);
            }, 3000);
          } else {
            const unlockDate = utils.parseDate(nextEnigma.unlockDate);
            const dateStr = unlockDate?.toLocaleDateString('it-IT', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }) || nextEnigma.unlockDate;
            
            congratsHtml += `
              <div class="next-enigma-locked">
                <div class="next-enigma-header">
                  <span>⏰</span>
                  <div class="next-enigma-title">Prossimo Enigma</div>
                </div>
                <div class="next-enigma-details">
                  <span>${nextEnigma.rankIcon}</span>
                  <strong>${nextEnigma.title}</strong>
                  <span>•</span>
                  <span class="next-enigma-rank">${nextEnigma.rank}</span>
                  <span>(Livello ${nextEnigma.id})</span>
                </div>
                <div class="next-enigma-date">
                  Sarà disponibile <strong>${dateStr}</strong>.<br>
                  Torna più tardi per continuare!
                </div>
              </div>
            `;
            
            ui.showFeedback("ok", congratsHtml);
          }
        } else {
          congratsHtml += `
            <div class="mission-complete">
              <div class="mission-icon">🏆</div>
              <div class="mission-title">Missione Completata!</div>
              <div class="mission-subtitle">Hai risolto tutti gli enigmi!</div>
            </div>
          `;
          
          ui.showFeedback("ok", congratsHtml);
        }
      }
    };

    // ========== GESTIONE MODAL ==========
    const modalManager = {
      open: () => {
        elements.pwModal.setAttribute('open', '');
        elements.pwInput.value = '';
        setTimeout(() => elements.pwInput.focus({ preventScroll: true }), 100);
        utils.postHeight();
      },
      
      close: () => {
        elements.pwModal.removeAttribute('open');
        elements.openPw.focus({ preventScroll: true });
        utils.postHeight();
      },
      
      apply: () => {
        const password = elements.pwInput.value.trim();
        if (!password) {
          elements.pwInput.focus({ preventScroll: true });
          return;
        }
        
        if (passwordManager.apply(password)) {
          modalManager.close();
        } else {
          elements.pwInput.select();
        }
      }
    };

    // ========== INIZIALIZZAZIONE ==========
    const app = {
      async init() {
        try {
          elements.content.innerHTML = '<div class="loading">Caricamento enigmi...</div>';
          
          await dataManager.load();
          
          if (ENIGMI.length === 0) {
            ui.showError("Nessun enigma disponibile");
            return;
          }
          
          ui.updateCurrentRank();
          
          const nextLevel = progressManager.getNextAvailable();
          
          if (nextLevel < 1) {
            const firstEnigma = ENIGMI[0];
            if (firstEnigma && !utils.isDateUnlocked(firstEnigma.unlockDate)) {
              const unlockDate = utils.parseDate(firstEnigma.unlockDate);
              const dateStr = unlockDate?.toLocaleDateString('it-IT', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              }) || firstEnigma.unlockDate;
              
              elements.content.innerHTML = `
                <div class="special-message warning">
                  <div style="font-size: 3rem; margin-bottom: 1rem;">⏰</div>
                  <h3>Enigmi in arrivo!</h3>
                  <p>Il primo enigma sarà disponibile <strong>${dateStr}</strong>.<br>
                     Torna più tardi per iniziare!</p>
                </div>
              `;
            } else {
              ui.showError("Nessun enigma disponibile");
            }
            
            ui.hideControls();
            return;
          }
          
          navigation.goToLevel(nextLevel);
          
        } catch (error) {
          console.error("Errore inizializzazione:", error);
          ui.showError("Errore di caricamento. Riprova più tardi.");
        }
      },
      
      bindEvents() {
        // Eventi principali
        elements.checkBtn.addEventListener('click', answerManager.check);
        elements.hintBtn.addEventListener('click', ui.showHint);
        
        // Eventi modal
        elements.openPw.addEventListener('click', modalManager.open);
        elements.pwClose.addEventListener('click', modalManager.close);
        elements.pwApply.addEventListener('click', modalManager.apply);
        
        // Click esterno modal
        elements.pwModal.addEventListener('click', (e) => {
          if (e.target === elements.pwModal) modalManager.close();
        });
        
        // Eventi tastiera
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && elements.pwModal.hasAttribute('open')) {
            e.preventDefault();
            modalManager.close();
          }
        });
        
        elements.input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            answerManager.check();
          }
        });
        
        elements.pwInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            modalManager.apply();
          }
        });
        
        // Observer per altezza
        new ResizeObserver(utils.postHeight).observe(document.documentElement);
        window.addEventListener('load', utils.postHeight);
      }
    };

    // ========== AVVIO APPLICAZIONE ==========
    app.bindEvents();
    app.init();
  
