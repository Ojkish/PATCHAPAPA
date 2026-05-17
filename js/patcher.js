// js/patcher.js

import { projectorLibrary } from './data/projectors.js';
import { getValidInt, setupNumberControls } from './utils.js';
import { showToast } from './notification.js';

export class DMXPatcher {
  constructor() {
    this.history = [];
    this.storageKey = 'patchapapa_state';
    this.historyKey = 'patchapapa_history'; 
    this.occupiedChannels = new Map();
    this.projectorCounters = {};
    this.outputHTML = '';
    this.activeSuggestionIndex = -1;

    this.init();
    this.loadData();
    this.updateStartAddress();
  }

  init() {

    const setActiveNav = (activeId) => {
      ['show-patch', 'show-results', 'show-projects'].forEach(id => {
        document.getElementById(id).classList.toggle('active', id === activeId);
      });
    };

    this.form = document.getElementById('patchForm');
    this.pName = document.getElementById('projectorName');
    this.pCount = document.getElementById('projectorCount');
    this.cCount = document.getElementById('channelCount');
    this.univ = document.getElementById('universe');
    this.addr = document.getElementById('address');
    
    this.patchBtn = document.getElementById('patchButton');
    this.undoBtn = document.getElementById('undoButton');
    this.resetBtn = document.getElementById('resetButton'); 

    this.modal = document.getElementById('custom-modal');
    this.modalConfirmBtn = document.getElementById('modal-confirm');
    this.modalCancelBtn = document.getElementById('modal-cancel');

    // --- NAVIGATION AVEC SYNCHRONISATION ---
    document.getElementById('show-patch').addEventListener('click', () => {
      setActiveNav('show-patch'); 
      this.loadData();
      document.getElementById('patch-section').classList.remove('hidden');
      document.getElementById('results-section').classList.add('hidden');
      document.getElementById('projects-section').classList.add('hidden');
    });
    
    let resultsInstance = null;

    document.getElementById('show-results').addEventListener('click', () => {
      setActiveNav('show-results');
      document.getElementById('patch-section').classList.add('hidden');
      document.getElementById('results-section').classList.remove('hidden');
      document.getElementById('projects-section').classList.add('hidden');
      
      import('./results.js').then(m => {
        if (!resultsInstance) {
          resultsInstance = new m.DMXPatchResults();
        } else {
          resultsInstance.loadFromStorage();
          resultsInstance.updateFilterUI();
          resultsInstance.renderTable();
        }
      });
    });

    document.getElementById('show-projects').addEventListener('click', () => {
      setActiveNav('show-projects');
      document.getElementById('patch-section').classList.add('hidden');
      document.getElementById('results-section').classList.add('hidden');
      document.getElementById('projects-section').classList.remove('hidden');
    });
    
    document.getElementById('resultsButton')?.addEventListener('click', () => {
      document.getElementById('show-results').click(); 
    });

    setActiveNav('show-patch');

    this.patchBtn.addEventListener('click', () => this.patchProjectors());
    this.undoBtn.addEventListener('click', () => this.undo());
    if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetAll());

    // --- CLIC POUR COCHER/DÉCOCHER (CHECK-LIST) ---
    document.getElementById('output').addEventListener('click', (e) => {
      const item = e.target.closest('.result-item');
      if (item) {
        item.classList.toggle('is-checked');
        this.outputHTML = document.getElementById('output').innerHTML;
        this.persistData();
      }
    });

// Accélération normale pour projectorCount et channelCount
setupNumberControls('[data-target="projectorCount"], [data-target="channelCount"]');

// Comportement intelligent pour address et universe
  this.setupSmartControls();

    // Branche l'avertissement adresse sur les 4 champs concernés
    ['address', 'universe', 'channelCount', 'projectorCount'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.updateAddressHint());
      document.getElementById(id)?.addEventListener('change', () => this.updateAddressHint());
    });

    // --- SCROLL AUTOMATIQUE & SÉLECTION ---
    document.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('focus', e => {
        e.target.select();
        const scrollPos = (e.target.id === 'projectorName') ? 'start' : 'center';
        setTimeout(() => {
          e.target.scrollIntoView({
            behavior: 'smooth',
            block: scrollPos
          });
        }, 300);
      });
    });

    this.pName.addEventListener('focus', () => this.onProjectorInput());
    this.pName.addEventListener('input', () => this.onProjectorInput());
    this.pName.addEventListener('keydown', e => this.onProjectorKeyDown(e));
    this.pName.addEventListener('blur', () => {
      setTimeout(() => document.getElementById('projector-suggestions')?.classList.add('hidden'), 300);
    });

    this.univ.addEventListener('change', () => this.updateStartAddress());
    this.form.addEventListener('submit', e => e.preventDefault());

    this.updateUndoButton();
  }

setupSmartControls() {
  const fields = [
    { target: 'address',  inc: this.findNextValidAddress.bind(this),  dec: this.findPrevValidAddress.bind(this)  },
    { target: 'universe', inc: this.findNextValidUniverse.bind(this), dec: this.findPrevValidUniverse.bind(this) },
  ];

  fields.forEach(({ target, inc, dec }) => {
    const input  = document.getElementById(target);
    const incBtn = document.querySelector(`[data-action="increment"][data-target="${target}"]`);
    const decBtn = document.querySelector(`[data-action="decrement"][data-target="${target}"]`);
    if (!input || !incBtn || !decBtn) return;

    let timer = null;
    let initialTimer = null;
    let interval = 250;

    const step = (fn) => {
      const next = fn(parseInt(input.value, 10) || 1);
      if (next !== null) {
        input.value = next;
        // Si on change d'univers depuis le bouton adresse → mettre à jour le champ univers
        if (target === 'address' && next._u !== undefined) {
          this.univ.value = next._u;
          input.value = next._a;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        // Retour visuel
        const btn = fn === inc ? incBtn : decBtn;
        btn.style.transform = 'scale(0.85)';
        setTimeout(() => btn.style.transform = 'scale(1)', 60);
      }
    };

    const startEffect = (fn, btn) => (e) => {
      if (e.type === 'touchstart') e.preventDefault();
      step(fn);
      initialTimer = setTimeout(() => {
        const loop = () => {
          step(fn);
          interval = Math.max(70, interval * 0.9);
          timer = setTimeout(loop, interval);
        };
        loop();
      }, 450);
    };

    const stopEffect = () => {
      clearTimeout(timer);
      clearTimeout(initialTimer);
      timer = null;
      initialTimer = null;
      interval = 250;
    };

    [incBtn, decBtn].forEach(btn => btn.addEventListener('click', e => e.preventDefault()));

    incBtn.addEventListener('mousedown',  startEffect(inc, incBtn));
    incBtn.addEventListener('touchstart', startEffect(inc, incBtn), { passive: false });
    decBtn.addEventListener('mousedown',  startEffect(dec, decBtn));
    decBtn.addEventListener('touchstart', startEffect(dec, decBtn), { passive: false });

    window.addEventListener('mouseup',    stopEffect);
    window.addEventListener('touchend',   stopEffect);
    window.addEventListener('touchcancel',stopEffect);
  });
}

findNextValidAddress(current) {
  const u  = parseInt(this.univ.value, 10) || 1;
  const cc = parseInt(this.cCount.value, 10) || 1;

  // Cherche dans l'univers courant
  for (let a = current + 1; a <= 512 - cc + 1; a++) {
    if (this.areChannelsAvailable(u, a, cc)) return a;
  }

  // Passe à l'univers suivant
  for (let nextU = u + 1; nextU <= 512; nextU++) {
    for (let a = 1; a <= 512 - cc + 1; a++) {
      if (this.areChannelsAvailable(nextU, a, cc)) {
        this.univ.value = nextU;
        return a;
      }
    }
  }
  return null; // Rien de disponible
}

findPrevValidAddress(current) {
  const u  = parseInt(this.univ.value, 10) || 1;
  const cc = parseInt(this.cCount.value, 10) || 1;

  // Cherche en arrière dans l'univers courant
  for (let a = current - 1; a >= 1; a--) {
    if (this.areChannelsAvailable(u, a, cc)) return a;
  }

  // Passe à l'univers précédent
  for (let prevU = u - 1; prevU >= 1; prevU--) {
    for (let a = 512 - cc + 1; a >= 1; a--) {
      if (this.areChannelsAvailable(prevU, a, cc)) {
        this.univ.value = prevU;
        return a;
      }
    }
  }
  return null;
}

findNextValidUniverse(current) {
  const cc = parseInt(this.cCount.value, 10) || 1;
  for (let u = current + 1; u <= 512; u++) {
    for (let a = 1; a <= 512 - cc + 1; a++) {
      if (this.areChannelsAvailable(u, a, cc)) {
        this.addr.value = a;
        this.updateAddressHint();
        return u;
      }
    }
  }
  return null;
}

findPrevValidUniverse(current) {
  const cc = parseInt(this.cCount.value, 10) || 1;
  for (let u = current - 1; u >= 1; u--) {
    for (let a = 1; a <= 512 - cc + 1; a++) {
      if (this.areChannelsAvailable(u, a, cc)) {
        this.addr.value = a;
        this.updateAddressHint();
        return u;
      }
    }
  }
  return null;
}

  askConfirmation(title, message) {
    return new Promise((resolve) => {
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-message').textContent = message;
      this.modal.classList.remove('hidden');
      const onConfirm = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };
      const cleanup = () => {
        this.modalConfirmBtn.removeEventListener('click', onConfirm);
        this.modalCancelBtn.removeEventListener('click', onCancel);
        this.modal.classList.add('hidden');
      };
      this.modalConfirmBtn.addEventListener('click', onConfirm);
      this.modalCancelBtn.addEventListener('click', onCancel);
    });
  }

  getRecentHistory() {
    return JSON.parse(localStorage.getItem(this.historyKey) || '[]');
  }

  saveToHistory(brand, model, lastChannels) {
    let history = this.getRecentHistory();
    const newItem = { brand, model, lastChannels };
    history = history.filter(item => item.model !== model);
    history.unshift(newItem);
    history = history.slice(0, 10);
    localStorage.setItem(this.historyKey, JSON.stringify(history));
  }

  onProjectorInput() {
    const term = this.pName.value.trim().toLowerCase();
    const list = document.getElementById('projector-suggestions');
    list.innerHTML = '';
    this.activeSuggestionIndex = -1;

    if (!term) {
      const history = this.getRecentHistory();
      if (history.length > 0) {
        const title = document.createElement('li');
        title.innerHTML = `<small style="color:var(--primary-color); font-weight:bold;">🕒 RÉCENTS</small>`;
        title.style.pointerEvents = "none";
        list.appendChild(title);
        history.forEach(item => this.createSuggestionItem(item, list));
        list.classList.remove('hidden');
      } else {
        list.classList.add('hidden');
      }
      return;
    }

    const searchWords = term.split(/\s+/).filter(w => w.length > 0);
    const results = projectorLibrary.filter(p => {
      const fullName = `${p.brand} ${p.model}`.toLowerCase();
      return searchWords.every(word => fullName.includes(word));
    });

    if (results.length === 0) {
      list.classList.add('hidden');
      return;
    }

    results.slice(0, 10).forEach(result => {
      this.createSuggestionItem(result, list, searchWords);
    });
    list.classList.remove('hidden');
  }

  createSuggestionItem(projector, container, searchWords = []) {
    const li = document.createElement('li');
    const fullName = `${projector.brand} ${projector.model}`;
    let displayHTML = fullName;

    if (searchWords.length > 0) {
      const sortedWords = [...searchWords].sort((a, b) => b.length - a.length);
      sortedWords.forEach(w => {
        const reg = new RegExp(`(${w})(?![^<]*>)`, 'gi');
        displayHTML = displayHTML.replace(reg, "<strong>$1</strong>");
      });
    }

    li.innerHTML = displayHTML;
    li.addEventListener('click', () => {
      this.pName.value = projector.model;
      container.classList.add('hidden');
      this.populateModes(projector.model, projector.lastChannels);
    });
    container.appendChild(li);
  }

  async patchProjectors() {
    const name = (this.pName.value.trim() || 'PROJO').toUpperCase();
    const pc = getValidInt('projectorCount');
    const cc = getValidInt('channelCount');
    let u = getValidInt('universe');
    let a = getValidInt('address');
    if(!pc || !cc || !u || !a) return;

    const entry = projectorLibrary.find(p => p.model === this.pName.value);
    const brand = entry ? entry.brand : 'MANUEL';
    this.saveToHistory(brand, this.pName.value, cc);

    this.saveState();

    let conflictIdx = -1, tempU = u, tempA = a;
    for(let i=0; i<pc; i++){
      let end = tempA + cc - 1;
      if(end > 512){ tempU++; tempA = 1; end = tempA + cc - 1; }
      if(!this.areChannelsAvailable(tempU, tempA, cc)){ conflictIdx = i; break; }
      tempA += cc;
    }

    if(conflictIdx >= 0){
      const ok = await this.askConfirmation("Conflit DMX", `Conflit détecté sur le projecteur ${conflictIdx+1}. Décaler automatiquement sur les adresses libres ?`);
      if(!ok) { 
        this.history.pop();
        this.updateUndoButton();
        return; 
      }
    }

    this.executePatchLogic(name, pc, cc, u, a, conflictIdx);
  }

  executePatchLogic(name, pc, cc, u, a, conflictIdx) {
    let html = this.outputHTML, currentU = u, currentA = a;
    this.projectorCounters[name] = this.projectorCounters[name] || 0;
    const batchEnd = conflictIdx >= 0 ? conflictIdx : pc;

    for(let i=0; i<batchEnd; i++){
      this.projectorCounters[name]++;
      let end = currentA + cc - 1;
      if(end > 512){ currentU++; currentA = 1; end = currentA + cc - 1; }
      this.markChannelsAsOccupied(currentU, currentA, cc);
      html += `<div class="result-item"><span><strong>${name} ${this.projectorCounters[name]}</strong></span>`+
              `<span class="address-start">${currentU}.${currentA}</span>`+
              `<span class="address-end">${currentU}.${end}</span>`+
              `<span>${cc}CH</span></div>`;
      currentA += cc;
    }

    if(conflictIdx >= 0){
      let sU = currentU, sA = currentA;
      while(!this.areChannelsAvailable(sU, sA, cc)){ 
        sA++; 
        if(sA > 512-cc+1){ sU++; sA=1; } 
      }
      currentU = sU; currentA = sA;
      for(let i=conflictIdx; i<pc; i++){
        this.projectorCounters[name]++;
        let end = currentA + cc - 1;
        if(end > 512){ currentU++; currentA = 1; end = currentA + cc - 1; }
        this.markChannelsAsOccupied(currentU, currentA, cc);
        html += `<div class="result-item"><span><strong>${name} ${this.projectorCounters[name]}</strong></span>`+
                `<span class="address-start">${currentU}.${currentA}</span>`+
                `<span class="address-end">${currentU}.${end}</span>`+
                `<span>${cc}CH</span></div>`;
        currentA += cc;
      }
    }

    this.outputHTML = html;
    document.getElementById('output').innerHTML = html;
    this.persistData();
    showToast('Patch réalisé !', 2000);
    
if(currentA > 512){ currentU++; currentA = 1; }
this.univ.value = currentU;
this.updateStartAddressAfterPatch();  }

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
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  loadData() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      this.outputHTML = data.html || '';
      this.projectorCounters = data.counters || {};
      if (data.channels) this.occupiedChannels = new Map(data.channels.map(([u, arr]) => [u, new Set(arr)]));
      if (data.history) {
        this.history = data.history.map(step => ({
          ...step,
          occClone: new Map(step.occClone.map(([u, arr]) => [u, new Set(arr)]))
        }));
      }
      document.getElementById('output').innerHTML = this.outputHTML;
      this.updateUndoButton();
    } catch (e) { console.error("Erreur loadData:", e); }
  }

  async resetAll() {
    const ok = await this.askConfirmation("Remise à zéro", "Effacer tout le patch actuel ?");
    if (ok) {
      localStorage.removeItem(this.storageKey);
      if (this.form) this.form.reset();
      location.reload();
    }
  }

  saveState() {
    const occClone = new Map();
    for (const [u, set] of this.occupiedChannels) occClone.set(u, new Set(set));
    this.history.push({ 
      occClone, 
      pcClone: {...this.projectorCounters}, 
      htmlClone: this.outputHTML, 
      universeValue: this.univ.value, 
      addressValue: this.addr.value 
    });
    this.updateUndoButton();
  }

  async undo() {
    if (this.history.length === 0) return;
    const ok = await this.askConfirmation("Annuler l'action", "Voulez-vous vraiment supprimer le dernier ajout de projecteurs ?");
    if (ok) {
      const { occClone, pcClone, htmlClone, universeValue, addressValue } = this.history.pop();
      this.occupiedChannels = occClone;
      this.projectorCounters = pcClone;
      this.outputHTML = htmlClone;
      const outputElem = document.getElementById('output');
      if (outputElem) outputElem.innerHTML = this.outputHTML;
      this.persistData();
      this.univ.value = universeValue;
      this.addr.value = addressValue;  // ← restaure l'adresse AVANT le recalcul
      this.updateUndoButton();
      this.updateAddressHint();        // ← recalcule le hint avec les bonnes valeurs
      showToast('Dernière action annulée', 2000);     }
  }

  updateUndoButton() {
    if (this.undoBtn) this.undoBtn.disabled = this.history.length === 0;
  }

updateStartAddress() {
  const u = parseInt(this.univ.value, 10) || 1;
  const set = this.occupiedChannels.get(u) || new Set();

  let free = 1;
  for (let i = 1; i <= 512; i++) {
    if (!set.has(i)) { free = i; break; }
  }

  if (this.addr) this.addr.value = free;
  this.updateAddressHint();
}

updateStartAddressAfterPatch() {
  const cc = parseInt(this.cCount.value, 10) || 1;
  let u = parseInt(this.univ.value, 10) || 1;
  let free = null;

  while (free === null) {
    for (let i = 1; i <= 512 - cc + 1; i++) {
      if (this.areChannelsAvailable(u, i, cc)) {
        free = { u, a: i };
        break;
      }
    }
    if (free === null) u++;
    if (u > 512) break;
  }

  if (free) {
    this.univ.value = free.u;
    if (this.addr) this.addr.value = free.a;
  }
  this.updateAddressHint();
}

updateAddressHint() {
  const hint = document.getElementById('address-hint');
  if (!hint) return;

  const u  = parseInt(this.univ.value, 10)  || 1;
  const a  = parseInt(this.addr.value, 10)  || 1;
  const cc = parseInt(this.cCount.value, 10) || 1;
  const pc = parseInt(this.pCount.value, 10) || 1;

  const badge = (text, color = '#555') =>
    `<span style="background:${color};color:#fff;font-size:13px;padding:3px 10px;border-radius:20px;display:inline-block;">${text}</span>`;
  const dot = `<span style="color:#888;margin:0 2px;">·</span>`;

  // Reset visuel des deux champs
  this.univ.className = '';
  this.addr.className = '';
  hint.className = '';
  hint.innerHTML = '';

  const univSet = this.occupiedChannels.get(u) || new Set();

  // CAS 1 — Univers saturé (512/512)
  if (univSet.size >= 512) {
    this.univ.className = 'universe-conflict';
    hint.className = 'conflict';
    hint.innerHTML = badge(`⚠️ Univers saturé — 512/512 canaux utilisés`, '#bb4444');
    return;
  }

  // CAS 2 — Plus assez de place pour 1 projo dans cet univers
  let hasRoom = false;
  for (let i = 1; i <= 512 - cc + 1; i++) {
    if (this.areChannelsAvailable(u, i, cc)) { hasRoom = true; break; }
  }
  if (!hasRoom) {
    // Calcul des canaux libres restants
    let freeCount = 0;
    for (let i = 1; i <= 512; i++) { if (!univSet.has(i)) freeCount++; }
    this.univ.className = 'universe-conflict';
    hint.className = 'conflict';
    hint.innerHTML = badge(`⚠️ Plus assez de place — ${freeCount} canaux libres, ${cc} requis`, '#bb4444');
    return;
  }

  // CAS 3 — Débordement fin d'univers
  if (a + cc - 1 > 512) {
    const available = 512 - a + 1;
    this.addr.className = 'address-conflict';
    hint.className = 'conflict';
    hint.innerHTML = badge(`⚠️ Dépasse la fin de U${u} — ${available} canal${available > 1 ? 'aux' : ''} disponible${available > 1 ? 's' : ''}, ${cc} requis`, '#bb4444');
    return;
  }

  // CAS 4 — Adresse déjà prise
  if (!this.areChannelsAvailable(u, a, cc)) {
    this.addr.className = 'address-conflict';
    hint.className = 'conflict';
    hint.innerHTML = badge('⚠️ Adresse déjà prise', '#bb4444');
    return;
  }

  // CAS 5 — Tout OK — simulation du patch
  let tempU = u, tempA = a;
  const univCounts = {};

  for (let i = 0; i < pc; i++) {
    if (tempA + cc - 1 > 512) { tempU++; tempA = 1; }
    while (!this.areChannelsAvailable(tempU, tempA, cc)) {
      tempA++;
      if (tempA > 512 - cc + 1) { tempU++; tempA = 1; }
    }
    univCounts[tempU] = (univCounts[tempU] || 0) + 1;
    tempA += cc;
  }

  const univKeys = Object.keys(univCounts).map(Number);
  const parts = univKeys.map(uKey =>
    `${univCounts[uKey]}× ${badge('U' + uKey)}`
  );

  this.addr.className = 'address-free';
  this.univ.className = '';
  hint.className = 'free';
  hint.innerHTML = `→ ${parts.join(` ${dot} `)}`;
}

areChannelsAvailable(u, s, n){
    const set = this.occupiedChannels.get(u) || new Set();
    for(let i=0; i<n; i++) if(set.has(s+i)) return false;
    return true;
  }

  markChannelsAsOccupied(u, s, n){
    if(!this.occupiedChannels.has(u)) this.occupiedChannels.set(u, new Set());
    const set = this.occupiedChannels.get(u);
    for(let i=0; i<n; i++) set.add(s+i);
  }

  populateModes(model, preferredChannels = null) {
    const entry = projectorLibrary.find(p => p.model === model);
    const modeGroup = document.getElementById('mode-group');
    const modeSelect = document.getElementById('modeSelect');
    if (entry) {
      modeSelect.innerHTML = entry.modes.map(m => `<option value="${m.channels}">${m.name} (${m.channels}ch)</option>`).join('');
      modeGroup.classList.remove('hidden');
      if (preferredChannels) modeSelect.value = preferredChannels;
    this.cCount.value = modeSelect.value;
    this.updateAddressHint(); // ← AJOUT — mise à jour immédiate au chargement du projo

modeSelect.onchange = () => { 
  this.cCount.value = modeSelect.value;
  this.updateAddressHint(); // ← AJOUT — mise à jour à chaque changement de mode
};    }
  }

  onProjectorKeyDown(e) {
    const list = document.getElementById('projector-suggestions');
    if (list.classList.contains('hidden')) return;
    const items = list.querySelectorAll('li:not([style*="pointer-events"])');
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
      if (this.activeSuggestionIndex >= 0) items[this.activeSuggestionIndex].click();
    }
  }

  updateActiveSuggestion(items) {
    items.forEach((it, i) => it.classList.toggle('active', i === this.activeSuggestionIndex));
  }
}

window.addEventListener('load', () => {
  window._dmxPatcher = new DMXPatcher();
});
