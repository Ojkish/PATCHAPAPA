// js/patcher.js

import { projectorLibrary, initProjectorDatalist } from './data/projectors.js';
import { getValidInt, setupNumberControls, saveToLocalStorage } from './utils.js';
import { generatePlainTextEmail } from './emailFormatter.js';
import { showToast } from './notification.js';

/**
 * Classe gérant la logique de patch DMX, avec gestion de conflits
 * et affichage des résultats.
 */
export class DMXPatcher {
  constructor() {
    this.occupiedChannels = new Map();     // Map<univers, Set<adresses occupées>>
    this.projectorCounters = {};           // Compteur de projecteurs par nom
    this.activeSuggestionIndex = -1;
    this.outputHTML = '';
    this.init();
    this.updateStartAddress();
    this.activeSuggestionIndex = -1;
  }

  init() {

    const fuseOptions = {
      keys: [
        { name: 'model', weight: 0.9 },
        { name: 'brand', weight: 0.1 }
      ],
      threshold: 0.5,              // tolérance aux fautes
      // tokenize: true,              // découpe la recherche en mots
      includeMatches: true,   // permet d'utiliser les correspondances
  minMatchCharLength: 1,
  ignoreLocation: true    // plus tolérant sur la position
};
    this.fuse = new window.Fuse(projectorLibrary, fuseOptions);
    

    this.form = document.getElementById('patchForm');
    this.pName = document.getElementById('projectorName');
    this.pCount = document.getElementById('projectorCount');
    this.cCount = document.getElementById('channelCount');
    this.univ = document.getElementById('universe');
    this.addr = document.getElementById('address');
    this.patchBtn = document.getElementById('patchButton');
    this.resBtn = document.getElementById('resultsButton');
    this.navPatchBtn = document.getElementById('show-patch');
    this.navResultsBtn = document.getElementById('show-results');
    /***********************
     * Navigation entre les sections "Patch" et "Résultats"
     ***********************/
    this.navPatchBtn.addEventListener('click', () => {
      document.getElementById('patch-section') .classList.remove('hidden');
      document.getElementById('results-section').classList.add   ('hidden');
    });
    this.navResultsBtn.addEventListener('click', () => {
      document.getElementById('patch-section') .classList.add   ('hidden');
      document.getElementById('results-section').classList.remove('hidden');
      // Important : rafraîchir les résultats
      import('./results.js').then(m => new m.DMXPatchResults());
    });

    // Configurer contrôles + / -
    setupNumberControls('.number-control');

    // Sélection automatique du contenu au focus
    document.querySelectorAll('input, select').forEach(el =>
      el.addEventListener('focus', e => e.target.select())
    );

    // Auto-complétion et modes
    // initProjectorDatalist('projector-list');
    this.pName.addEventListener('input', () => {
      this.onProjectorInput();
      this.checkIfValidProjectorName(); // solution de repli
    });
    this.pName.addEventListener('keydown', e => this.onProjectorKeyDown(e));

    // Mettre à jour adresse quand univers change
    this.univ.addEventListener('change', () => this.updateStartAddress());

    // Événement Patch
    this.patchBtn.addEventListener('click', () => this.patchProjectors());

    // Afficher résultats
    this.resBtn.addEventListener('click', () => {
      document.getElementById('patch-section').classList.add('hidden');
      document.getElementById('results-section').classList.remove('hidden');
      import('./results.js').then(m => new m.DMXPatchResults());
    });

    this.pName.addEventListener('blur', () => {
      setTimeout(() => {
        document.getElementById('projector-suggestions')?.classList.add('hidden');
      }, 150);
    });
    

    this.form.addEventListener('submit', e => e.preventDefault());
  }
  

  onProjectorInput() {
    const term = this.pName.value.trim();
    const list = document.getElementById('projector-suggestions');
    const modeGroup = document.getElementById('mode-group');
    const modeSelect = document.getElementById('modeSelect');
  
    list.innerHTML = '';
  
    if (!term) {
      list.classList.add('hidden');
      modeGroup.classList.add('hidden');  // Cacher les modes
      modeSelect.innerHTML = '';          // Vider la liste des modes
      return;
    }
  
    const results = this.fuse.search(term);
  
    if (results.length === 0) {
      list.classList.add('hidden');
      modeGroup.classList.add('hidden');  // Pas de correspondance → cacher modes
      modeSelect.innerHTML = '';
      return;
    }
  
    // Vérifier si le terme correspond exactement à un modèle
    const exactMatch = projectorLibrary.find(p => p.model.toLowerCase() === term.toLowerCase());
    if (!exactMatch) {
      modeGroup.classList.add('hidden');
      modeSelect.innerHTML = '';
    }
  
    results.forEach(result => {
      const model = result.item.model;
      const brand = result.item.brand;
  
      let highlightedBrand = brand;
      let highlightedModel = model;
  
      if (result.matches) {
        result.matches.forEach(match => {
          const value = match.value;
          let highlighted = '';
          let lastIndex = 0;
  
          match.indices.forEach(([start, end]) => {
            highlighted += value.slice(lastIndex, start);
            highlighted += '<strong>' + value.slice(start, end + 1) + '</strong>';
            lastIndex = end + 1;
          });
          highlighted += value.slice(lastIndex);
  
          if (match.key === 'brand') highlightedBrand = highlighted;
          if (match.key === 'model') highlightedModel = highlighted;
        });
      }
  
      const li = document.createElement('li');
      li.innerHTML = `${highlightedBrand} ${highlightedModel}`;
      li.addEventListener('click', () => {
        this.pName.value = model; // Remplit avec le modèle uniquement
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
  
    const found = projectorLibrary.find(p => p.name.toLowerCase() === input);
  
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
  
    const input = document.getElementById('projectorName'); // champ de saisie
    const modeGroup = document.getElementById('mode-group'); // conteneur du mode
    const modeSelect = document.getElementById('modeSelect'); // liste des modes
  
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
        // Sélection via flèche puis entrée : simule un clic
        items[this.activeSuggestionIndex].click();
        this.activeSuggestionIndex = -1;
      } else {
        // Validation saisie manuelle (pas sélection via flèches)
        list.classList.add('hidden');
  
        const enteredText = input.value.trim().toLowerCase();
        // On vérifie sur projectorLibrary et propriété model (pas name)
        const found = projectorLibrary.find(p => p.model.toLowerCase() === enteredText);
  
        if (!found) {
          // Pas trouvé : masquer modes
          modeGroup.classList.add('hidden');
          modeSelect.innerHTML = '';
        } else {
          // Trouvé : on peut appeler populateModes pour être sûr
          this.populateModes(found.model);
        }
        this.activeSuggestionIndex = -1;
      }
    } else {
      // Sur toute autre touche, on reset l'index de sélection active
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
  




  updateStartAddress() {
    const u = parseInt(this.univ.value, 10) || 1;
    this.addr.value = this.findFirstFree(u);
  }

  findFirstFree(u) {
    const set = this.occupiedChannels.get(u) || new Set();
    for (let i = 1; i <= 512; i++) {
      if (!set.has(i)) return i;
    }
    return 1;
  }

  areChannelsAvailable(u, s, n) {
    const set = this.occupiedChannels.get(u) || new Set();
    for (let i = 0; i < n; i++) {
      if (set.has(s + i)) return false;
    }
    return true;
  }

  markChannelsAsOccupied(u, s, n) {
    if (!this.occupiedChannels.has(u)) {
      this.occupiedChannels.set(u, new Set());
    }
    const set = this.occupiedChannels.get(u);
    for (let i = 0; i < n; i++) set.add(s + i);
  }

  patchProjectors() {
    // Forcer la fermeture des suggestions si encore ouvertes
    document.getElementById('projector-suggestions')?.classList.add('hidden');

    const name = (this.pName.value.trim() || 'PROJO').toUpperCase();
    const pc = getValidInt('projectorCount');
    const cc = getValidInt('channelCount');
    let u = getValidInt('universe');
    let a = getValidInt('address');
    if (!pc || !cc || !u || !a) return;

    // 1) Détection du premier conflit
    let conflictIndex = -1;
    let tempU = u, tempA = a;
    for (let i = 0; i < pc; i++) {
      let end = tempA + cc - 1;
      if (end > 512) {
        tempU++;
        tempA = 1;
        end = tempA + cc - 1;
      }
      if (!this.areChannelsAvailable(tempU, tempA, cc)) {
        conflictIndex = i;
        break;
      }
      tempA += cc;
    }

    // 2) Si conflit, demande à l'utilisateur
    if (conflictIndex >= 0) {
      const proceed = window.confirm(
        `Conflit détecté sur le projecteur n°${conflictIndex + 1}.` +
        `\nOK pour décaler les suivants, Annuler pour tout annuler.`
      );
      if (!proceed) return;
    }

    // 3) Patch effectif
    this.projectorCounters[name] = this.projectorCounters[name] || 0;
    let html = this.outputHTML;
    let currentU = u, currentA = a;

    // a) Patch des appareils avant conflit (ou tous si pas de conflit)
    const firstBatchEnd = (conflictIndex >= 0 ? conflictIndex : pc);
    for (let i = 0; i < firstBatchEnd; i++) {
      this.projectorCounters[name]++;
      const num = this.projectorCounters[name];
      let end = currentA + cc - 1;
      if (end > 512) {
        currentU++;
        currentA = 1;
        end = currentA + cc - 1;
      }
      this.markChannelsAsOccupied(currentU, currentA, cc);
      html += `<div class="result-item"><span><strong>${name} ${num}</strong></span>` +
              `<span class="address-start">${currentU}.${currentA}</span>` +
              `<span class="address-end">${currentU}.${end}</span>` +
              `<span>${cc}CH</span></div>`;
      currentA += cc;
    }

    // b) Si conflit, recherche prochaine plage libre et patch restants
    if (conflictIndex >= 0) {
      const findNext = () => {
        let searchU = currentU, searchA = 1;
        while (true) {
          const set = this.occupiedChannels.get(searchU) || new Set();
          for (let addr = searchA; addr <= 512 - (cc - 1); addr++) {
            if (this.areChannelsAvailable(searchU, addr, cc)) {
              return { searchU, addr };
            }
          }
          searchU++;
          searchA = 1;
        }
      };
      const { searchU, addr: nextA } = findNext();
      currentU = searchU;
      currentA = nextA;

      for (let i = conflictIndex; i < pc; i++) {
        this.projectorCounters[name]++;
        const num = this.projectorCounters[name];
        let end = currentA + cc - 1;
        if (end > 512) {
          currentU++;
          currentA = 1;
          end = currentA + cc - 1;
        }
        this.markChannelsAsOccupied(currentU, currentA, cc);
        html += `<div class="result-item"><span><strong>${name} ${num}</strong></span>` +
                `<span class="address-start">${currentU}.${currentA}</span>` +
                `<span class="address-end">${currentU}.${end}</span>` +
                `<span>${cc}CH</span></div>`;
        currentA += cc;
      }
    }

      // 4) Affichage et stockage
      this.outputHTML = html;
      document.getElementById('output').innerHTML = html;
      saveToLocalStorage('dmx_patch_results', html);
      showToast('Patch réalisé avec succès !', 2500);
  
      // ** Correction rollover **
      if (currentA > 512) {
        currentU += 1;
        currentA = 1;
      }
  
      this.univ.value = currentU;
      this.addr.value = currentA;
  }
}

// Initialisation au chargement
window.addEventListener('load', () => new DMXPatcher());
