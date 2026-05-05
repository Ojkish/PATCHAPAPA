// js/projects.js

import { showToast } from './notification.js';

export class DMXProjects {

  constructor() {
    this.storageKey     = 'patchapapa_state';      // clé du patch en cours
    this.indexKey       = 'patchapapa_projects_index';
    this.projectPrefix  = 'patchapapa_project_';
    this.init();
  }

  init() {
    document.getElementById('saveProjectButton')
      .addEventListener('click', () => this.askProjectName());
      this.renderList();
  }

  // ── SAISIE DU NOM ─────────────────────────────────────────────────────────

askProjectName() {
  const modal   = document.getElementById('custom-modal');
  const title   = document.getElementById('modal-title');
  const message = document.getElementById('modal-message');
  const confirm = document.getElementById('modal-confirm');
  const cancel  = document.getElementById('modal-cancel');

  title.textContent = '💾 Sauvegarder le projet';
  message.innerHTML = `
    <input type="text" id="project-name-input" 
      placeholder="Nom du projet (ex: Concert Nantes)"
      style="width:100%; margin-top:10px;">
  `;
  modal.classList.remove('hidden');

setTimeout(() => {
  const input = document.getElementById('project-name-input');
  if (input) {
    input.focus();
    input.select();
  }
}, 100);

  const onConfirm = () => {
    const name = document.getElementById('project-name-input')?.value.trim();
    cleanup();
    this.saveProject(name);
  };
  const onCancel = () => cleanup();

  const cleanup = () => {
    confirm.removeEventListener('click', onConfirm);
    cancel.removeEventListener('click', onCancel);
    modal.classList.add('hidden');
  };

  confirm.addEventListener('click', onConfirm);
  cancel.addEventListener('click', onCancel);
}


  // ── SAUVEGARDE ────────────────────────────────────────────────────────────

  saveProject(name) {

// Nom vide → erreur
if (!name) {
  showToast('⚠️ Merci de saisir un nom pour le projet.', 2500);
  this.askProjectName(); // On rouvre la modale
  return;
}



    const index = this.getIndex();

// Nom déjà utilisé → erreur + on rouvre la saisie
if (index.includes(name)) {
  showToast(`⚠️ Le nom "${name}" existe déjà, choisis un autre nom.`, 2500);
  this.askProjectName();
  return;
}
    this.doSave(name);
  }


  doSave(name) {
    // Récupère l'état du patch en cours
    const currentState = localStorage.getItem(this.storageKey);
    if (!currentState) {
      showToast('Patch vide, rien à sauvegarder.', 2500);
      return;
    }

    // Sauvegarde le projet
    localStorage.setItem(
      this.projectPrefix + name,
      JSON.stringify({ name, date: new Date().toLocaleDateString(), state: currentState })
    );

    // Met à jour l'index
    const index = this.getIndex().filter(n => n !== name);
    index.unshift(name); // Le plus récent en premier
    localStorage.setItem(this.indexKey, JSON.stringify(index));

    showToast(`✅ Projet "${name}" sauvegardé !`, 2500);
    this.renderList();
  }

  // ── INDEX ─────────────────────────────────────────────────────────────────

  getIndex() {
    try {
      return JSON.parse(localStorage.getItem(this.indexKey) || '[]');
    } catch(e) {
      return [];
    }
  }

  // ── AFFICHAGE DE LA LISTE (vide pour l'instant) ───────────────────────────

renderList() {
  const container = document.getElementById('projects-list');
  const index     = this.getIndex();

  if (index.length === 0) {
    container.innerHTML = `<p style="text-align:center; opacity:0.6;">Aucun projet sauvegardé.</p>`;
    return;
  }

  container.innerHTML = index.map(name => {
    const raw  = localStorage.getItem(this.projectPrefix + name);
    const proj = raw ? JSON.parse(raw) : {};
    return `
      <div class="project-card">
        <div class="project-info">
          <strong>${name}</strong>
          <small>${proj.date || ''}</small>
        </div>
        <div class="project-actions">
          <button class="action-button primary btn-load"   data-name="${name}">📂</button>
          <button class="action-button secondary btn-rename" data-name="${name}">✏️</button>
          <button class="action-button secondary btn-delete" data-name="${name}">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  // On branche les boutons après avoir injecté le HTML
  container.querySelectorAll('.btn-load').forEach(btn =>
    btn.addEventListener('click', () => this.loadProject(btn.dataset.name))
  );
  container.querySelectorAll('.btn-rename').forEach(btn =>
    btn.addEventListener('click', () => this.renameProject(btn.dataset.name))
  );
  container.querySelectorAll('.btn-delete').forEach(btn =>
    btn.addEventListener('click', () => this.deleteProject(btn.dataset.name))
  );
}

  // ── CHARGER ───────────────────────────────────────────────────────────────

loadProject(name) {
  const modal   = document.getElementById('custom-modal');
  const title   = document.getElementById('modal-title');
  const message = document.getElementById('modal-message');
  const confirm = document.getElementById('modal-confirm');
  const cancel  = document.getElementById('modal-cancel');

  title.textContent   = '📂 Charger un projet';
  message.textContent = `Charger "${name}" remplacera le patch en cours. Continuer ?`;
  modal.classList.remove('hidden');

  const onConfirm = () => {
    cleanup();
    const raw = localStorage.getItem(this.projectPrefix + name);
    if (!raw) return showToast('Projet introuvable.', 2000);
    const proj = JSON.parse(raw);
    localStorage.setItem(this.storageKey, proj.state);
    showToast(`✅ Projet "${name}" chargé !`, 2500);
    document.getElementById('show-patch').click();
  };
  const onCancel = () => cleanup();

  const cleanup = () => {
    confirm.removeEventListener('click', onConfirm);
    cancel.removeEventListener('click', onCancel);
    modal.classList.add('hidden');
  };

  confirm.addEventListener('click', onConfirm);
  cancel.addEventListener('click', onCancel);
}
// ── RENOMMER ──────────────────────────────────────────────────────────────

renameProject(oldName) {
  const modal   = document.getElementById('custom-modal');
  const title   = document.getElementById('modal-title');
  const message = document.getElementById('modal-message');
  const confirm = document.getElementById('modal-confirm');
  const cancel  = document.getElementById('modal-cancel');

  title.textContent = '✏️ Renommer le projet';
  message.innerHTML = `
    <input type="text" id="project-name-input"
      value="${oldName}"
      style="width:100%; margin-top:10px;">
  `;
  modal.classList.remove('hidden');

setTimeout(() => {
  const input = document.getElementById('project-name-input');
  if (input) {
    input.focus();
    input.select();
  }
}, 100);

  const onConfirm = () => {
    const newName = document.getElementById('project-name-input')?.value.trim();
    cleanup();

    if (!newName) {
      showToast('⚠️ Le nom ne peut pas être vide.', 2500);
      this.renameProject(oldName);
      return;
    }
    if (newName === oldName) return;
    if (this.getIndex().includes(newName)) {
      showToast(`⚠️ Le nom "${newName}" existe déjà.`, 2500);
      this.renameProject(oldName);
      return;
    }

    const raw = localStorage.getItem(this.projectPrefix + oldName);
    if (!raw) return;
    const proj = JSON.parse(raw);
    proj.name = newName;

    localStorage.setItem(this.projectPrefix + newName, JSON.stringify(proj));
    localStorage.removeItem(this.projectPrefix + oldName);

    const newIndex = this.getIndex().map(n => n === oldName ? newName : n);
    localStorage.setItem(this.indexKey, JSON.stringify(newIndex));

    showToast(`✅ Renommé en "${newName}"`, 2500);
    this.renderList();
  };
  const onCancel = () => cleanup();

  const cleanup = () => {
    confirm.removeEventListener('click', onConfirm);
    cancel.removeEventListener('click', onCancel);
    modal.classList.add('hidden');
  };

  confirm.addEventListener('click', onConfirm);
  cancel.addEventListener('click', onCancel);
}

// ── EFFACER ───────────────────────────────────────────────────────────────

deleteProject(name) {
  const modal   = document.getElementById('custom-modal');
  const title   = document.getElementById('modal-title');
  const message = document.getElementById('modal-message');
  const confirm = document.getElementById('modal-confirm');
  const cancel  = document.getElementById('modal-cancel');

  title.textContent   = '🗑️ Effacer le projet';
  message.textContent = `Supprimer définitivement "${name}" ?`;
  modal.classList.remove('hidden');

  const onConfirm = () => {
    cleanup();
    localStorage.removeItem(this.projectPrefix + name);
    const newIndex = this.getIndex().filter(n => n !== name);
    localStorage.setItem(this.indexKey, JSON.stringify(newIndex));
    showToast(`🗑️ Projet "${name}" supprimé.`, 2500);
    this.renderList();
  };
  const onCancel = () => cleanup();

  const cleanup = () => {
    confirm.removeEventListener('click', onConfirm);
    cancel.removeEventListener('click', onCancel);
    modal.classList.add('hidden');
  };

  confirm.addEventListener('click', onConfirm);
  cancel.addEventListener('click', onCancel);
}
}  
// Instanciation au chargement
window.addEventListener('load', () => new DMXProjects());
