// js/results.js

import { showToast } from './notification.js';

export class DMXPatchResults {
  constructor() {
    this.storageKey = 'patchapapa_state';
    this.patchData = [];
    this.currentSort = { key: 'universe', asc: true }; // Tri par défaut
    
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.updateFilterUI(); // Prépare les suggestions et la liste d'univers
    this.renderTable();
    this.setupFilters();
    this.setupSorting();
    this.setupExport();
  }

  loadFromStorage() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      this.parseHTMLToData(data.html || '');
    } catch (e) { console.error(e); }
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
        channels: parseInt(spans[3].textContent) || 0
      };
    });
  }

  /** Met à jour dynamiquement le dropdown d'univers et la liste de suggestions de noms */
  updateFilterUI() {
    const univSelect = document.getElementById('universe-filter');
    const nameInput = document.getElementById('name-filter');

    if (this.patchData.length === 0) return;

    // 1. Liste d'univers uniques présents dans le patch
    const universes = [...new Set(this.patchData.map(d => d.universe))].sort((a,b) => a - b);
    if (univSelect) {
      univSelect.innerHTML = '<option value="all">Tous les univers</option>' + 
        universes.map(u => `<option value="${u}">Univers ${u}</option>`).join('');
    }

    // 2. Suggestions de noms (Datalist) basée sur les machines patchées
    const names = [...new Set(this.patchData.map(d => d.name))].sort();
    let datalist = document.getElementById('patched-names-list');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'patched-names-list';
      document.body.appendChild(datalist);
    }
    datalist.innerHTML = names.map(n => `<option value="${n}">`).join('');
    nameInput?.setAttribute('list', 'patched-names-list');
  }

  renderTable() {
    const tbody = document.querySelector('#results-table tbody');
    const nameVal = document.getElementById('name-filter')?.value.toLowerCase() || '';
    const univVal = document.getElementById('universe-filter')?.value || 'all';

    if (!tbody) return;

    // 1. Filtrage
    let filtered = this.patchData.filter(d => {
      const matchName = d.name.toLowerCase().includes(nameVal);
      const matchUniv = univVal === 'all' || d.universe === parseInt(univVal);
      return matchName && matchUniv;
    });

    // 2. Tri (Classement)
    filtered.sort((a, b) => {
      let valA = a[this.currentSort.key];
      let valB = b[this.currentSort.key];
      
      if (typeof valA === 'string') {
        return this.currentSort.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.currentSort.asc ? valA - valB : valB - valA;
    });

    // 3. Affichage
    tbody.innerHTML = filtered.map(d => `
      <tr>
        <td>${d.name}</td>
        <td>Univ ${d.universe}</td>
        <td>${d.address}</td>
        <td>${d.endAddress}</td>
        <td>${d.channels} CH</td>
      </tr>
    `).join('');

    this.updateHeaderIcons();
  }

  setupFilters() {
    const update = () => this.renderTable();
    document.getElementById('name-filter')?.addEventListener('input', update);
    document.getElementById('universe-filter')?.addEventListener('change', update);
  }

  /** Gestion du tri au clic sur les entêtes de colonnes */
  setupSorting() {
    const headers = document.querySelectorAll('#results-table th');
    const keys = ['name', 'universe', 'address', 'endAddress', 'channels'];

    headers.forEach((th, index) => {
      th.style.cursor = 'pointer';
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
      if (this.patchData.length === 0) return showToast("Patch vide", 2000);
      let csv = "Nom;Univers;Depart;Fin;Canaux\n";
      this.patchData.forEach(d => {
        csv += `${d.name};${d.universe};${d.address};${d.endAddress};${d.channels}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Patch_DMX_${new Date().toLocaleDateString()}.csv`;
      link.click();
    });

    emailBtn?.addEventListener('click', async () => {
      if (this.patchData.length === 0) return showToast("Patch vide", 2000);
      const { generatePlainTextEmail } = await import('./emailFormatter.js');
      const body = generatePlainTextEmail(this.patchData);
      const subject = encodeURIComponent(`Patch DMX - ${new Date().toLocaleDateString()}`);
      window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
    });
  }
}
