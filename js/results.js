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

    // Tri au clic sur les en-têtes
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

    const tmp = document.createElement('div');
    tmp.innerHTML = rawHTML;

    this.results = Array.from(tmp.querySelectorAll('.result-item')).map(it => {
      const name = it.querySelector('span:first-child strong').textContent.trim();
      const typeMatch = name.match(/(.+)\s+\d+$/);
      const type = typeMatch ? typeMatch[1] : name;
      const [u, s] = it.querySelector('.address-start').textContent.split('.').map(Number);
      const [_, e] = it.querySelector('.address-end').textContent.split('.').map(Number);
      const ch = parseInt(it.querySelector('span:last-child').textContent.replace('CH', ''), 10);
      return { name, type, universe: u, startAddress: s, endAddress: e, channels: ch };
    });

    // Suggestions de types
    const uniqueTypes = [...new Set(this.results.map(r => r.type))]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    const dataList = document.getElementById('name-suggestions');
    if (dataList) dataList.innerHTML = '';
    uniqueTypes.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      dataList.appendChild(opt);
    });

    // Univers uniques triés
    const uniqueUniverses = [...new Set(this.results.map(r => r.universe))].sort((a, b) => a - b);
    this.uFilter.innerHTML = '<option value="">Tous les univers</option>';
    uniqueUniverses.forEach(u => {
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
      // Adresse de début avec univers en petit
      const start = `<span class="universe small">${r.universe}</span>.` +
                    `<span class="address highlight">${r.startAddress}</span>`;
      // Adresse de fin : seulement le numéro, style normal
      const end = `<span class="address end">${r.endAddress}</span>`;
      tr.innerHTML =
        `<td>${r.name}</td>` +
        `<td class="address-cell start-cell">${start}</td>` +
        `<td class="address-cell end-cell">${end}</td>` +
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
      let diff;
      if (col === 'name') {
        diff = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (col === 'startAddress') {
        diff = a.universe - b.universe || a.startAddress - b.startAddress;
      } else if (col === 'endAddress') {
        diff = a.universe - b.universe || a.endAddress - b.endAddress;
      } else {
        diff = a[col] - b[col];
      }
      return dir === 'asc' ? diff : -diff;
    });

    this.currentSort = { column: col, direction: dir };
    this.applyFilters();
  }

  applyFilters() {
    const nf = this.nFilter.value.toLowerCase();
    const uf = this.uFilter.value;
    const filtered = this.results.filter(r =>
      r.type.toLowerCase().includes(nf) &&
      (!uf || r.universe === parseInt(uf, 10))
    );
    this.render(filtered);
  }

  exportCSV() {
    // Construction du CSV avec en-tête adapté et adresses fusionnées
    const header = ['Nom', 'Adresse Début', 'Adresse Fin', 'Canaux'];

    const rows = this.results.map(r => [
      r.name,
      `${r.universe}.${r.startAddress}`,
      `${r.universe}.${r.endAddress}`,
      r.channels
    ]);

    const csvContent = [header, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'patch_results.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  sendEmail() {
    const body = generatePlainTextEmail(this.results);
    const subject = 'Résultats du Patch DMX';
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}
