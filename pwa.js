
(() => {
  'use strict';
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope:'/', updateViaCache:'none' })
        .catch(err => console.info('Offline mode unavailable:', err.message));
    });
  }

  const standaloneMedia = window.matchMedia('(display-mode: standalone)');
  const mobileMedia = window.matchMedia('(max-width: 768px)');
  function selectedTab() {
    const path = location.pathname;
    if (path === '/resume.html') return 'resume';
    if (path === '/contact.html') return 'contact';
    if (path === '/projects.html' || path.startsWith('/projects/')) return 'projects';
    return 'home';
  }

  function updateAppMode() {
    const app = (standaloneMedia.matches || navigator.standalone === true) && mobileMedia.matches;
    document.documentElement.classList.toggle('app-mode', app);
    const old = document.getElementById('app-bottom-nav');
    if (!app) { if (old) old.remove(); return; }
    if (old || !document.body) return;

    const nav = document.createElement('nav');
    nav.id = 'app-bottom-nav';
    nav.className = 'app-bottom-nav';
    nav.setAttribute('aria-label', 'App navigation');

    const current = selectedTab();
    for (const tab of [
      { id:'home', text:'Home', icon:'fa-house', url:'/' },
      { id:'resume', text:'Resume', icon:'fa-file-lines', url:'/resume.html' },
      { id:'projects', text:'Projects', icon:'fa-briefcase', url:'/projects.html' },
      { id:'contact', text:'Contact', icon:'fa-envelope', url:'/contact.html' }
    ]) {
      const link = document.createElement('a');
      link.href = tab.url;
      link.className = 'app-nav-tab' + (tab.id === current ? ' is-active' : '');
      if (tab.id === current) link.setAttribute('aria-current', 'page');
      const icon = document.createElement('i');
      icon.className = 'fa-solid ' + tab.icon;
      icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = tab.text;
      link.append(icon, label);
      nav.appendChild(link);
    }
    document.body.appendChild(nav);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', updateAppMode, { once:true });
  else updateAppMode();
  standaloneMedia.addEventListener?.('change', updateAppMode);
  mobileMedia.addEventListener?.('change', updateAppMode);
})();
