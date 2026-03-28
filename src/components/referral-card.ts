import type { Referral } from '../types';
import { STATUS_COLORS, TYPE_LABELS, timeAgo, capitalize } from '../utils';
import { navigate } from '../router';

export function renderReferralCard(referral: Referral, isAdmin = false): HTMLElement {
  const card = document.createElement('div');
  card.className = 'referral-card';

  const statusColor = STATUS_COLORS[referral.status];

  card.innerHTML = `
    <div class="referral-card-header">
      <span class="referral-card-name">${referral.prospectName}</span>
      <span class="status-badge" style="background: ${statusColor}20; color: ${statusColor}">
        ${capitalize(referral.status)}
      </span>
    </div>
    <div class="referral-card-meta">
      <span class="type-badge">${TYPE_LABELS[referral.type]}</span>
      <span>${timeAgo(referral.createdAt)}</span>
      ${isAdmin ? `<span style="color: var(--text-muted)">by ${referral.referrerName}</span>` : ''}
    </div>
  `;

  card.addEventListener('click', () => {
    const path = isAdmin
      ? `/admin/referral/${referral.id}`
      : `/referral/${referral.id}`;
    navigate(path);
  });

  return card;
}
