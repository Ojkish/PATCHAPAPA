// js/results.js

import { generatePlainTextEmail } from './emailFormatter.js';
import { getFromLocalStorage } from './utils.js';

/**
 * Classe gérant l'affichage des résultats du patch DMX,
 * avec tri, filtre, export CSV et envoi email.
 */
export class DMXPatchResults {
  constructor() {
    this.currentSort = { column: null, direction: 'asc' };
    this.initElements();
    this.loadResults();
  }

  initElements() {
    this.body = document.getElementById('results-body');
    this.nFilter = document.getElementById('name-filter');
    this.uFilter = document.getElementById('universe-filter');
    this.csvBtn = document.getElementById('export-csv');
    this.emailBtn = document.getElementById('send-email');

    // Tri au clic
    document.querySelectorAll('#results-table th').forEach(th => {
      th.addEventListener('click', e => this.sortBy(e));
    });
    // Filtrage
    this.nFilter.addEventListener('input', () => this.applyFilters());
    this.uFilter.addEventListener('change', () => this.applyFilters());
    // Export et email
    this.csvBtn.addEventListener('click', () => this.exportCSV());
    this.emailBtn.addEventListener('click', () => this.sendEmail());
  }

  loadResults() {
    const rawHTML = getFromLocalStorage('dmx_patch_results');
    if (!rawHTML) return;
    // Reconstruire le DOM temporaire pour parser
    const tmp = document.createElement('div');
    tmp.innerHTML = rawHTML;
    this.results = Array.from(tmp.querySelectorAll('.result-item')).map(it => {
      const nameText = it.querySelector('span:first-child').textContent;
      const name = nameText.match(/.+(?=\s\d+)/)[0] + ' ' + nameText.match(/\d+$/)[0];
      const [u, s] = it.querySelector('.address-start').textContent.split('.').map(Number);
      const [_, e] = it.querySelector('.address-end').textContent.split('.').map(Number);
      const ch = parseInt(it.querySelector('span:last-child').textContent, 10);
      return { name, universe: u, startAddress: s, endAddress: e, channels: ch };
    });
    // Remplir le filtre univers
    [...new Set(this.results.map(r => r.universe))].sort((a,b) => a-b).forEach(u => {
      const opt = document.createElement('option');
      opt.value = u;
      opt.textContent = u;
      this.uFilter.appendChild(opt);
    });
    this.render(this.results);
  }

  render(arr) {
    this.body.innerHTML = '';
    arr.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.name}</td><td>${r.universe}</td>` +
                     `<td>${r.startAddress}</td><td>${r.endAddress}</td>` +
                     `<td>${r.channels}</td>`;
      this.body.appendChild(tr);
    });
  }

  sortBy(e) {
    const col = e.target.dataset.sort;
    const dir = this.currentSort.column === col && this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    document.querySelectorAll('#results-table th')
      .forEach(th => th.classList.remove('sorted-asc', 'sorted-desc'));
    e.target.classList.add(`sorted-${dir}`);
    this.results.sort((a, b) => {
      if (col === 'name') {
        return dir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      return dir === 'asc' ? a[col] - b[col] : b[col] - a[col];
    });
    this.currentSort = { column: col, direction: dir };
    this.applyFilters();
  }

  applyFilters() {
    const nf = this.nFilter.value.toLowerCase();
    const uf = this.uFilter.value;
    const filtered = this.results.filter(r =>
      r.name.toLowerCase().includes(nf) &&
      (!uf || r.universe === parseInt(uf, 10))
    );
    this.render(filtered);
  }

  exportCSV() {
    const header = ['Nom','Univers','Adresse Début','Adresse Fin','Canaux'];
    const rows = this.results.map(r => [r.name, r.universe, r.startAddress, r.endAddress, r.channels]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'patch_results.csv';
    link.click();
  }

  sendEmail() {
    const body = generatePlainTextEmail(this.results);
    const subject = 'Résultats du Patch DMX';
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}
