// js/results.js

import { showToast } from './notification.js';

export class DMXPatchResults {
  constructor() {
    this.storageKey = 'patchapapa_state';
    this.patchData = []; // Liste des lignes de patch décodées
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.renderTable();
    this.setupFilters();
    this.setupExport();
  }

  /** Charge et décode les données du localStorage */
  loadFromStorage() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      // On utilise le HTML généré ou on reconstruit à partir des données brutes
      // Pour la page résultat, le plus simple est d'extraire les infos du HTML stocké
      // ou de travailler sur une structure de données dédiée.
      this.parseHTMLToData(data.html || '');
    } catch (e) {
      console.error("Erreur lors du chargement des résultats :", e);
    }
  }

  /** Transforme le HTML stocké en objets manipulables pour le filtrage/tri */
  parseHTMLToData(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const items = tempDiv.querySelectorAll('.result-item');

    this.patchData = Array.from(items).map(item => {
      const spans = item.querySelectorAll('span');
      const fullAddressStart = spans[1].textContent.split('.'); // "1.10" -> ["1", "10"]
      
      return {
        name: spans[0].textContent,
        universe: parseInt(fullAddressStart[0]),
        address: parseInt(fullAddressStart[1]),
        endAddress: spans[2].textContent,
        channels: spans[3].textContent
      };
    });
  }

  /** Affiche le tableau dans le DOM */
  renderTable(filterName = '', filterUniv = 'all') {
    const tbody = document.querySelector('#results-table tbody');
    if (!tbody) return;

    const filtered = this.patchData.filter(d => {
      const matchName = d.name.toLowerCase().includes(filterName.toLowerCase());
      const matchUniv = filterUniv === 'all' || d.universe === parseInt(filterUniv);
      return matchName && matchUniv;
    });

    tbody.innerHTML = filtered.map(d => `
      <tr>
        <td>${d.name}</td>
        <td>Univ ${d.universe}</td>
        <td>${d.address}</td>
        <td>${d.endAddress}</td>
        <td>${d.channels}</td>
      </tr>
    `).join('');
  }

  setupFilters() {
    const nameInput = document.getElementById('name-filter');
    const univSelect = document.getElementById('universe-filter');

    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        this.renderTable(e.target.value, univSelect.value);
      });
    }

    if (univSelect) {
      univSelect.addEventListener('change', (e) => {
        this.renderTable(nameInput.value, e.target.value);
      });
    }
  }

  setupExport() {
    const exportBtn = document.getElementById('export-csv');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => {
      if (this.patchData.length === 0) {
        showToast("Rien à exporter", 2000);
        return;
      }

      let csv = "Nom;Univers;Depart;Fin;Canaux\n";
      this.patchData.forEach(d => {
        csv += `${d.name};${d.universe};${d.address};${d.endAddress};${d.channels}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "patch_dmx.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
}

// L'instanciation est gérée par le switch de section dans patcher.js
