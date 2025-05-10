// js/utils.js

/**
 * Lit et convertit la valeur d'un champ input numérique en entier.
 * @param {string} id - ID de l'élément <input>
 * @returns {number|null} - la valeur entière ou null si invalide
 */
export function getValidInt(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const val = parseInt(el.value, 10);
  return isNaN(val) ? null : val;
}

/**
 * Configure les contrôles de type "+" / "-" pour incrémenter ou décrémenter
 * la valeur d'un champ input.
 * @param {string} selector - sélecteur CSS pour les boutons de contrôle
 */
export function setupNumberControls(selector) {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const action = btn.dataset.action;
      const targetId = btn.dataset.target;
      const target = document.getElementById(targetId);
      if (!target) return;
      let v = parseInt(target.value, 10) || 0;
      v = action === 'increment' ? v + 1 : Math.max(1, v - 1);
      target.value = v;
      // Si on modifie l'univers, on peut déclencher un événement custom
      if (targetId === 'universe') {
        const evt = new Event('change');
        target.dispatchEvent(evt);
      }
    });
  });
}

/**
 * Récupère et parse une valeur JSON stockée dans localStorage.
 * @param {string} key - clé de stockage
 * @returns {any|null} - objet désérialisé ou null si inexistant
 */
export function getFromLocalStorage(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Erreur de parsing JSON pour la clé ${key}:`, e);
    return null;
  }
}

/**
 * Sérialise et stocke un objet dans localStorage.
 * @param {string} key - clé de stockage
 * @param {any} value - valeur à stocker
 */
export function saveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Erreur de stockage localStorage pour la clé ${key}:`, e);
  }
}

/**
 * Crée un élément DOM avec des propriétés et des enfants.
 * @param {string} tag - nom de la balise
 * @param {object} props - attributs et écouteurs d'événements
 * @param {Array<HTMLElement|string>} children - enfants à ajouter
 * @returns {HTMLElement}
 */
export function createElement(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.substring(2).toLowerCase(), value);
    } else if (key in el) {
      el[key] = value;
    } else {
      el.setAttribute(key, value);
    }
  });
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else el.appendChild(child);
  });
  return el;
}
