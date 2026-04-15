// js/results.js

import { showToast } from './notification.js';

export class DMXPatchResults {
  constructor() {
    this.storageKey = 'patchapapa_state';
    this.patchData = [];
    // Tri initial par Univers puis par Adresse
    this.currentSort = { key: 'universe', asc: true };
    
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.updateFilterUI(); 
    this.renderTable();
    this.setupFilters();
    this.setupSorting();
    this.setupExport();
    this.setupRowClick(); 
  }

  /** Extrait les données depuis le localStorage (HTML converti en Objets) */
  loadFromStorage() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      this.parseHTMLToData(data.html || '');
    } catch (e) { 
      console.error("Erreur de lecture du stockage :", e); 
    }
  }

  parseHTMLToData(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const items = doc.querySelectorAll('.result-item');

    this.patchData = Array.from(items).map(item => {
      const spans = item.querySelectorAll('span');
      const fullStart = spans[1].textContent.split('.');
      return {
        name: spans[0].textContent.trim(),
        universe: parseInt(fullStart[0]) || 1,
        address: parseInt(fullStart[1]) || 1,
        endAddress: spans[2].textContent.trim(),
        channels: parseInt(spans[3].textContent) || 0,
        // On récupère l'état coché pour l'affichage du tableau
        isChecked: item.classList.contains('is-checked')
      };
    });
  }

  /** Met à jour les options de filtrage selon les données réelles */
  updateFilterUI() {
    const univSelect = document.getElementById('universe-filter');
    const nameInput = document.getElementById('name-filter');

    if (this.patchData.length === 0) return;

    const universes = [...new Set(this.patchData.map(d => d.universe))].sort((a,b) => a - b);
    if (univSelect) {
      univSelect.innerHTML = '<option value="all">Tous les univers</option>' + 
        universes.map(u => `<option value="${u}">Univ. ${u}</option>`).join('');
    }

    const baseNames = [...new Set(this.patchData.map(d => {
      return d.name.replace(/\s+\d+$/, '').trim();
    }))].sort();

    let datalist = document.getElementById('patched-names-list');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'patched-names-list';
      document.body.appendChild(datalist);
    }
    datalist.innerHTML = baseNames.map(n => `<option value="${n}">`).join('');
    nameInput?.setAttribute('list', 'patched-names-list');
  }

  /** Affiche le tableau avec filtrage et tri naturel */
  renderTable() {
    const tbody = document.querySelector('#results-table tbody');
    const nameVal = document.getElementById('name-filter')?.value.toLowerCase() || '';
    const univVal = document.getElementById('universe-filter')?.value || 'all';

    if (!tbody) return;

    let filtered = this.patchData.filter(d => {
      const matchName = d.name.toLowerCase().includes(nameVal);
      const matchUniv = univVal === 'all' || d.universe === parseInt(univVal);
      return matchName && matchUniv;
    });

    filtered.sort((a, b) => {
      const valA = a[this.currentSort.key];
      const valB = b[this.currentSort.key];
      
      if (this.currentSort.key === 'name') {
        return this.currentSort.asc 
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
      }

      return this.currentSort.asc ? valA - valB : valB - valA;
    });

    // Construction du HTML : On applique la classe is-checked sur le <tr>
    tbody.innerHTML = filtered.map(d => `
      <tr class="${d.isChecked ? 'is-checked' : ''}" data-univ="${d.universe}" data-addr="${d.address}">
        <td>${d.name}</td>
        <td>${d.universe}</td>
        <td>${d.address}</td>
        <td>${d.endAddress}</td>
        <td>${d.channels} CH</td>
      </tr>
    `).join('');

    this.updateHeaderIcons();
  }

  /** Gestion du clic pour cocher/décocher depuis les résultats */
  setupRowClick() {
    const tbody = document.querySelector('#results-table tbody');
    if (!tbody) return;

    tbody.addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;

      const univ = parseInt(tr.dataset.univ);
      const addr = parseInt(tr.dataset.addr);

      // Toggle visuel local
      tr.classList.toggle('is-checked');

      // Mise à jour de la donnée en mémoire locale
      const item = this.patchData.find(d => d.universe === univ && d.address === addr);
      if (item) item.isChecked = tr.classList.contains('is-checked');

      // Synchronisation avec le localStorage pour le Patcher
      this.syncCheckStateToStorage(univ, addr, tr.classList.contains('is-checked'));
    });
  }

  /** Modifie le HTML brut stocké pour le Patcher */
  syncCheckStateToStorage(univ, addr, isChecked) {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;

    try {
      const state = JSON.parse(saved);
      const parser = new DOMParser();
      const doc = parser.parseFromString(state.html, 'text/html');
      
      const items = doc.querySelectorAll('.result-item');
      items.forEach(item => {
        const spans = item.querySelectorAll('span');
        const fullStart = spans[1].textContent.split('.');
        
        if (parseInt(fullStart[0]) === univ && parseInt(fullStart[1]) === addr) {
          if (isChecked) item.classList.add('is-checked');
          else item.classList.remove('is-checked');
        }
      });

      state.html = doc.body.innerHTML;
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {
      console.error("Erreur sync:", e);
    }
  }

  setupFilters() {
    const update = () => this.renderTable();
    document.getElementById('name-filter')?.addEventListener('input', update);
    document.getElementById('universe-filter')?.addEventListener('change', update);
  }

  setupSorting() {
    const headers = document.querySelectorAll('#results-table th');
    const keys = ['name', 'universe', 'address', 'endAddress', 'channels'];

    headers.forEach((th, index) => {
      th.addEventListener('click', () => {
        const key = keys[index];
        if (this.currentSort.key === key) {
          this.currentSort.asc = !this.currentSort.asc;
        } else {
          this.currentSort.key = key;
          this.currentSort.asc = true;
        }
        this.renderTable();
      });
    });
  }

  updateHeaderIcons() {
    const headers = document.querySelectorAll('#results-table th');
    const keys = ['name', 'universe', 'address', 'endAddress', 'channels'];

    headers.forEach((th, index) => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (keys[index] === this.currentSort.key) {
        th.classList.add(this.currentSort.asc ? 'sorted-asc' : 'sorted-desc');
      }
    });
  }

  setupExport() {
    const csvBtn = document.getElementById('export-csv');
    const emailBtn = document.getElementById('send-email');

    csvBtn?.addEventListener('click', () => {
      this.loadFromStorage();
      if (this.patchData.length === 0) return showToast("Patch vide", 2000);
      let csv = "Nom;Univ.;Depart;Fin;Canaux\n";
      this.patchData.forEach(d => {
        csv += `${d.name};${d.universe};${d.address};${d.endAddress};${d.channels}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Patch_DMX_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`;
      link.click();
    });

    emailBtn?.addEventListener('click', async () => {
      this.loadFromStorage();
      if (this.patchData.length === 0) return showToast("Patch vide", 2000);
      try {
        const { generatePlainTextEmail } = await import('./emailFormatter.js');
        const body = generatePlainTextEmail(this.patchData);
        const subject = encodeURIComponent(`Patch DMX - ${new Date().toLocaleDateString()}`);
        window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
      } catch (err) {
        showToast("Erreur d'envoi", 2000);
      }
    });
  }
}
