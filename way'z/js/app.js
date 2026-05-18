/* ============================================
   WAY'Z — Global App Utilities
   Auth, toasts, transitions, helpers
   ============================================ */

const WZ_APP = {
  // --- Auth Mock ---
  currentUser: null,
  currentRole: null, // 'rider' | 'driver' | 'admin'
  theme: 'dark',

  init() {
    this.loadSession();
    this.initTheme();
    this.initScrollReveal();
    this.initRippleButtons();
    this.initMagneticElements();
    this.initNavbar();
  },

  login(role, userId) {
    this.currentRole = role;
    if (role === 'rider') this.currentUser = WZ_DATA.riders.find(r => r.id === userId) || WZ_DATA.riders[0];
    else if (role === 'driver') this.currentUser = WZ_DATA.drivers.find(d => d.id === userId) || WZ_DATA.drivers[0];
    else this.currentUser = { id: 'admin1', name: 'Admin', email: 'admin@wayz.lb' };
    localStorage.setItem('wz_role', role);
    localStorage.setItem('wz_userId', this.currentUser.id);
    this.showToast('Welcome back, ' + this.currentUser.name + '!', 'success');
  },

  logout() {
    this.currentUser = null;
    this.currentRole = null;
    localStorage.removeItem('wz_role');
    localStorage.removeItem('wz_userId');
    window.location.href = '/index.html';
  },

  loadSession() {
    const role = localStorage.getItem('wz_role');
    const userId = localStorage.getItem('wz_userId');
    if (role && userId) {
      this.currentRole = role;
      if (role === 'rider') this.currentUser = WZ_DATA.riders.find(r => r.id === userId);
      else if (role === 'driver') this.currentUser = WZ_DATA.drivers.find(d => d.id === userId);
      else this.currentUser = { id: 'admin1', name: 'Admin', email: 'admin@wayz.lb' };
    }
  },

  initTheme() {
    const stored = localStorage.getItem('wz_theme');
    const theme = stored || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    this.setTheme(theme, true);
  },

  setTheme(theme, silent = false) {
    if (!document.body) return;
    this.theme = theme === 'light' ? 'light' : 'dark';
    document.body.classList.toggle('theme-light', this.theme === 'light');
    localStorage.setItem('wz_theme', this.theme);
    if (!silent) this.showToast(`Switched to ${this.theme} theme`, 'success');
  },

  toggleTheme() {
    this.setTheme(this.theme === 'light' ? 'dark' : 'light');
  },

  isLoggedIn() { return this.currentUser !== null; },

  // --- Toast Notifications ---
  showToast(message, type = 'info', duration = 4000) {
    let container = document.querySelector('.wz-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'wz-toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const colors = { success: 'var(--wz-success)', error: 'var(--wz-error)', warning: 'var(--wz-warning)', info: 'var(--wz-info)' };
    const toast = document.createElement('div');
    toast.className = 'wz-toast';
    toast.innerHTML = `<span style="color:${colors[type]};font-size:18px;font-weight:700">${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease-in forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // --- Scroll Reveal (FIXED: Triggers much earlier now) ---
  initScrollReveal() {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');
    if (!els.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          observer.unobserve(e.target);
        }
      });
    }, { 
      threshold: 0.05, // Only requires 5% of the element to be visible
      rootMargin: '0px 0px 100px 0px' // Triggers 100px BEFORE it even enters the viewport
    });
    els.forEach(el => observer.observe(el));
  },

  // --- Ripple Effect on Buttons ---
  initRippleButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.wz-btn');
      if (!btn) return;
      const ripple = document.createElement('span');
      ripple.className = 'wz-ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  },

  // --- Magnetic Hover ---
  initMagneticElements() {
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  },

  // --- Navbar scroll effect ---
  initNavbar() {
    const nav = document.querySelector('.wz-navbar');
    if (!nav) return;
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const curr = window.scrollY;
      if (curr > 80) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
      if (curr > lastScroll && curr > 200) nav.classList.add('hidden');
      else nav.classList.remove('hidden');
      lastScroll = curr;
    });
  },

  // --- Page Navigate with Transition ---
  navigateTo(url) {
    const overlay = document.createElement('div');
    overlay.className = 'wz-page-transition';
    overlay.innerHTML = '<div class="wz-loader-logo">W</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));
    setTimeout(() => { window.location.href = url; }, 400);
  },

  // --- Helpers ---
  formatCurrency(amount) { return '$' + amount.toFixed(2); },
  formatTime(minutes) { return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes/60)}h ${minutes%60}m`; },
  formatDistance(km) { return km < 1 ? `${Math.round(km*1000)}m` : `${km.toFixed(1)} km`; },
  formatRating(rating) { return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : ''); },
  
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  },

  animateCounter(el, target, duration = 2000) {
    let start = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  },

  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Generate star rating HTML
  starsHTML(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) html += '<span class="star filled">★</span>';
      else if (i - 0.5 <= rating) html += '<span class="star half">★</span>';
      else html += '<span class="star empty">☆</span>';
    }
    return html;
  }
};

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', () => WZ_APP.init());

// Register Service Worker for PWA (Native App feel)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = window.location.pathname.includes('/rider/') || window.location.pathname.includes('/driver/') || window.location.pathname.includes('/admin/') 
      ? '../service-worker.js' 
      : 'service-worker.js';
      
    navigator.serviceWorker.register(swPath)
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.log('Service Worker registration failed', err));
  });
}

window.WZ_APP = WZ_APP;