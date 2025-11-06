// js/patcher.js

import { projectorLibrary, initProjectorDatalist } from './data/projectors.js';
import { getValidInt, setupNumberControls, saveToLocalStorage } from './utils.js';
import { generatePlainTextEmail } from './emailFormatter.js';
import { showToast } from './notification.js';

/**
 * Classe gérant la logique de patch DMX, avec gestion de conflits,
 * undo multi-niveaux, affichage des résultats, et autocomplétion.
 */
export class DMXPatcher {
  constructor() {
    this.history = [];                     // Pile d’états pour undo
    this.occupiedChannels = new Map();     // Map<univers, Set<adresses occupées>>
    this.projectorCounters = {};           // Compteur de projecteurs par nom
    this.outputHTML = '';                  // HTML des résultats pour affichage
    this.activeSuggestionIndex = -1;       // Index de suggestion active

    this.init();                           // Initialisation DOM & listeners
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
    this.resBtn       = document.getElementById('resultsButton');
    this.navPatchBtn  = document.getElementById('show-patch');
    this.navResultsBtn= document.getElementById('show-results');
    this.resBtn.addEventListener('click', () => this.navResultsBtn.click());
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

    // Patch et Undo
    this.patchBtn.addEventListener('click', () => this.patchProjectors());
    this.undoBtn.addEventListener('click', () => this.undo());

    // Config + et -
    setupNumberControls('.number-control');

    // Focus auto-select (sélectionne le texte au focus):contentReference[oaicite:14]{index=14}
    document.querySelectorAll('input, select')
            .forEach(el => el.addEventListener('focus', e => e.target.select()));

    // Autocomplete Projector
    this.pName.addEventListener('input', () => {
      this.onProjectorInput();
      this.checkIfValidProjectorName();
    });
    this.pName.addEventListener('keydown', e => this.onProjectorKeyDown(e));
    this.pName.addEventListener('blur', () => {
      setTimeout(() => {
        document.getElementById('projector-suggestions')?.classList.add('hidden');
      }, 150);
    });

    // Changement d'univers
    this.univ.addEventListener('change', () => this.updateStartAddress());

    // Empêcher le submit
    this.form.addEventListener('submit', e => e.preventDefault());

    // Init Undo button
    this.updateUndoButton();
  }

  /** Sauvegarde l'état courant (canaux, compteurs, HTML, formulaire) pour undo */
  saveState() {
    const occClone = new Map();
    for (const [u, set] of this.occupiedChannels) {
      occClone.set(u, new Set(set));  // Cloner chaque Set
    }
    const pcClone = { ...this.projectorCounters };
    const htmlClone = this.outputHTML;
    const universeValue = this.univ.value;
    const addressValue = this.addr.value;

    this.history.push({ occClone, pcClone, htmlClone, universeValue, addressValue });
    this.updateUndoButton();
  }

  /** Annule le dernier patch et restaure l'état */
  undo() {
    if (this.history.length === 0) {
      showToast('Rien à annuler',2000);
      return;
    }
    const { occClone, pcClone, htmlClone, universeValue, addressValue } = this.history.pop();
    this.occupiedChannels = occClone;
    this.projectorCounters = pcClone;
    this.outputHTML = htmlClone;

    document.getElementById('output').innerHTML = this.outputHTML;
    saveToLocalStorage('dmx_patch_results', this.outputHTML);

    this.univ.value = universeValue;
    this.addr.value = addressValue;

    showToast('Dernier patch annulé',1500);
    this.updateUndoButton();
  }

  /** Active/désactive le bouton Undo */
  updateUndoButton() {
    if (this.history.length > 0) this.undoBtn.removeAttribute('disabled');
    else this.undoBtn.setAttribute('disabled','true');
  }

  /** Met à jour la première adresse libre dans l'univers sélectionné */
  updateStartAddress() {
    const u = parseInt(this.univ.value, 10) || 1;
    this.addr.value = this.findFirstFree(u);
  }

  /** Renvoie le premier canal libre (non occupé) dans l'univers */
  findFirstFree(u) {
    const set = this.occupiedChannels.get(u) || new Set();
    for (let i = 1; i <= 512; i++) {
      if (!set.has(i)) return i;
    }
    return 1;
  }

  /** Patch DMX avec gestion des conflits (avec option de décalage) */
  patchProjectors() {
    // 0️⃣ Sauvegarde pour undo
    this.saveState();
    // Fermer suggestions en cours
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

    // 3) Patch effectif (avant conflit ou tous si pas de conflit)
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

    // b) Si conflit, trouver la prochaine plage libre et patcher le reste
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

    // 4) Affichage et stockage du résultat
    this.outputHTML = html;
    document.getElementById('output').innerHTML = html;
    saveToLocalStorage('dmx_patch_results', html);
    showToast('Patch réalisé avec succès !', 2500);

    // Correction du roulage des adresses
    if (currentA > 512) {
      currentU += 1;
      currentA = 1;
    }
    this.univ.value = currentU;
    this.addr.value = currentA;
  }

  /** Vérifie si le nom saisi correspond à un modèle existant */
  checkIfValidProjectorName() {
    const input = this.pName.value.trim().toLowerCase();
    const modeGroup = document.getElementById('mode-group');
    const modeSelect = document.getElementById('modeSelect');

    // Recherche exacte dans projectorLibrary sur la propriété model
    const found = projectorLibrary.find(p => p.model.toLowerCase() === input);
    if (!found) {
      modeGroup.classList.add('hidden');
      modeSelect.innerHTML = '';
    }
  }

  /** Réagit à la frappe pour afficher les suggestions */
  onProjectorInput() {
    const term = this.pName.value.trim().toLowerCase();
    const list = document.getElementById('projector-suggestions');
    const modeGroup = document.getElementById('mode-group');
    const modeSelect = document.getElementById('modeSelect');

    // Réinitialiser la liste
    list.innerHTML = '';
    list.classList.add('hidden');

    if (!term) {
      modeGroup.classList.add('hidden');
      modeSelect.innerHTML = '';
      return;
    }

    // Filtrer par préfixe (model ou brand) puis par inclusion
    const startsWithFilter = projectorLibrary.filter(p =>
      p.model.toLowerCase().startsWith(term) ||
      p.brand.toLowerCase().startsWith(term)
    );
    const includesFilter = projectorLibrary.filter(p =>
      !startsWithFilter.includes(p) &&
      (p.model.toLowerCase().includes(term) ||
       p.brand.toLowerCase().includes(term))
    );
    const results = [...startsWithFilter, ...includesFilter];

    if (results.length === 0) {
      modeGroup.classList.add('hidden');
      modeSelect.innerHTML = '';
      return;
    }

    // Construire les éléments de la liste de suggestions
    results.forEach(result => {
      const model = result.model;
      const brand = result.brand;
      let highlightedBrand = brand;
      let highlightedModel = model;
      const idxB = brand.toLowerCase().indexOf(term);
      if (idxB !== -1) {
        highlightedBrand =
          `${brand.slice(0, idxB)}<strong>${brand.slice(idxB, idxB + term.length)}</strong>` +
          `${brand.slice(idxB + term.length)}`;
      }
      const idxM = model.toLowerCase().indexOf(term);
      if (idxM !== -1) {
        highlightedModel =
          `${model.slice(0, idxM)}<strong>${model.slice(idxM, idxM + term.length)}</strong>` +
          `${model.slice(idxM + term.length)}`;
      }
      const li = document.createElement('li');
      li.innerHTML = `${highlightedBrand} ${highlightedModel}`;
      li.addEventListener('click', () => {
        this.pName.value = model;
        list.classList.add('hidden');
        this.populateModes(model);
        this.activeSuggestionIndex = -1;
      });
      list.appendChild(li);
    });

    // Afficher la liste
    list.classList.remove('hidden');
  }

  /** Navigation clavier dans la liste des suggestions */
  onProjectorKeyDown(e) {
    const list = document.getElementById('projector-suggestions');
    if (!list) return;
    const items = list.querySelectorAll('li');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeSuggestionIndex =
        (this.activeSuggestionIndex + 1) % items.length;
      this.updateActiveSuggestion(items);
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeSuggestionIndex =
        (this.activeSuggestionIndex - 1 + items.length) % items.length;
      this.updateActiveSuggestion(items);
    }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.activeSuggestionIndex >= 0) {
        // Sélection par entrée sur suggestion
        items[this.activeSuggestionIndex].click();
      } else {
        // Si pas de suggestion active, faire recherche exacte
        list.classList.add('hidden');
        const entered = this.pName.value.trim().toLowerCase();
        const found = projectorLibrary.find(p =>
          p.model.toLowerCase() === entered
        );
        if (!found) {
          document.getElementById('mode-group').classList.add('hidden');
          document.getElementById('modeSelect').innerHTML = '';
        } else {
          this.populateModes(found.model);
        }
      }
      this.activeSuggestionIndex = -1;
    } else {
      // Toute autre touche réinitialise la sélection active
      this.activeSuggestionIndex = -1;
    }
  }

  /** Met en surbrillance l’item actif */
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

  /** Affiche les modes disponibles pour un modèle donné */
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

  /** Vérifie disponibilité des canaux */
  areChannelsAvailable(u, s, n) {
    const set = this.occupiedChannels.get(u) || new Set();
    for (let i = 0; i < n; i++) {
      if (set.has(s + i)) return false;
    }
    return true;
  }

  /** Marque les canaux comme occupés */
  markChannelsAsOccupied(u, s, n) {
    if (!this.occupiedChannels.has(u)) {
      this.occupiedChannels.set(u, new Set());
    }
    const set = this.occupiedChannels.get(u);
    for (let i = 0; i < n; i++) {
      set.add(s + i);
    }
  }
}

// Initialisation au chargement
window.addEventListener('load', () => new DMXPatcher());
