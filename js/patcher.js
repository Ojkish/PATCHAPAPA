// js/patcher.js

import { projectorLibrary } from './data/projectors.js';
import { getValidInt, setupNumberControls } from './utils.js';
import { showToast } from './notification.js';

/**
 * Classe gérant la logique de patch DMX, avec gestion de conflits,
 * undo multi-niveaux persistant, stockage local et remise à zéro.
 */
export class DMXPatcher {
  constructor() {
    this.history = [];                     // Pile d’états pour undo
    this.occupiedChannels = new Map();     // Map<univers, Set<adresses occupées>>
    this.projectorCounters = {};           // Compteur de projecteurs par nom
    this.outputHTML = '';                  // HTML des résultats pour affichage
    this.activeSuggestionIndex = -1;       // Pour la navigation des suggestions

    this.init();                           // Initialisation DOM & listeners
    this.loadData();                       // Charger les données + historique
    this.updateStartAddress();             // Adresse de départ initiale
  }

  /** Initialise les éléments DOM et configure les listeners */
  init() {
    this.form         = document.getElementById('patchForm');
    this.pName        = document.getElementById('projectorName');
    this.pCount       = document.getElementById('projectorCount');
    this.cCount       = document.getElementById('channelCount');
    this.univ         = document.getElementById('universe');
    this.addr         = document.getElementById('address');
    
    this.patchBtn     = document.getElementById('patchButton');
    this.undoBtn      = document.getElementById('undoButton');
    this.resetBtn     = document.getElementById('resetButton'); 
    this.resBtn       = document.getElementById('resultsButton');
    
    this.navPatchBtn  = document.getElementById('show-patch');
    this.navResultsBtn= document.getElementById('show-results');
    
    // Navigation
    this.navPatchBtn.addEventListener('click', () => {
      document.getElementById('patch-section').classList.remove('hidden');
      document.getElementById('results-section').classList.add('hidden');
    });
    this.navResultsBtn.addEventListener('click', () => {
      document.getElementById('patch-section').classList.add('hidden');
      document.getElementById('results-section').classList.remove('hidden');
      import('./results.js').then(m => new m.DMXPatchResults());
    });

    // Actions
    this.patchBtn.addEventListener('click', () => this.patchProjectors());
    this.undoBtn.addEventListener('click', () => this.undo());
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.resetAll());
    }

    // Config + et -
    setupNumberControls('.number-control');

    // Focus auto-select
    document.querySelectorAll('input, select').forEach(el => el.addEventListener('focus', e => e.target.select()));

    // Autocomplete Projector
    const fuseOpts = { 
      keys: ['model','brand'], 
      useExtendedSearch: true,
      threshold:0.5, 
      includeMatches:true, 
      minMatchCharLength:1, 
      ignoreLocation:true 
    };
    this.fuse = new window.Fuse(projectorLibrary, fuseOpts);
    this.pName.addEventListener('input', () => { this.onProjectorInput(); this.checkIfValidProjectorName(); });
    this.pName.addEventListener('keydown', e => this.onProjectorKeyDown(e));
    this.pName.addEventListener('blur', () => setTimeout(() => document.getElementById('projector-suggestions')?.classList.add('hidden'), 150));

    // Universe change
    this.univ.addEventListener('change', () => this.updateStartAddress());

    // Prevent submit
    this.form.addEventListener('submit', e => e.preventDefault());

    this.updateUndoButton();
  }

  // --- PERSISTANCE ---

  /** Sauvegarde l'état et l'historique dans le LocalStorage */
  persistData() {
    const state = {
      html: this.outputHTML,
      counters: this.projectorCounters,
      channels: Array.from(this.occupiedChannels.entries()).map(([u, set]) => [u, Array.from(set)]),
      history: this.history.map(step => ({
        ...step,
        occClone: Array.from(step.occClone.entries()).map(([u, set]) => [u, Array.from(set)])
      }))
    };
    localStorage.setItem('patchapapa_state', JSON.stringify(state));
  }

  /** Charge les données et force la mise à jour de l'état du bouton Undo */
  loadData() {
    const saved = localStorage.getItem('patchapapa_state');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      this.outputHTML = data.html || '';
      this.projectorCounters = data.counters || {};
      
      if (data.channels) {
        this.occupiedChannels = new Map(
          data.channels.map(([u, arr]) => [u, new Set(arr)])
        );
      }

      if (data.history) {
        this.history = data.history.map(step => ({
          ...step,
          occClone: new Map(step.occClone.map(([u, arr]) => [u, new Set(arr)]))
        }));
      }

      document.getElementById('output').innerHTML = this.outputHTML;
      
      // CRUCIAL : On met à jour l'état du bouton après chargement
      this.updateUndoButton(); 
    } catch (e) {
      console.error("Erreur de restauration :", e);
    }
  }

  /** Remise à zéro complète : Storage + Formulaire + Reload */
  resetAll() {
    const confirmation = confirm("⚠️ Voulez-vous vraiment TOUT effacer ?\nLe patch et l'historique seront supprimés.");
    if (confirmation) {
      // 1. Nettoyage du stockage
      localStorage.removeItem('patchapapa_state');
      
      // 2. Réinitialisation forcée du formulaire (évite le cache navigateur)
      if (this.form) this.form.reset();
      
      // 3. Rechargement propre
      location.reload(); 
    }
  }

  // --- LOGIQUE CORE ---

  saveState() {
    const occClone = new Map();
    for (const [u, set] of this.occupiedChannels) occClone.set(u, new Set(set));
    const pcClone = { ...this.projectorCounters };
    const htmlClone = this.outputHTML;
    const universeValue = this.univ.value;
    const addressValue = this.addr.value;

    this.history.push({ occClone, pcClone, htmlClone, universeValue, addressValue });
    this.updateUndoButton();
  }

  undo() {
    if (this.history.length === 0) {
      showToast('Rien à annuler', 2000);
      return;
    }
    const { occClone, pcClone, htmlClone, universeValue, addressValue } = this.history.pop();
    this.occupiedChannels = occClone;
    this.projectorCounters = pcClone;
    this.outputHTML = htmlClone;

    document.getElementById('output').innerHTML = this.outputHTML;
    
    this.persistData(); // Sauvegarde l'historique réduit

    this.univ.value = universeValue;
    this.addr.value = addressValue;

    showToast('Dernier patch annulé', 1500);
    this.updateUndoButton();
  }

  updateUndoButton() {
    if (this.undoBtn) {
      if (this.history.length > 0) this.undoBtn.removeAttribute('disabled');
      else this.undoBtn.setAttribute('disabled', 'true');
    }
  }

  updateStartAddress() {
    const u = parseInt(this.univ.value, 10) || 1;
    const nextFreeAddress = this.findFirstFree(u);
    if (this.addr) this.addr.value = nextFreeAddress;
  }

  findFirstFree(u) {
    const set = this.occupiedChannels.get(u) || new Set();
    for(let i = 1; i <= 512; i++) if(!set.has(i)) return i;
    return 1;
  }

  patchProjectors() {
    this.saveState();
    document.getElementById('projector-suggestions')?.classList.add('hidden');

    const name = (this.pName.value.trim() || 'PROJO').toUpperCase();
    const pc = getValidInt('projectorCount');
    const cc = getValidInt('channelCount');
    let u = getValidInt('universe');
    let a = getValidInt('address');
    if(!pc || !cc || !u || !a) return;

    let conflictIdx = -1, tempU = u, tempA = a;
    for(let i = 0; i < pc; i++){
      let end = tempA + cc - 1;
      if(end > 512){ tempU++; tempA = 1; end = tempA + cc - 1; }
      if(!this.areChannelsAvailable(tempU, tempA, cc)){ conflictIdx = i; break; }
      tempA += cc;
    }

    if(conflictIdx >= 0){
      const ok = window.confirm(`Conflit sur projecteur ${conflictIdx+1}. Décaler sur les adresses libres ?`);
      if(!ok) return;
    }

    let html = this.outputHTML, currentU = u, currentA = a;
    this.projectorCounters[name] = this.projectorCounters[name] || 0;
    const batchEnd = conflictIdx >= 0 ? conflictIdx : pc;

    for(let i = 0; i < batchEnd; i++){
      this.projectorCounters[name]++;
      const num = this.projectorCounters[name];
      let end = currentA + cc - 1;
      if(end > 512){ currentU++; currentA = 1; end = currentA + cc - 1; }
      this.markChannelsAsOccupied(currentU, currentA, cc);
      html += `<div class="result-item"><span><strong>${name} ${num}</strong></span>`+
            `<span class="address-start">${currentU}.${currentA}</span>`+
            `<span class="address-end">${currentU}.${end}</span>`+
            `<span>${cc}CH</span></div>`;
      currentA += cc;
    }

    if(conflictIdx >= 0){
      const findNext = () => { 
          let sU = currentU, sA = currentA; 
          while(true){ 
              if(this.areChannelsAvailable(sU, sA, cc)) return {sU, x: sA}; 
              sA++; 
              if(sA > 512 - cc + 1) { sU++; sA = 1; } 
          }
      };
      const {sU, x} = findNext(); 
      currentU = sU; currentA = x;
      for(let i = conflictIdx; i < pc; i++){
        this.projectorCounters[name]++;
        const num = this.projectorCounters[name];
        let end = currentA + cc - 1;
        if(end > 512){ currentU++; currentA = 1; end = currentA + cc - 1; }
        this.markChannelsAsOccupied(currentU, currentA, cc);
        html += `<div class="result-item"><span><strong>${name} ${num}</strong></span>`+
              `<span class="address-start">${currentU}.${currentA}</span>`+
              `<span class="address-end">${currentU}.${end}</span>`+
              `<span>${cc}CH</span></div>`;
        currentA += cc;
      }
    }

    this.outputHTML = html;
    document.getElementById('output').innerHTML = html;
    this.persistData();

    showToast('Patch réalisé avec succès !', 2500);

    if(currentA > 512){ currentU++; currentA = 1; }
    this.univ.value = currentU;
    this.addr.value = currentA;
  }

  areChannelsAvailable(u, s, n){ 
    const set = this.occupiedChannels.get(u) || new Set(); 
    for(let i = 0; i < n; i++) if(set.has(s+i)) return false; 
    return true; 
  }

  markChannelsAsOccupied(u, s, n){ 
    if(!this.occupiedChannels.has(u)) this.occupiedChannels.set(u, new Set()); 
    const set = this.occupiedChannels.get(u); 
    for(let i = 0; i < n; i++) set.add(s+i); 
  }

  // --- AUTOCOMPLETE ---

  onProjectorInput() {
    const term = this.pName.value.trim().toLowerCase();
    const list = document.getElementById('projector-suggestions');
    const modeGroup = document.getElementById('mode-group');
    const modeSelect = document.getElementById('modeSelect');

    list.innerHTML = '';
    list.classList.add('hidden');

    if (!term) {
      modeGroup.classList.add('hidden');
      modeSelect.innerHTML = '';
      return;
    }

    // --- NOUVELLE LOGIQUE DE FILTRAGE MULTI-MOTS ---
    // On sépare la saisie en plusieurs mots (ex: "mar aur" -> ["mar", "aur"])
    const searchWords = term.split(/\s+/); 

    const results = projectorLibrary.filter(p => {
      const fullName = `${p.brand} ${p.model}`.toLowerCase();
      // On vérifie que CHAQUE mot de la recherche est présent dans le nom complet
      return searchWords.every(word => fullName.includes(word));
    });
    // ----------------------------------------------

    if (results.length === 0) {
      modeGroup.classList.add('hidden');
      modeSelect.innerHTML = '';
      return;
    }

    // Affichage des résultats (limité aux 10 premiers pour rester fluide)
    results.slice(0, 10).forEach(result => {
      const model = result.model;
      const brand = result.brand;
      const fullName = `${brand} ${model}`;
      
      const li = document.createElement('li');
      
      // Optionnel : Surlignage des mots trouvés
      let highlightedName = fullName;
      searchWords.forEach(word => {
        if(word.length > 0) {
          const reg = new RegExp(`(${word})`, 'gi');
          highlightedName = highlightedName.replace(reg, "<strong>$1</strong>");
        }
      });

      li.innerHTML = highlightedName;
      li.addEventListener('click', () => {
        this.pName.value = model;
        list.classList.add('hidden');
        this.populateModes(model);
      });
      list.appendChild(li);
    });

    list.classList.remove('hidden');
  }

  checkIfValidProjectorName() {
    const input = this.pName.value.trim().toLowerCase();
    const modeGroup = document.getElementById('mode-group');
    const modeSelect = document.getElementById('modeSelect');
    const found = projectorLibrary.find(p => p.model.toLowerCase() === input);
    if (!found) {
      modeGroup.classList.add('hidden');
      modeSelect.innerHTML = '';
    }
  }

  onProjectorKeyDown(e) {
    const list = document.getElementById('projector-suggestions');
    if (!list) return;
    const items = list.querySelectorAll('li');
    if (items.length === 0) return;
  
    const input = document.getElementById('projectorName');
    const modeGroup = document.getElementById('mode-group');
    const modeSelect = document.getElementById('modeSelect');
  
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % items.length;
      this.updateActiveSuggestion(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + items.length) % items.length;
      this.updateActiveSuggestion(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.activeSuggestionIndex >= 0) {
        items[this.activeSuggestionIndex].click();
        this.activeSuggestionIndex = -1;
      } else {
        list.classList.add('hidden');
        const enteredText = input.value.trim().toLowerCase();
        const found = projectorLibrary.find(p => p.model.toLowerCase() === enteredText);
        if (!found) {
          modeGroup.classList.add('hidden');
          modeSelect.innerHTML = '';
        } else {
          this.populateModes(found.model);
        }
        this.activeSuggestionIndex = -1;
      }
    } else {
      this.activeSuggestionIndex = -1;
    }
  }

  updateActiveSuggestion(items) {
    items.forEach((item, idx) => {
      if (idx === this.activeSuggestionIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  populateModes(model) {
    const entry = projectorLibrary.find(p => p.model === model);
    const modeGroup  = document.getElementById('mode-group');
    const modeSelect = document.getElementById('modeSelect');

    if (entry) {
      modeSelect.innerHTML = '';
      entry.modes.forEach(m => {
        const o = document.createElement('option');
        o.value = m.channels;
        o.textContent = `${m.name} (${m.channels}ch)`;
        modeSelect.appendChild(o);
      });
      modeGroup.classList.remove('hidden');
      this.cCount.value = modeSelect.value;
      modeSelect.addEventListener('change', () => {
        this.cCount.value = modeSelect.value;
      });
    } else {
      modeGroup.classList.add('hidden');
    }
  }
}

window.addEventListener('load', () => new DMXPatcher());
