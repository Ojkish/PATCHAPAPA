// notification de la reussite du patch
export function showToast(message, duration = 3000) {
    let t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    document.body.appendChild(t);
    // forcer le layout pour activer la transition
    void t.offsetWidth;
    t.classList.add('show');
    setTimeout(() => {
      t.classList.remove('show');
      // nettoyage
      t.addEventListener('transitionend', () => t.remove(), { once: true });
    }, duration);
  }
  
  