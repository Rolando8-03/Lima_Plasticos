// Lima Plásticos - App Shell
(function() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  function showTab(id) {
    panels.forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${id}"]`).classList.add('active');
  }

  tabs.forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
  showTab('inventario');

  // Global app state helpers
  window.LP = window.LP || {};
  LP.storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : (fallback ?? null);
      } catch (e) { return fallback ?? null; }
    },
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  };

  // App init hooks from modules
  document.addEventListener('DOMContentLoaded', () => {
    if (LP.inventory && LP.inventory.init) LP.inventory.init();
    if (LP.billing && LP.billing.init) LP.billing.init();
    if (LP.reports && LP.reports.init) LP.reports.init();
  });
})();