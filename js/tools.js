// Tools functionality for Cani di Odino website
// Version: 2025.02.01 - Optimized and coherent generators (Bestemmie selectors patched)

/**
 * Data manager for loading modular JSON data
 */
class DataManager {
    constructor() {
        this.gameData = {
            nanico: {},
            elfico: {},
            steampunk: {},
            cyberpunk: {},
            vichingo: {},
            lovecraftiano: {},
            orientale: {},
            romano: {},
            medievale: {},
            fantasy: {}
        };
    }

    async loadGameData() {
        const paths = {
            nanico: "data/nanico.json",
            elfico: "data/elfico.json",
            steampunk: "data/steampunk.json",
            cyberpunk: "data/cyberpunk.json",
            vichingo: "data/vichingo.json",
            lovecraftiano: "data/lovecraftiano.json",
            orientale: "data/orientale.json",
            romano: "data/romano.json",
            medievale: "data/medievale.json",
            fantasy: "data/fantasy.json"
        };

        try {
            const loadPromises = Object.entries(paths).map(async ([key, path]) => {
                const response = await fetch(path, { cache: "no-store" });
                if (!response.ok) {
                    console.warn(`Impossibile caricare ${path}: ${response.status}`);
                    this.gameData[key] = {};
                    return;
                }
                this.gameData[key] = await response.json();
            });

            await Promise.all(loadPromises);
            this.createUnifiedStructures();
            return true;
        } catch (error) {
            console.error("Error loading game data:", error);
            // Non bloccare tutta l'app: procedi con ciò che è stato caricato
            this.createUnifiedStructures();
            return false;
        }
    }

    createUnifiedStructures() {
        const settings = this.getAvailableSettings();
        
        // Create unified adventures structure
        this.gameData.adventures = {
            hooks: {},
            locations: {},
            antagonisti: [],
            complicazioni: []
        };

        settings.forEach(setting => {
            const settingData = this.gameData[setting];
            
            if (settingData?.adventures?.hooks) {
                this.gameData.adventures.hooks[setting] = settingData.adventures.hooks;
            }
            if (settingData?.adventures?.locations) {
                this.gameData.adventures.locations[setting] = settingData.adventures.locations;
            }
        });

        // Get shared data from first available setting
        const firstSettingWithData = settings.find(setting => {
            const data = this.gameData[setting];
            return data?.antagonisti || data?.complicazioni;
        });

        if (firstSettingWithData) {
            const data = this.gameData[firstSettingWithData];
            this.gameData.adventures.antagonisti = data.antagonisti || [];
            this.gameData.adventures.complicazioni = data.complicazioni || [];
        }

        // Create unified events structure
        this.gameData.events = {
            conseguenze: [],
            involvement_levels: []
        };

        settings.forEach(setting => {
            const settingData = this.gameData[setting];
            if (settingData?.events) {
                this.gameData.events[setting] = settingData.events;
            }
        });

        // Get shared event data
        const firstEventSetting = settings.find(setting => {
            const data = this.gameData[setting];
            return data?.conseguenze || data?.involvement_levels;
        });

        if (firstEventSetting) {
            const data = this.gameData[firstEventSetting];
            this.gameData.events.conseguenze = data.conseguenze || [];
            this.gameData.events.involvement_levels = data.involvement_levels || [];
        }

        // Unified structures created
    }

    getAvailableSettings() {
        return ['nanico', 'elfico', 'steampunk', 'cyberpunk', 'vichingo', 'lovecraftiano', 'orientale', 'romano', 'medievale', 'fantasy'];
    }

    getSettingData(setting) {
        return this.gameData[setting] || {};
    }

    getUnifiedData(type) {
        switch(type) {
            case 'adventures':
                return this.gameData.adventures || {};
            case 'events':
                return this.gameData.events || {};
            case 'bestemmie':
                return this.gameData.bestemmie || {};
            default:
                return {};
        }
    }
}

/**
 * Utility functions
 */
function clearAndFillSelect(select, values) {
    if (!select) return;
    
    select.innerHTML = '';
    values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        select.appendChild(option);
    });
}

function randomPick(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
}

function showError(message, container) {
    if (container) {
        container.innerHTML = `<div class="result-empty">⚠️ ${message}</div>`;
    }
}

// Helper per mostrare/nascondere gruppi di campi
function showOrHide(el, visible) {
    if (!el) return;
    el.style.display = visible ? '' : 'none';
}

// Sostituzione placeholder sicura
function safeTemplateReplace(tpl, map) {
    return Object.keys(map).reduce((acc, k) => {
        const val = (map[k] ?? '').toString();
        return acc.replace(new RegExp(`\\{${k}\\}`, 'g'), val);
    }, tpl).replace(/\s{2,}/g, ' ').trim();
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
        
        this.updateSubcategories();
    }

    updateSubcategories() {
        const category = document.getElementById('name-category')?.value;
        const subcategorySelect = document.getElementById('name-subcategory');
        const genderSelect = document.getElementById('name-gender');
        const subcategoryGroup = document.getElementById('name-subcategory-group');
        const genderGroup = document.getElementById('name-gender-group');

        if (!subcategorySelect || !genderSelect) return;

        subcategorySelect.innerHTML = '';
        genderSelect.innerHTML = '';

        if (category === 'character') {
            subcategoryGroup.style.display = 'flex';
            genderGroup.style.display = 'flex';
            
            const availableSettings = this.dataManager.getAvailableSettings();
            clearAndFillSelect(subcategorySelect, availableSettings);
            
            const genderOptions = [
                {value:'male', label:'Maschile'},
                {value:'female', label:'Femminile'}
            ];
            genderOptions.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.value; 
                o.textContent = opt.label;
                genderSelect.appendChild(o);
            });
        } else {
            subcategoryGroup.style.display = 'flex';
            genderGroup.style.display = 'none';
            
            const availableSettings = this.dataManager.getAvailableSettings();
            clearAndFillSelect(subcategorySelect, availableSettings);
        }
    }

    generateName() {
        const category = document.getElementById('name-category')?.value;
        const subcategory = document.getElementById('name-subcategory')?.value;
        const gender = document.getElementById('name-gender')?.value;
        const resultContainer = document.getElementById('name-result');

        if (!subcategory) {
            return showError('Seleziona un\'ambientazione', resultContainer);
        }

        let nameList = [];
        const settingData = this.dataManager.getSettingData(subcategory);

        if (category === 'character') {
            if (settingData?.names?.[gender]) {
                nameList = settingData.names[gender];
            }
        } else {
            // Map categories to JSON structure
            const categoryMap = {
                'luoghi': 'names',
                'creature': 'names', // Fallback to names if no specific creature data
                'locande': 'landmarks'
            };
            
            const jsonKey = categoryMap[category] || 'names';
            if (settingData?.cities?.[jsonKey]) {
                nameList = settingData.cities[jsonKey];
            }
        }

        if (!nameList || nameList.length === 0) {
            return showError('Nessun nome disponibile per questa combinazione', resultContainer);
        }

        const randomName = randomPick(nameList);
        
        const html = `
            <div class="result-content">
                <div class="result-title">${randomName}</div>
                <div class="result-description">Categoria: ${category} - ${subcategory}${category === 'character' ? ` (${gender})` : ''}</div>
            </div>
        `;
        
        resultContainer.innerHTML = html;
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
        const location = document.getElementById('adventure-location')?.value;
        const resultContainer = document.getElementById('adventure-result');

        if (!location) { return showError('Seleziona ambientazione', resultContainer); }

        const adventures = this.dataManager.getUnifiedData('adventures');
        const { hooks = {}, locations = {}, antagonisti = [], complicazioni = [] } = adventures;
        
        // Use location setting for both hooks and locations
        const hooksList = hooks[location] || [];
        const locationsList = locations[location] || [];

        if (hooksList.length === 0 || locationsList.length === 0) {
            return showError('Dati insufficienti per generare un\'avventura', resultContainer);
        }

        const html = `
            <div class="result-content">
                <div class="result-title">Avventura</div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Hook:</span>
                        <span>${randomPick(hooksList)}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Ambientazione:</span>
                        <span>${randomPick(locationsList)}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Antagonista:</span>
                        <span>${randomPick(antagonisti)}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Complicazione:</span>
                        <span>${randomPick(complicazioni)}</span>
                    </div>
                </div>
            </div>
        `;
        
        resultContainer.innerHTML = html;
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
        
        if (!setting) {
            return showError('Seleziona un\'ambientazione', resultContainer);
        }

        const settingData = this.dataManager.getSettingData(setting.toLowerCase());
        const treasureData = settingData?.treasures;
        
        if (!treasureData) {
            return showError('Ambientazione non trovata', resultContainer);
        }

        const container = randomPick(treasureData.containers || []);
        const type = randomPick(treasureData.types || []);
        const material = randomPick(treasureData.materials || []);
        const rarity = randomPick(treasureData.rarities || []);
        const effect = randomPick(treasureData.effects || []);

        const html = `
            <div class="result-content">
                <div class="result-title">Tesoro Generato</div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Contenitore:</span>
                        <span>${container}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Oggetto:</span>
                        <span>${type}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Materiale:</span>
                        <span>${material}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Rarità:</span>
                        <span>${rarity}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Effetto:</span>
                        <span>${effect}</span>
                    </div>
                </div>
            </div>
        `;
        
        resultContainer.innerHTML = html;
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
  const resultContainer = document.getElementById('weapon-result');

  if (!setting) {
    return showError('Seleziona un\'ambientazione', resultContainer);
  }

  const settingData = this.dataManager.getSettingData(setting.toLowerCase());
  const weaponData = settingData?.weapons;

  if (!weaponData) {
    return showError('Ambientazione non trovata', resultContainer);
  }

  const classes = weaponData.classes;
  let classesPool = [];

  if (Array.isArray(classes)) {
    // Compatibilità con formato vecchio (lista piatta)
    classesPool = classes;
  } else if (classes && typeof classes === 'object') {
    // Usa il tuo select esistente <select id="weapon-type">
    const selectedRaw = document.getElementById('weapon-type')?.value || '';
    const selected = selectedRaw.toLowerCase().trim();

    // Mappa i valori HTML alle chiavi del JSON
    const keyMap = {
      ravvicinato: 'ravvicinate', // HTML usa singolare, JSON è al plurale
      distanza: 'distanza',
      magiche: 'magiche',
    };
    const jsonKey = keyMap[selected] || selected;

    if (Array.isArray(classes[jsonKey])) {
      classesPool = classes[jsonKey];
    } else {
      // Fallback: unisci tutte le sottoliste
      classesPool = Object.values(classes).flat().filter(Boolean);
    }
  }

  if (!Array.isArray(classesPool) || classesPool.length === 0) {
    return showError('Nessuna classe arma disponibile nel JSON', resultContainer);
  }

  const weaponClass = randomPick(classesPool);
  const material    = randomPick(weaponData.materials  || []);
  const prefix      = randomPick(weaponData.prefixes   || []);
  const suffix      = randomPick(weaponData.suffixes   || []);
  const quality     = randomPick(weaponData.qualities  || []);

  const weaponName = [weaponClass, prefix, suffix].filter(Boolean).join(' ');

  const html = `
    <div class="result-content">
      <div class="result-title">${weaponName}</div>
      <div class="result-details">
        <div class="result-detail">
          <span class="result-detail-label">Tipo:</span>
          <span>${weaponClass}</span>
        </div>
        <div class="result-detail">
          <span class="result-detail-label">Materiale:</span>
          <span>${material}</span>
        </div>
        <div class="result-detail">
          <span class="result-detail-label">Qualità:</span>
          <span>${quality}</span>
        </div>
        <div class="result-detail">
          <span class="result-detail-label">Ambientazione:</span>
          <span>${setting}</span>
        </div>
      </div>
    </div>
  `;
  resultContainer.innerHTML = html;
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
        
        if (!setting || !size) {
            return showError('Seleziona ambientazione e dimensione', resultContainer);
        }

        const settingData = this.dataManager.getSettingData(setting.toLowerCase());
        const cityData = settingData?.cities;
        
        if (!cityData) {
            return showError('Ambientazione non trovata', resultContainer);
        }

        const name = randomPick(cityData.names || []);
        const ruler = randomPick(cityData.rulers || []);
        const district = randomPick(cityData.districts || []);
        const landmark = randomPick(cityData.landmarks || []);
        
        // Population ranges
        const populationRanges = {
            village: { min: 100, max: 800, description: "Villaggio" },
            town: { min: 800, max: 2000, description: "Cittadina" },
            city: { min: 2000, max: 20000, description: "Città" },
            metropolis: { min: 20000, max: 100000, description: "Metropoli" },
            megacity: { min: 100000, max: 500000, description: "Megacittà" },
            capital: { min: 500000, max: 1000000, description: "Capitale" }
        };
        
        const range = populationRanges[size] || { min: 1000, max: 5000, description: "Città" };
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
                        <span>${population.toLocaleString()} (${range.description})</span>
                    </div>
                </div>
            </div>
        `;
        
        resultContainer.innerHTML = html;
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
        
        if (!type) {
            return showError('Seleziona un tipo di evento', resultContainer);
        }

        const settingData = this.dataManager.getSettingData(type.toLowerCase());
        const localPool = Array.isArray(settingData?.events) ? settingData.events : [];

        const events = this.dataManager.getUnifiedData('events');
        const fromUnified = events[type.toLowerCase()] || [];
        const eventPool = localPool.concat(Array.isArray(fromUnified) ? fromUnified : []);

        const conseguenze = events.conseguenze || [];
        const involvementLevels = events.involvement_levels || [];

        if (eventPool.length === 0) {
            return showError('Nessun evento per questa categoria', resultContainer);
        }

        const html = `
            <div class="result-content">
                <div class="result-title">Evento Generato</div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Evento:</span>
                        <span>${randomPick(eventPool)}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Conseguenze:</span>
                        <span>${randomPick(conseguenze)}</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-label">Coinvolgimento PG:</span>
                        <span>${randomPick(involvementLevels)}</span>
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
}

/**
 * Bestemmie / Imprecazioni generator functionality
 * (dataset non-religioso supportato: divinità opzionale)
 */
class BestemmieGenerator {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.bestemmieData = null;
    }

    setBestemmieData(data) {
        this.bestemmieData = data;
    }

    init() {
        this.populateControls();
        const generateButton = document.getElementById('generate-bestemmie');
        generateButton?.addEventListener('click', () => this.generateBestemmie());
    }

    // Normalizza i dati: divinità può mancare (dataset imprecazioni non-religioso)
    getDataSafe() {
        const raw = this.bestemmieData || this.dataManager?.getUnifiedData('bestemmie') || {};

        const hasDiv = raw.divinita || raw['divinità'];
        const divinita = hasDiv ? (raw.divinita || raw['divinità']) : { nessuna: [''] };

        let stili = raw.stili || {};
        if (Array.isArray(stili)) stili = { generico: stili };

        const intensita = raw.intensita || raw['intensità'] || {};
        const template = Array.isArray(raw.template) ? raw.template : null;

        return { divinita, stili, intensita, template, hasDiv: !!hasDiv };
    }

populateControls() {
    const { divinita, stili, intensita, hasDiv } = this.getDataSafe();

    const divSel = document.getElementById('bestemmie-divinita');
    const divGroup = divSel?.closest('.form-group') || divSel?.parentElement;

    if (!hasDiv) {
        // nascondi campo pantheon se il dataset non lo prevede
        showOrHide(divGroup, false);
    } else {
        // niente placeholder, prima voce subito selezionata
        this.fillSelectFromKeys('bestemmie-divinita', divinita);
        showOrHide(divGroup, true);
    }

    this.fillSelectFromKeys('bestemmie-stile', stili);
    this.fillSelectFromKeys('bestemmie-intensita', intensita);
}

fillSelectFromKeys(selectId, obj) {
    const sel = document.getElementById(selectId);
    if (!sel || !obj || typeof obj !== 'object') return false;

    const keys = Object.keys(obj);
    sel.innerHTML = '';

    keys.forEach((k, idx) => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k;
        if (idx === 0) opt.selected = true; // prima voce selezionata
        sel.appendChild(opt);
    });

    return true;
}

    generateBestemmie() {
        const resultContainer = document.getElementById('bestemmie-result');
        const divSel = document.getElementById('bestemmie-divinita');
        const stileKey = document.getElementById('bestemmie-stile')?.value;
        const intensitaKey = document.getElementById('bestemmie-intensita')?.value;

        const { divinita, stili, intensita, template } = this.getDataSafe();

        // divinità è opzionale
        const divinitaKey = (divSel && divSel.offsetParent !== null) ? divSel.value : 'nessuna';

        if (!stileKey || !intensitaKey) {
            return showError('Seleziona stile e intensità', resultContainer);
        }

        const divinitaList = (divinita && divinitaKey && divinita[divinitaKey]) || [''];
        const stileList = stili[stileKey] || [];
        const intensitaList = intensita[intensitaKey] || [];

        if (stileList.length === 0 || intensitaList.length === 0) {
            return showError('Dati insufficienti (liste vuote)', resultContainer);
        }

        const selectedDivinita = randomPick(divinitaList) || '';
        const selectedStile = randomPick(stileList) || '';
        const selectedIntensita = randomPick(intensitaList) || '';

        const templates = template && template.length
            ? template
            : [
                '{intensita}!',
                '{stile}, {intensita}!',
                '{intensita}, e basta!',
                '{intensita}...'
            ];

        const chosen = randomPick(templates);
        const frase = safeTemplateReplace(chosen, {
            divinita: selectedDivinita,
            stile: selectedStile,
            intensita: selectedIntensita
        });

        const html = `
            <div class="result-content">
                <div class="result-title">Frase Generata</div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-label">Testo:</span>
                        <span><p>"${frase}"</p></span>
                    </div>
                    ${(divSel && divSel.offsetParent !== null) ? `
                    <div class="result-detail">
                        <span class="result-detail-label">Divinità:</span>
                        <span>${divinitaKey} (${selectedDivinita})</span>
                    </div>` : ''}
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
        
        resultContainer.innerHTML = html;
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
            await this.dataManager.loadGameData();
            this.populateSelectsFromData();
            this.initToolNavigation();
            
            // Initialize all tools
            this.diceRoller.init();
            this.nameGenerator.init();
            this.adventureGenerator.init();
            this.treasureGenerator.init();
            this.weaponGenerator.init();
            this.cityGenerator.init();
            this.eventGenerator.init();
            this.bestemmieGenerator.init();
            
            this.diceRoller.updateHistory();

        } catch (error) {
            console.error('Error initializing tools:', error);
        }
    }

    populateSelectsFromData() {
        const availableSettings = this.dataManager.getAvailableSettings();

        // Populate setting-based selects
        clearAndFillSelect(document.getElementById('treasure-setting'), availableSettings);
        clearAndFillSelect(document.getElementById('weapon-setting'), availableSettings);
        clearAndFillSelect(document.getElementById('city-setting'), availableSettings);
        clearAndFillSelect(document.getElementById('event-type'), availableSettings);

        // Adventure locations only
        clearAndFillSelect(document.getElementById('adventure-location'), availableSettings);

        // Name categories
        const nameCategories = ['character', 'luoghi', 'creature', 'locande'];
        clearAndFillSelect(document.getElementById('name-category'), nameCategories);

        // Load imprecazioni/bestemmie data (non-religioso supportato)
        this.loadBestemmieData();
    }

    async loadBestemmieData() {
        try {
            // Carica la versione non-religiosa pulita
            const response = await fetch('data/bestemmie.json', { cache: "no-store" });
            if (response.ok) {
                const data = await response.json();
                this.bestemmieGenerator.setBestemmieData(data);
                this.bestemmieGenerator.populateControls();
            } else {
                console.warn("bestemmiejson non trovato (opzionale).");
            }
        } catch (error) {
            console.warn('Errore caricamento imprecazioni (opzionale):', error);
        }
    }

    initToolNavigation() {
        const toolButtons = document.querySelectorAll('.tool-nav-button');
        const toolPanels = document.querySelectorAll('.tool-panel');

        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTool = button.getAttribute('data-tool');
                
                toolButtons.forEach(btn => btn.classList.remove('active'));
                toolPanels.forEach(panel => panel.classList.remove('active'));
                
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
