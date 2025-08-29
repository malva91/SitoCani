// Tools functionality for Cani di Odino website
// Version: 2025.02.01 - Complete JSON-driven system

/**
 * Data manager for loading JSON data
 */
class DataManager {
    constructor() {
        this.gameData = {
            names: {},
            adventures: {},
            treasures: {},
            weapons: {},
            cities: {},
            events: {},
            bestemmie: {}
        };
    }

    async loadGameData() {
        const paths = {
            names: "data/names.json",
            adventures: "data/adventures.json",
            treasures: "data/treasures.json",
            weapons: "data/weapons.json",
            cities: "data/cities.json",
            events: "data/events.json",
            bestemmie: "data/bestemmie.json"
        };

        try {
            const loadPromises = Object.entries(paths).map(async ([key, path]) => {
                const response = await fetch(path, { cache: "no-store" });
                if (!response.ok) {
                    throw new Error(`Impossibile caricare ${path}: ${response.status}`);
                }
                this.gameData[key] = await response.json();
            });

            await Promise.all(loadPromises);
            console.log("Game data loaded from JSON files:", Object.keys(this.gameData));
            return true;
        } catch (error) {
            console.error("Error loading game data:", error);
            throw error;
        }
    }

    showError(message) {
        console.error(message);
    }
}

/**
 * Utility function to populate select elements
 */
function clearAndFillSelect(select, values) {
    if (!select) return;
    
    // Clear existing options
    while (select.firstChild) {
        select.removeChild(select.firstChild);
    }
    
    // Add new options
    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        select.appendChild(option);
    });
}

/**
 * Dice roller functionality
 */
class DiceRoller {
    constructor() {
        this.history = [];
        this.loadHistory();
    }

    init() {
        const rollButton = document.getElementById('roll-dice');
        rollButton?.addEventListener('click', () => this.rollDice());
    }

    rollDice() {
        const count = parseInt(document.getElementById('dice-count')?.value) || 1;
        const type = parseInt(document.getElementById('dice-type')?.value) || 20;
        const modifier = parseInt(document.getElementById('dice-modifier')?.value) || 0;
        
        const result = this.calculateRoll(count, type, modifier);
        this.displayResult(result);
        this.addToHistory(result);
        this.updateHistory();
    }

    calculateRoll(count, sides, modifier) {
        const rolls = [];
        let total = 0;
        
        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            total += roll;
        }
        
        const finalTotal = total + modifier;
        const isCritical = count === 1 && rolls[0] === sides;
        const isFumble = count === 1 && rolls[0] === 1;
        
        return {
            rolls,
            total,
            modifier,
            finalTotal,
            count,
            sides,
            isCritical,
            isFumble,
            timestamp: new Date()
        };
    }

    displayResult(result) {
        const container = document.getElementById('dice-result');
        if (!container) return;

        const { rolls, total, modifier, finalTotal, count, sides, isCritical, isFumble } = result;
        
        let html = '<div class="result-content">';
        html += '<div class="dice-rolls">';
        
        rolls.forEach(roll => {
            let diceClass = 'dice-roll';
            if (count === 1 && roll === sides) diceClass += ' critical';
            if (count === 1 && roll === 1) diceClass += ' fumble';
            html += `<div class="${diceClass}">${roll}</div>`;
        });
        
        html += '</div>';
        html += `<div class="dice-total">${finalTotal}</div>`;
        
        if (modifier !== 0) {
            html += `<div class="dice-breakdown">${total} ${modifier >= 0 ? '+' : ''}${modifier} = ${finalTotal}</div>`;
        }
        
        if (isCritical) {
            html += '<div style="color:#4CAF50;font-weight:bold;margin-top:1rem;">🎉 CRITICO!</div>';
        } else if (isFumble) {
            html += '<div style="color:#f44336;font-weight:bold;margin-top:1rem;">💀 FALLIMENTO CRITICO!</div>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    }

    addToHistory(result) {
        this.history.unshift(result);
        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }
        this.saveHistory();
    }

    updateHistory() {
        const historyContainer = document.getElementById('dice-history');
        if (!historyContainer) return;

        if (this.history.length === 0) {
            historyContainer.innerHTML = '';
            return;
        }

        let html = '<h3>Cronologia Lanci</h3>';
        this.history.forEach(result => {
            const { count, sides, finalTotal, timestamp } = result;
            const timeStr = new Date(timestamp).toLocaleTimeString();
            html += `
                <div class="history-item">
                    <span class="history-roll">${count}d${sides}: </span>
                    <span class="history-result">${finalTotal}</span>
                    <span class="history-time">${timeStr}</span>
                </div>
            `;
        });
        
        historyContainer.innerHTML = html;
    }

    saveHistory() {
        try {
            localStorage.setItem('diceHistory', JSON.stringify(this.history));
        } catch (e) {
            console.error('Error saving dice history:', e);
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('diceHistory');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading dice history:', e);
            this.history = [];
        }
    }
}

/**
 * Name generator functionality
 */
class NameGenerator {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    init() {
        const generateButton = document.getElementById('generate-name');
        const categorySelect = document.getElementById('name-category');
        
        generateButton?.addEventListener('click', () => this.generateName());
        categorySelect?.addEventListener('change', () => this.updateSubcategories());
        
        // Initialize subcategories
        this.updateSubcategories();
    }

    updateSubcategories() {
        const names = this.dataManager.gameData.names || {};
        const category = document.getElementById('name-category')?.value;
        const subcategorySelect = document.getElementById('name-subcategory');
        const genderSelect = document.getElementById('name-gender');
        const subcategoryGroup = document.getElementById('name-subcategory-group');
        const genderGroup = document.getElementById('name-gender-group');

        if (!subcategorySelect || !genderSelect) return;

        // Clear existing options
        subcategorySelect.innerHTML = '';
        genderSelect.innerHTML = '';

        if (category === 'character') {
            subcategoryGroup.style.display = 'flex';
            genderGroup.style.display = 'flex';
            
            const styles = names.character ? Object.keys(names.character) : [];
            clearAndFillSelect(subcategorySelect, styles);
            clearAndFillSelect(genderSelect, ['male', 'female', 'surnames']);
        } else {
            subcategoryGroup.style.display = 'flex';
            genderGroup.style.display = 'none';
            
            const styles = names[category] ? Object.keys(names[category]) : [];
            clearAndFillSelect(subcategorySelect, styles);
        }
    }

    generateName() {
        const names = this.dataManager.gameData.names || {};
        const category = document.getElementById('name-category')?.value;
        const subcategory = document.getElementById('name-subcategory')?.value;
        const gender = document.getElementById('name-gender')?.value;
        const resultContainer = document.getElementById('name-result');

        let nameList = [];

        if (category === 'character' && names.character?.[subcategory]) {
            nameList = names.character[subcategory][gender] || [];
        } else if (names[category]?.[subcategory]) {
            nameList = names[category][subcategory];
        }

        if (!nameList || nameList.length === 0) {
            return this.showError('Nessun nome disponibile per questa combinazione', resultContainer);
        }

        const randomName = nameList[Math.floor(Math.random() * nameList.length)];
        
        let html = '<div class="result-content">';
        html += `<div class="result-title">${randomName}</div>`;
        html += `<div class="result-description">Categoria: ${category} - ${subcategory}${category === 'character' ? ` (${gender})` : ''}</div>`;
        html += '</div>';
        
        resultContainer.innerHTML = html;
    }

    showError(message, container) {
        if (container) {
            container.innerHTML = `<div class="result-empty">⚠️ ${message}</div>`;
        }
    }
}

/**
 * Adventure generator functionality
 */
class AdventureGenerator {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    init() {
        const generateButton = document.getElementById('generate-adventure');
        generateButton?.addEventListener('click', () => this.generateAdventure());
    }

    generateAdventure() {
        const adventures = this.dataManager.gameData.adventures || {};
        const { hooks = {}, locations = {}, antagonisti = [], complicazioni = [] } = adventures;
        
        const theme = document.getElementById('adventure-theme')?.value;
        const location = document.getElementById('adventure-location')?.value;
        const resultContainer = document.getElementById('adventure-result');

        const hooksList = hooks[theme] || [];
        const locationsList = locations[location] || [];

        if (hooksList.length === 0 || locationsList.length === 0) {
            return this.showError('Dati insufficienti per generare un\'avventura', resultContainer);
        }

        const pick = arr => arr[Math.floor(Math.random() * arr.length)];

        const html = `
            <div class="result-content">
                <div class="result-title">Avventura Generata</div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Hook:</span>
                        <span>${pick(hooksList)}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Ambientazione:</span>
                        <span>${pick(locationsList)}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Antagonista:</span>
                        <span>${pick(antagonisti || [])}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Complicazione:</span>
                        <span>${pick(complicazioni || [])}</span>
                    </div>
                </div>
            </div>
        `;
        
        resultContainer.innerHTML = html;
    }

    showError(message, container) {
        if (container) {
            container.innerHTML = `<div class="result-empty">⚠️ ${message}</div>`;
        }
    }
}

/**
 * Treasure generator functionality
 */
class TreasureGenerator {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    init() {
        const generateButton = document.getElementById('generate-treasure');
        generateButton?.addEventListener('click', () => this.generateTreasure());
    }

    generateTreasure() {
        const setting = document.getElementById('treasure-setting')?.value;
        const resultContainer = document.getElementById('treasure-result');
        
        const treasureData = (this.dataManager.gameData.treasures || {})[setting];
        if (!treasureData) {
            return this.showError('Ambientazione non trovata', resultContainer);
        }

        const pick = arr => arr[Math.floor(Math.random() * arr.length)];
        
        const item = pick(treasureData.items || []);
        const origin = pick(treasureData.origins || []);
        const material = pick(treasureData.materials || []);

        const html = `
            <div class="result-content">
                <div class="result-title">Tesoro Generato</div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Oggetto:</span>
                        <span>${item}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Origine:</span>
                        <span>${origin}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Materiale:</span>
                        <span>${material}</span>
                    </div>
                </div>
            </div>
        `;
        
        resultContainer.innerHTML = html;
    }

    showError(message, container) {
        if (container) {
            container.innerHTML = `<div class="result-empty">⚠️ ${message}</div>`;
        }
    }
}

/**
 * Weapon generator functionality
 */
class WeaponGenerator {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    init() {
        const generateButton = document.getElementById('generate-weapon');
        generateButton?.addEventListener('click', () => this.generateWeapon());
    }

    generateWeapon() {
        const setting = document.getElementById('weapon-setting')?.value;
        const type = document.getElementById('weapon-type')?.value;
        const resultContainer = document.getElementById('weapon-result');
        
        const weaponCategory = (this.dataManager.gameData.weapons || {})[setting];
        if (!weaponCategory) {
            return this.showError('Ambientazione non trovata', resultContainer);
        }

        const weaponType = weaponCategory[type] || { weapons: [], characteristics: [] };
        const pick = arr => arr[Math.floor(Math.random() * arr.length)];
        
        const weapon = pick(weaponType.weapons || []);
        const characteristic = pick(weaponType.characteristics || []);

        const html = `
            <div class="result-content">
                <div class="result-title">Arma Generata</div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Arma:</span>
                        <span>${weapon}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Caratteristica:</span>
                        <span>${characteristic}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Tipo:</span>
                        <span>${type}</span>
                    </div>
                </div>
            </div>
        `;
        
        resultContainer.innerHTML = html;
    }

    showError(message, container) {
        if (container) {
            container.innerHTML = `<div class="result-empty">⚠️ ${message}</div>`;
        }
    }
}

/**
 * City generator functionality
 */
class CityGenerator {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    init() {
        const generateButton = document.getElementById('generate-city');
        generateButton?.addEventListener('click', () => this.generateCity());
    }

    generateCity() {
        const setting = document.getElementById('city-setting')?.value;
        const size = document.getElementById('city-size')?.value;
        const resultContainer = document.getElementById('city-result');
        
        const cityData = (this.dataManager.gameData.cities || {})[setting];
        if (!cityData) {
            return this.showError('Ambientazione non trovata', resultContainer);
        }

        const pick = arr => arr[Math.floor(Math.random() * arr.length)];
        
        const name = pick(cityData.nomi || []);
        const ruler = pick(cityData.rulers || []);
        const district = pick(cityData.districts || []);
        const landmark = pick(cityData.landmarks || []);
        
        // Get population range
        const ranges = (this.dataManager.gameData.cities || {}).population_ranges || {};
        const range = ranges[size] || { min: 1000, max: 5000, description: "" };
        const population = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

        const html = `
            <div class="result-content">
                <div class="result-title">${name}</div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Governante:</span>
                        <span>${ruler}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Quartiere:</span>
                        <span>${district}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Punto di Riferimento:</span>
                        <span>${landmark}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Popolazione:</span>
                        <span>${population.toLocaleString()} (${range.description || size})</span>
                    </div>
                </div>
            </div>
        `;
        
        resultContainer.innerHTML = html;
    }

    showError(message, container) {
        if (container) {
            container.innerHTML = `<div class="result-empty">⚠️ ${message}</div>`;
        }
    }
}

/**
 * Event generator functionality
 */
class EventGenerator {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    init() {
        const generateButton = document.getElementById('generate-event');
        generateButton?.addEventListener('click', () => this.generateEvent());
    }

    generateEvent() {
        const type = document.getElementById('event-type')?.value;
        const resultContainer = document.getElementById('event-result');
        
        const events = this.dataManager.gameData.events || {};
        const eventPool = events[type] || [];
        const conseguenze = events.conseguenze || [];
        const involvementLevels = events.involvement_levels || [];

        if (eventPool.length === 0) {
            return this.showError('Nessun evento per questa categoria', resultContainer);
        }

        const pick = arr => arr[Math.floor(Math.random() * arr.length)];

        const html = `
            <div class="result-content">
                <div class="result-title">Evento Generato</div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Evento:</span>
                        <span>${pick(eventPool)}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Conseguenze:</span>
                        <span>${pick(conseguenze || [])}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Coinvolgimento PG:</span>
                        <span>${pick(involvementLevels || [])}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Tipo:</span>
                        <span>${type}</span>
                    </div>
                </div>
            </div>
        `;
        
        resultContainer.innerHTML = html;
    }

    showError(message, container) {
        if (container) {
            container.innerHTML = `<div class="result-empty">⚠️ ${message}</div>`;
        }
    }
}

/**
 * Bestemmie generator functionality
 */
class BestemmieGenerator {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    init() {
        this.populateControls();
        const generateButton = document.getElementById('generate-bestemmie');
        generateButton?.addEventListener('click', () => this.generateBestemmie());
    }

    pick(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return '';
        return arr[Math.floor(Math.random() * arr.length)];
    }

    getDataSafe() {
        const raw = this.dataManager?.gameData?.bestemmie || {};
        const divinita = raw.divinita || raw['divinità'] || {};
        const stili = raw.stili || {};
        const intensita = raw.intensita || raw['intensità'] || {};
        const template = Array.isArray(raw.template) ? raw.template : null;
        return { divinita, stili, intensita, template };
    }

    populateControls() {
        const { divinita, stili, intensita } = this.getDataSafe();
        this.fillSelectFromKeys('bestemmie-divinita', divinita, '— scegli un pantheon —');
        this.fillSelectFromKeys('bestemmie-stile', stili, '— scegli uno stile —');
        this.fillSelectFromKeys('bestemmie-intensita', intensita, '— scegli intensità —') ||
        this.fillSelectFromKeys('bestemmie-creatura', intensita, '— scegli intensità —');
    }

    fillSelectFromKeys(selectId, obj, placeholder = '— seleziona —') {
        const sel = document.getElementById(selectId);
        if (!sel || !obj || typeof obj !== 'object') return false;

        const keys = Object.keys(obj);
        if (keys.length === 0) return false;

        sel.innerHTML = '';
        const ph = document.createElement('option');
        ph.value = '';
        ph.disabled = true;
        ph.selected = true;
        ph.textContent = placeholder;
        sel.appendChild(ph);

        keys.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = k; // 🔹 tolto il conteggio
            sel.appendChild(opt);
        });

        return true;
    }

    generateBestemmie() {
        const resultContainer = document.getElementById('bestemmie-result');
        const divinitaKey = document.getElementById('bestemmie-divinita')?.value;
        const stileKey = document.getElementById('bestemmie-stile')?.value;
        const intensitaKey =
            document.getElementById('bestemmie-intensita')?.value ??
            document.getElementById('bestemmie-creatura')?.value;

        if (!divinitaKey || !stileKey || !intensitaKey) {
            return this.showError('Seleziona tutte le opzioni (divinità, stile, intensità).', resultContainer);
        }

        const { divinita, stili, intensita, template } = this.getDataSafe();
        const divinitaList = divinita[divinitaKey] || [];
        const stileList = stili[stileKey] || [];
        const intensitaList = intensita[intensitaKey] || [];

        if (divinitaList.length === 0 || stileList.length === 0 || intensitaList.length === 0) {
            return this.showError('Dati insufficienti (una o più liste vuote). Controlla il JSON.', resultContainer);
        }

        const selectedDivinita = this.pick(divinitaList);
        const selectedStile = this.pick(stileList);
        const selectedIntensita = this.pick(intensitaList);

        const templates = template && template.length
            ? template
            : [
                'Per {divinita} {stile}, {intensita}!',
                '{divinita} {stile}, {intensita}!',
                'Giuro su {divinita} {stile}, {intensita}!'
            ];

        const chosen = this.pick(templates);
        const frase = chosen
            .replace(/{divinita}/g, selectedDivinita)
            .replace(/{stile}/g, selectedStile)
            .replace(/{intensita}/g, selectedIntensita)
            .replace(/\s{2,}/g, ' ')
            .trim();

        const html = `
            <div class="result-content">
                <div class="result-title">Frase Generata</div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Testo:</span>
                        <span><strong>"${frase}"</strong></span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Divinità:</span>
                        <span>${divinitaKey} (${selectedDivinita})</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Stile:</span>
                        <span>${stileKey} (${selectedStile})</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Intensità:</span>
                        <span>${intensitaKey} (${selectedIntensita})</span>
                    </div>
                </div>
            </div>
        `;
        if (resultContainer) resultContainer.innerHTML = html;
    }

    showError(message, container) {
        if (container) {
            container.innerHTML = `<div class="result-empty">⚠️ ${message}</div>`;
        }
    }
}



/**
 * Main tools application
 */
class ToolsApp {
    constructor() {
        this.dataManager = new DataManager();
        this.diceRoller = new DiceRoller();
        this.nameGenerator = new NameGenerator(this.dataManager);
        this.adventureGenerator = new AdventureGenerator(this.dataManager);
        this.treasureGenerator = new TreasureGenerator(this.dataManager);
        this.weaponGenerator = new WeaponGenerator(this.dataManager);
        this.cityGenerator = new CityGenerator(this.dataManager);
        this.eventGenerator = new EventGenerator(this.dataManager);
        this.bestemmieGenerator = new BestemmieGenerator(this.dataManager);
    }

    async init() {
        try {
            // Load all game data from JSON files
            await this.dataManager.loadGameData();
            
            // Populate selects with dynamic data
            this.populateSelectsFromData();
            
            // Initialize all tools
            this.initToolNavigation();
            this.diceRoller.init();
            this.nameGenerator.init();
            this.adventureGenerator.init();
            this.treasureGenerator.init();
            this.weaponGenerator.init();
            this.cityGenerator.init();
            this.eventGenerator.init();
            this.bestemmieGenerator.init();
            
            // Update dice history
            this.diceRoller.updateHistory();
            
            console.log('Tools initialized with dynamic JSON data');
        } catch (error) {
            console.error('Error initializing tools:', error);
        }
    }

    populateSelectsFromData() {
        const gameData = this.dataManager.gameData;

        // Populate treasure settings
        clearAndFillSelect(
            document.getElementById('treasure-setting'), 
            Object.keys(gameData.treasures || {})
        );

        // Populate weapon settings
        clearAndFillSelect(
            document.getElementById('weapon-setting'), 
            Object.keys(gameData.weapons || {})
        );

        // Populate city settings (exclude utility keys)
        const cityKeys = Object.keys(gameData.cities || {}).filter(key => 
            !['population_ranges', 'problems', 'economy', 'culture', 'government'].includes(key)
        );
        clearAndFillSelect(document.getElementById('city-setting'), cityKeys);

        // Populate adventure themes and locations
        const adventures = gameData.adventures || {};
        clearAndFillSelect(
            document.getElementById('adventure-theme'), 
            Object.keys(adventures.hooks || {})
        );
        clearAndFillSelect(
            document.getElementById('adventure-location'), 
            Object.keys(adventures.locations || {})
        );

        // Populate event types (exclude utility keys)
        const events = gameData.events || {};
        const eventTypes = Object.keys(events).filter(key => 
            !['conseguenze', 'involvement_levels'].includes(key)
        );
        clearAndFillSelect(document.getElementById('event-type'), eventTypes);

        // Populate bestemmie categories
        const bestemmie = gameData.bestemmie || {};
        clearAndFillSelect(
            document.getElementById('bestemmie-divinita'), 
            Object.keys(bestemmie.divinita || {})
        );
        clearAndFillSelect(
            document.getElementById('bestemmie-stile'), 
            Object.keys(bestemmie.stili || {})
        );
        clearAndFillSelect(
            document.getElementById('bestemmie-creatura'), 
            Object.keys(bestemmie.creature || {})
        );

        // Name categories are handled by NameGenerator.updateSubcategories()
        clearAndFillSelect(
            document.getElementById('name-category'), 
            Object.keys(gameData.names || {})
        );
    }

    initToolNavigation() {
        const toolButtons = document.querySelectorAll('.tool-nav-button');
        const toolPanels = document.querySelectorAll('.tool-panel');

        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTool = button.getAttribute('data-tool');
                
                // Remove active class from all buttons and panels
                toolButtons.forEach(btn => btn.classList.remove('active'));
                toolPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked button and corresponding panel
                button.classList.add('active');
                const targetPanel = document.getElementById(targetTool);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ToolsApp();
    app.init();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ToolsApp,
        DataManager,
        DiceRoller,
        NameGenerator,
        AdventureGenerator,
        TreasureGenerator,
        WeaponGenerator,
        CityGenerator,
        EventGenerator,
        BestemmieGenerator
    };
}