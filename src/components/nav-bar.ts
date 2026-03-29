import { getState, setState } from '../state';
import { navigate } from '../router';

export function renderNavBar(container: HTMLElement) {
  const state = getState();

  const guestItems = [
    { label: 'Request', icon: '📝', hash: '/guest' },
  ];

  const memberItems = [
    { label: 'Queue', icon: '📋', hash: '/' },
    { label: 'My Requests', icon: '✅', hash: '/accepted' },
    { label: 'Scan', icon: '📷', hash: '/scan' },
  ];

  const items = state.isGuestMode ? guestItems : memberItems;
  const currentHash = window.location.hash.slice(1) || (state.isGuestMode ? '/guest' : '/');

  const nav = document.createElement('nav');
  nav.className = 'nav-bar';

  // Mode toggle
  const toggle = document.createElement('div');
  toggle.className = 'mode-toggle';
  toggle.innerHTML = `
    <button class="mode-btn ${state.isGuestMode ? 'active' : ''}" data-mode="guest">Guest</button>
    <button class="mode-btn ${!state.isGuestMode ? 'active' : ''}" data-mode="member">Member</button>
  `;
  toggle.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = (btn as HTMLElement).dataset.mode;
      const isGuest = mode === 'guest';
      setState({ isGuestMode: isGuest });
      navigate(isGuest ? '/guest' : '/');
    });
  });

  // Nav items
  const navItems = document.createElement('div');
  navItems.className = 'nav-items';

  items.forEach((item) => {
    const btn = document.createElement('button');
    const isActive =
      item.hash === '/' || item.hash === '/guest'
        ? currentHash === item.hash
        : currentHash.startsWith(item.hash);
    btn.className = `nav-item${isActive ? ' active' : ''}`;
    btn.innerHTML = `<span class="nav-icon">${item.icon}</span>${item.label}`;
    btn.addEventListener('click', () => navigate(item.hash));
    navItems.appendChild(btn);
  });

  nav.appendChild(toggle);
  nav.appendChild(navItems);

  // Remove old nav if present
  const existing = container.querySelector('.nav-bar');
  if (existing) existing.remove();
  container.appendChild(nav);
}
