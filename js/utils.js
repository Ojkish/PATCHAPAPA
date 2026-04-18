// js/utils.js

/**
 * Lit et convertit la valeur d'un champ input numérique en entier.
 */
export function getValidInt(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const val = parseInt(el.value, 10);
  return isNaN(val) ? null : val;
}

/**
 * Configure les contrôles de type "+" / "-" avec retour visuel et défilement calibré.
 */
export function setupNumberControls(selector) {
  const buttons = document.querySelectorAll(selector);

  buttons.forEach(btn => {
    let timer = null;
    let initialDelayTimer = null;
    let currentInterval = 250; // Vitesse de départ plus calme (250ms)

    const targetId = btn.dataset.target;
    const action = btn.dataset.action;
    const target = document.getElementById(targetId);

    if (!target) return;

    /** Exécute une modification et produit un retour visuel */
    const adjust = () => {
      let v = parseInt(target.value, 10) || 0;
      const min = parseInt(target.getAttribute('min'), 10) || 1;
      const max = parseInt(target.getAttribute('max'), 10) || 512;

      if (action === 'increment') {
        v = v < max ? v + 1 : v;
      } else {
        v = v > min ? v - 1 : min;
      }
      target.value = v;

      // --- RETOUR VISUEL (Alternative Haptique iPhone) ---
      // On simule une pression physique sur le bouton
      btn.style.transform = "scale(0.85)";
      setTimeout(() => { btn.style.transform = "scale(1)"; }, 60);

      // Notification des changements
      target.dispatchEvent(new Event('input', { bubbles: true }));
      if (targetId === 'universe') {
        target.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    /** Gestion du défilement avec accélération progressive */
    const startEffect = (e) => {
      if (e.type === 'touchstart') e.preventDefault();
      
      adjust(); // Action immédiate au premier contact

      initialDelayTimer = setTimeout(() => {
        const loop = () => {
          adjust();
          // Accélération ralentie (0.9 au lieu de 0.8)
          // Minimum bloqué à 70ms pour ne pas perdre le contrôle sur mobile
          currentInterval = Math.max(70, currentInterval * 0.9);
          timer = setTimeout(loop, currentInterval);
        };
        loop();
      }, 450); // Attend 450ms avant de commencer à défiler
    };

    const stopEffect = () => {
      clearTimeout(timer);
      clearTimeout(initialDelayTimer);
      timer = null;
      initialDelayTimer = null;
      currentInterval = 250;
    };

    btn.addEventListener('mousedown', startEffect);
    btn.addEventListener('touchstart', startEffect, { passive: false });

    window.addEventListener('mouseup', stopEffect);
    window.addEventListener('touchend', stopEffect);
    window.addEventListener('touchcancel', stopEffect);
    btn.addEventListener('click', e => e.preventDefault());
  });
}

/**
 * Applique un flash visuel temporaire à un élément (ex: bouton Patch ou nouvel item).
 * @param {HTMLElement} el - L'élément à animer
 * @param {string} className - La classe CSS d'animation (ex: 'btn-patch-active')
 */
export function flashElement(el, className, duration = 200) {
  if (!el) return;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), duration);
}

/**
 * Récupère et parse une valeur JSON stockée dans localStorage.
 */
export function getFromLocalStorage(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Erreur de parsing JSON: ${key}`, e);
    return null;
  }
}

/**
 * Sérialise et stocke un objet dans localStorage.
 */
export function saveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Erreur de stockage: ${key}`, e);
  }
}

/**
 * Crée un élément DOM avec des propriétés et des enfants.
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
