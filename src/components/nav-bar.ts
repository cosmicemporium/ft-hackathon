import { getState } from '../state';
import { navigate } from '../router';

export function renderNavBar(container: HTMLElement) {
  const state = getState();

  const items = [
    { label: 'Dashboard', icon: '📊', hash: '/' },
    { label: 'Refer', icon: '➕', hash: '/create' },
  ];

  if (state.isAdmin) {
    items.push({ label: 'Admin', icon: '⚙️', hash: '/admin' });
  }

  const nav = document.createElement('nav');
  nav.className = 'nav-bar';

  const currentHash = window.location.hash.slice(1) || '/';

  items.forEach((item) => {
    const btn = document.createElement('button');
    const isActive =
      item.hash === '/'
        ? currentHash === '/'
        : currentHash.startsWith(item.hash);
    btn.className = `nav-item${isActive ? ' active' : ''}`;
    btn.innerHTML = `<span class="nav-icon">${item.icon}</span>${item.label}`;
    btn.addEventListener('click', () => navigate(item.hash));
    nav.appendChild(btn);
  });

  // Remove old nav if present
  const existing = container.querySelector('.nav-bar');
  if (existing) existing.remove();
  container.appendChild(nav);
}
