// js/patcher.js

import { projectorLibrary, initProjectorDatalist } from './data/projectors.js';
import { getValidInt, setupNumberControls, saveToLocalStorage } from './utils.js';
import { generatePlainTextEmail } from './emailFormatter.js';
import { showToast } from './notification.js';

/**
 * Classe gérant la logique de patch DMX, avec gestion de conflits,
 * undo multi-niveaux, et affichage des résultats.
 */
export class DMXPatcher {
  constructor() {
    this.history = [];                     // Pile d’états pour undo
    this.occupiedChannels = new Map();     // Map<univers, Set<adresses occupées>>
    this.projectorCounters = {};           // Compteur de projecteurs par nom
    this.outputHTML = '';                  // HTML des résultats pour affichage
    this.activeSuggestionIndex = -1;       // Pour la navigation des suggestions

    this.init();                           // Initialisation DOM & listeners
    this.updateStartAddress();            // Adresse de départ initiale
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
    this.pName.addEventListener('blur', () => setTimeout(() => document.getElementById('projector-suggestions')?.classList.add('hidden'),150));

// Fonction de recherche appelée lors de la saisie utilisateur
function searchProjectors(query) {
  if (!query) {
    // Si la requête est vide, on retourne la liste complète
    return projectors;
  }
  // On divise la requête en mots, on ajoute '^' devant chaque mot pour forcer le préfixe.
  const tokens = query.split(/\s+/).filter(Boolean);
  const fuseQuery = tokens.map(token => `^${token}`).join(' ');
  // On exécute la recherche avec Fuse.js
  const results = fuse.search(fuseQuery);
  // Fuse.js retourne des objets avec {item, score}, on extrait les items
  return results.map(result => result.item);
}

// Exemple d'utilisation : récupération des résultats
const inputField = document.getElementById("search-input");
inputField.addEventListener("input", function() {
  const query = inputField.value.trim();
  const filteredProjectors = searchProjectors(query);
  // mettre à jour l'affichage avec filteredProjectors...
  console.log(filteredProjectors);
});

    
    // Universe change
    this.univ.addEventListener('change', () => this.updateStartAddress());

    // Prevent submit
    this.form.addEventListener('submit', e => e.preventDefault());

    // Init Undo button
    this.updateUndoButton();
  }

  /** Sauvegarde l'état courant (canaux, compteurs, HTML, formulaire) pour undo */
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
    if (this.history.length>0) this.undoBtn.removeAttribute('disabled');
    else this.undoBtn.setAttribute('disabled','true');
  }

  /** Met à jour la première adresse libre */
  updateStartAddress() {
    const u = parseInt(this.univ.value,10)||1;
    this.addr.value = this.findFirstFree(u);
  }

  /** Renvoie le premier canal libre dans l'univers */
  findFirstFree(u) {
    const set = this.occupiedChannels.get(u)||new Set();
    for(let i=1;i<=512;i++) if(!set.has(i)) return i;
    return 1;
  }

  /** Logique de patch DMX avec gestion conflits */
  patchProjectors() {
    this.saveState();
    document.getElementById('projector-suggestions')?.classList.add('hidden');

    const name = (this.pName.value.trim()||'PROJO').toUpperCase();
    const pc = getValidInt('projectorCount');
    const cc = getValidInt('channelCount');
    let u = getValidInt('universe');
    let a = getValidInt('address');
    if(!pc||!cc||!u||!a) return;

    let conflictIdx=-1, tempU=u, tempA=a;
    for(let i=0;i<pc;i++){
      let end=tempA+cc-1;
      if(end>512){ tempU++; tempA=1; end=tempA+cc-1; }
      if(!this.areChannelsAvailable(tempU,tempA,cc)){ conflictIdx=i; break; }
      tempA+=cc;
    }

    if(conflictIdx>=0){
      const ok=window.confirm(`Conflit sur projecteur ${conflictIdx+1}. OK pour décaler ?`);
      if(!ok) return;
    }

    let html=this.outputHTML, currentU=u, currentA=a;
    this.projectorCounters[name] = this.projectorCounters[name]||0;
    const batchEnd = conflictIdx>=0?conflictIdx:pc;

    for(let i=0;i<batchEnd;i++){
      this.projectorCounters[name]++;
      const num=this.projectorCounters[name];
      let end=currentA+cc-1;
      if(end>512){ currentU++; currentA=1; end=currentA+cc-1; }
      this.markChannelsAsOccupied(currentU,currentA,cc);
      html+=`<div class="result-item"><span><strong>${name} ${num}</strong></span>`+
            `<span class="address-start">${currentU}.${currentA}</span>`+
            `<span class="address-end">${currentU}.${end}</span>`+
            `<span>${cc}CH</span></div>`;
      currentA+=cc;
    }

    if(conflictIdx>=0){
      const findNext=()=>{ let sU=currentU,sA=1; while(true){ const set=this.occupiedChannels.get(sU)||new Set(); for(let x=sA;x<=512-cc+1;x++){ if(this.areChannelsAvailable(sU,x,cc)) return {sU,x}; } sU++; sA=1; }};
      const {sU,x}=findNext(); currentU=sU; currentA=x;
      for(let i=conflictIdx;i<pc;i++){
        this.projectorCounters[name]++;
        const num=this.projectorCounters[name];
        let end=currentA+cc-1;
        if(end>512){ currentU++; currentA=1; end=currentA+cc-1; }
        this.markChannelsAsOccupied(currentU,currentA,cc);
        html+=`<div class="result-item"><span><strong>${name} ${num}</strong></span>`+
              `<span class="address-start">${currentU}.${currentA}</span>`+
              `<span class="address-end">${currentU}.${end}</span>`+
              `<span>${cc}CH</span></div>`;
        currentA+=cc;
      }
    }

    this.outputHTML=html;
    document.getElementById('output').innerHTML=html;
    saveToLocalStorage('dmx_patch_results',html);
    showToast('Patch réalisé avec succès !',2500);

    if(currentA>512){ currentU++; currentA=1; }
    this.univ.value=currentU;
    this.addr.value=currentA;
  }

  /** Vérifie disponibilité des canaux */
  areChannelsAvailable(u,s,n){ const set=this.occupiedChannels.get(u)||new Set(); for(let i=0;i<n;i++) if(set.has(s+i)) return false; return true; }

  /** Marque les canaux occupés */
  markChannelsAsOccupied(u,s,n){ if(!this.occupiedChannels.has(u)) this.occupiedChannels.set(u,new Set()); const set=this.occupiedChannels.get(u); for(let i=0;i<n;i++) set.add(s+i); }

onProjectorInput() {
  const term = this.pName.value.trim().toLowerCase();
  const list = document.getElementById('projector-suggestions');
  const modeGroup = document.getElementById('mode-group');
  const modeSelect = document.getElementById('modeSelect');

  // Clear suggestions and hide suggestions list
  list.innerHTML = '';
  list.classList.add('hidden');

  // If term is empty, clear modes select and return
  if (!term) {
    modeGroup.classList.add('hidden');
    modeSelect.innerHTML = '';
    return;
  }

  // Filter fixtures by brand or model starting with the term
  const startsWithFilter = projectorLibrary.filter(p => p.model.toLowerCase().startsWith(term) || p.brand.toLowerCase().startsWith(term));

  // Filter remaining fixtures that include the term in their brand or model (excluding those already included in startsWithFilter)
  const includesFilter = projectorLibrary.filter(p => !startsWithFilter.includes(p) && (p.model.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term)));

  // Merge both filters, giving priority to the ones that start with the term
  const results = [...startsWithFilter, ...includesFilter];

  // If no results found, hide modes select and return
  if (results.length === 0) {
    modeGroup.classList.add('hidden');
    modeSelect.innerHTML = '';
    return;
  }

  // Generate suggestions list items and highlight matching characters
  results.forEach(result => {
    const model = result.model;
    const brand = result.brand;
    let highlightedBrand = brand;
    let highlightedModel = model;

    const startIndexBrand = brand.toLowerCase().indexOf(term);
    if (startIndexBrand !== -1) {
      highlightedBrand = `${brand.slice(0, startIndexBrand)}<strong>${brand.slice(startIndexBrand, startIndexBrand + term.length)}</strong>${brand.slice(startIndexBrand + term.length)}`;
    }

    const startIndexModel = model.toLowerCase().indexOf(term);
    if (startIndexModel !== -1) {
      highlightedModel = `${model.slice(0, startIndexModel)}<strong>${model.slice(startIndexModel, startIndexModel + term.length)}</strong>${model.slice(startIndexModel + term.length)}`;
    }

    const li = document.createElement('li');
    li.innerHTML = `${highlightedBrand} ${highlightedModel}`;
    li.addEventListener('click', () => {
      this.pName.value = model;
      list.classList.add('hidden');
      this.populateModes(model);
    });
    list.appendChild(li);
  });

  // Show suggestions list
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
      // 0️⃣ Sauvegarde pour undo
      this.saveState();
      
    

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
