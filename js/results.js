// js/results.js

import { showToast } from './notification.js';

export class DMXPatchResults {
  constructor() {
    this.storageKey = 'patchapapa_state';
    this.patchData = []; // Données brutes pour le filtrage et l'export
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.renderTable();
    this.setupFilters();
    this.setupExport();
  }

  /** Charge les données du localStorage et les transforme en objets JS */
  loadFromStorage() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) {
      this.patchData = [];
      return;
    }

    try {
      const data = JSON.parse(saved);
      // On parse le HTML stocké pour reconstruire nos objets de données
      this.parseHTMLToData(data.html || '');
    } catch (e) {
      console.error("Erreur lecture storage:", e);
      this.patchData = [];
    }
  }

  /** Transforme les balises HTML du patch en données exploitables */
  parseHTMLToData(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const items = doc.querySelectorAll('.result-item');

    this.patchData = Array.from(items).map(item => {
      const spans = item.querySelectorAll('span');
      // spans[1] contient "1.10" (Univ.Addr)
      const fullStart = spans[1].textContent.split('.');
      
      return {
        name: spans[0].textContent.trim(),
        universe: parseInt(fullStart[0]) || 1,
        address: parseInt(fullStart[1]) || 1,
        endAddress: spans[2].textContent.trim(),
        channels: spans[3].textContent.replace('CH', '').trim()
      };
    });
  }

  /** Affiche le tableau avec filtres optionnels */
  renderTable(filterName = '', filterUniv = 'all') {
    const tbody = document.querySelector('#results-table tbody');
    if (!tbody) return;

    const filtered = this.patchData.filter(d => {
      const matchName = d.name.toLowerCase().includes(filterName.toLowerCase());
      const matchUniv = filterUniv === 'all' || d.universe === parseInt(filterUniv);
      return matchName && matchUniv;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Aucun résultat trouvé</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(d => `
      <tr>
        <td>${d.name}</td>
        <td>Univers ${d.universe}</td>
        <td>${d.address}</td>
        <td>${d.endAddress}</td>
        <td>${d.channels} CH</td>
      </tr>
    `).join('');
  }

  /** Configure la recherche temps réel */
  setupFilters() {
    const nameInput = document.getElementById('name-filter');
    const univSelect = document.getElementById('universe-filter');

    const update = () => this.renderTable(nameInput?.value || '', univSelect?.value || 'all');

    nameInput?.addEventListener('input', update);
    univSelect?.addEventListener('change', update);
  }

  /** Gère le CSV et l'Email en se basant sur les données fraîches */
  setupExport() {
    const csvBtn = document.getElementById('export-csv');
    const emailBtn = document.getElementById('send-email');

    // Fonction interne pour garantir qu'on exporte les données à jour
    const getFreshData = () => {
      this.loadFromStorage();
      return this.patchData;
    };

    // --- LOGIQUE CSV ---
    csvBtn?.addEventListener('click', () => {
      const data = getFreshData();
      if (data.length === 0) return showToast("Patch vide", 2000);

      let csv = "Nom;Univers;Adresse_Depart;Adresse_Fin;Canaux\n";
      data.forEach(d => {
        csv += `${d.name};${d.universe};${d.address};${d.endAddress};${d.channels}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Patch_DMX_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
      link.click();
      showToast("Fichier CSV prêt", 2000);
    });

    // --- LOGIQUE EMAIL ---
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
