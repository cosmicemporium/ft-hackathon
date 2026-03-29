import { getState } from '../state';
import { getAllRequests } from '../sdk';
import { navigate } from '../router';
import { STATUS_COLORS, TYPE_LABELS, TYPE_ICONS, formatSlot, capitalize } from '../utils';

export async function renderMyAccepted(container: HTMLElement) {
  const state = getState();
  container.innerHTML = '<div class="page"><div class="spinner"></div></div>';

  try {
    const allRequests = await getAllRequests();
    const myRequests = allRequests.filter(
      (r) => r.acceptedById === state.userId && ['accepted', 'proposed', 'completed'].includes(r.status)
    );

    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1>My Requests</h1>
        </div>

        <div id="my-list"></div>

        ${myRequests.length === 0
          ? '<div class="empty-state"><p>No accepted requests yet. Check the queue!</p></div>'
          : ''}
      </div>
    `;

    const listEl = container.querySelector('#my-list')!;
    myRequests.forEach((req) => {
      const statusColor = STATUS_COLORS[req.status];
      const slot = req.selectedSlot || req.proposedSlot;
      const card = document.createElement('div');
      card.className = 'referral-card';
      card.innerHTML = `
        <div class="referral-card-header">
          <span class="referral-card-name">${req.guestName}</span>
          <span class="status-badge" style="background: ${statusColor}20; color: ${statusColor}">
            ${capitalize(req.status)}
          </span>
        </div>
        <div class="referral-card-meta">
          <span class="type-badge">${TYPE_ICONS[req.type]} ${TYPE_LABELS[req.type]}</span>
        </div>
        ${slot ? `<div style="margin-top: 8px; font-size: 13px; color: var(--text-secondary);">${formatSlot(slot)}</div>` : ''}
        ${req.status === 'completed' && req.rewardAmount ? `
          <div style="margin-top: 6px; font-size: 13px; color: var(--success);">
            +$${req.rewardAmount} ${req.rewardCurrency}
          </div>
        ` : ''}
      `;
      card.addEventListener('click', () => navigate(`/request/${req.id}`));
      listEl.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<div class="page"><div class="empty-state"><p>Failed to load. ${err}</p></div></div>`;
  }
}
