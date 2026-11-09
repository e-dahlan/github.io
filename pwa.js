(() => {
  'use strict';
  const isArabic = document.documentElement.lang === 'ar' || location.pathname.startsWith('/ar/');
  const prefix = isArabic ? '/ar' : '';
  const standaloneMedia = window.matchMedia('(display-mode: standalone)');
  const mobileMedia = window.matchMedia('(max-width: 768px)');
  const standalone = () => standaloneMedia.matches || navigator.standalone === true;

  try {
    const previouslySelected = localStorage.getItem('portfolio-language');
    if (standalone() && location.pathname === '/' && previouslySelected === 'ar') {
      location.replace('/ar/');
      return;
    }
    localStorage.setItem('portfolio-language', isArabic ? 'ar' : 'en');
  } catch (_) {}

  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(error => console.info('Offline mode unavailable:', error.message));
    });
  }

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a.lang-switch');
    if (!link) return;
    try { localStorage.setItem('portfolio-language', isArabic ? 'en' : 'ar'); } catch (_) {}
  });

  function selectedTab() {
    const path = location.pathname.replace(/^\/ar(?=\/)/, '');
    if (path === '/resume.html') return 'resume';
    if (path === '/contact.html') return 'contact';
    if (path === '/projects.html' || path.startsWith('/projects/')) return 'projects';
    return 'home';
  }

  function updateAppMode() {
    const app = standalone() && mobileMedia.matches;
    document.documentElement.classList.toggle('app-mode', app);
    const old = document.getElementById('app-bottom-nav');
    if (!app) { if (old) old.remove(); return; }
    if (old || !document.body) return;

    const nav = document.createElement('nav');
    nav.id = 'app-bottom-nav';
    nav.className = 'app-bottom-nav';
    nav.setAttribute('aria-label', isArabic ? 'تنقل التطبيق' : 'App navigation');

    const current = selectedTab();
    const tabs = [
      { id:'home', text:isArabic?'الرئيسية':'Home', icon:'fa-house', url:prefix+'/' },
      { id:'resume', text:isArabic?'السيرة':'Resume', icon:'fa-file-lines', url:prefix+'/resume.html' },
      { id:'projects', text:isArabic?'المشاريع':'Projects', icon:'fa-briefcase', url:prefix+'/projects.html' },
      { id:'contact', text:isArabic?'التواصل':'Contact', icon:'fa-envelope', url:prefix+'/contact.html' }
    ];
    for (const tab of tabs) {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAppMode, { once:true });
  } else updateAppMode();

  standaloneMedia.addEventListener?.('change', updateAppMode);
  mobileMedia.addEventListener?.('change', updateAppMode);
})();