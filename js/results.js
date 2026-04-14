// js/results.js

import { showToast } from './notification.js';

export class DMXPatchResults {
  constructor() {
    this.storageKey = 'patchapapa_state';
    this.patchData = [];
    // Tri par défaut : Univers (croissant), puis Adresse (croissant)
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
  }

  /** Charge et parse le HTML du localStorage pour en extraire les données */
  loadFromStorage() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      this.parseHTMLToData(data.html || '');
    } catch (e) { 
      console.error("Erreur de chargement des données:", e); 
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
        channels: parseInt(spans[3].textContent) || 0
      };
    });
  }

  /** Mise à jour des filtres : Univers réels et Noms de modèles uniques sans numéros */
  updateFilterUI() {
    const univSelect = document.getElementById('universe-filter');
    const nameInput = document.getElementById('name-filter');

    if (this.patchData.length === 0) return;

    // 1. Univers dynamiques
    const universes = [...new Set(this.patchData.map(d => d.universe))].sort((a,b) => a - b);
    if (univSelect) {
      univSelect.innerHTML = '<option value="all">Tous les univers</option>' + 
        universes.map(u => `<option value="${u}">Univers ${u}</option>`).join('');
    }

    // 2. Suggestions de noms épurées (ex: "Aura 12" -> "Aura")
    const baseNames = [...new Set(this.patchData.map(d => {
      // Regex : supprime l'espace suivi de chiffres à la fin du nom
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

    // 2. TRI NATUREL (L'intelligence du classement)
    filtered.sort((a, b) => {
      const valA = a[this.currentSort.key];
      const valB = b[this.currentSort.key];
      
      // Si on trie par nom, on utilise le mode "numeric" pour que 2 vienne avant 10
      if (this.currentSort.key === 'name') {
        return this.currentSort.asc 
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
      }

      // Pour les chiffres (univers, adresse, canaux)
      return this.currentSort.asc ? valA - valB : valB - valA;
    });

    // 3. Rendu HTML
    tbody.innerHTML = filtered.map(d => `
      <tr>
        <td>${d.name}</td>
        <td>Univers ${d.universe}</td>
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

    const getFreshData = () => {
      this.loadFromStorage();
      return this.patchData;
    };

    csvBtn?.addEventListener('click', () => {
      const data = getFreshData();
      if (data.length === 0) return showToast("Patch vide", 2000);
      let csv = "Nom;Univers;Depart;Fin;Canaux\n";
      data.forEach(d => {
        csv += `${d.name};${d.universe};${d.address};${d.endAddress};${d.channels}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Patch_DMX_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`;
      link.click();
    });

    emailBtn?.addEventListener('click', async () => {
      const data = getFreshData();
      if (data.length === 0) return showToast("Patch vide", 2000);
      try {
        const { generatePlainTextEmail } = await import('./emailFormatter.js');
        const body = generatePlainTextEmail(data);
        const subject = encodeURIComponent(`Patch DMX - ${new Date().toLocaleDateString()}`);
        window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
      } catch (err) {
        showToast("Erreur d'envoi", 2000);
      }
    });
  }
}
