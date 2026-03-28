export function showModal(title: string, bodyHTML: string, actions: { label: string; className: string; onClick: () => void }[]): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const actionsHTML = actions
    .map((a, i) => `<button class="${a.className}" data-idx="${i}">${a.label}</button>`)
    .join('');

  overlay.innerHTML = `
    <div class="modal-content">
      <h3>${title}</h3>
      ${bodyHTML}
      <div class="modal-actions">${actionsHTML}</div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
    const btn = (e.target as HTMLElement).closest('button[data-idx]');
    if (btn) {
      const idx = parseInt(btn.getAttribute('data-idx')!);
      actions[idx].onClick();
      overlay.remove();
    }
  });

  document.body.appendChild(overlay);
  return overlay;
}

export function removeModal() {
  document.querySelector('.modal-overlay')?.remove();
}
