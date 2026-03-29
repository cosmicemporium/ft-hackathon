import { getState } from '../state';
import { getAllRequests, getPlatformReferralInfo } from '../sdk';
import { navigate } from '../router';
import { STATUS_COLORS, TYPE_LABELS, TYPE_ICONS, timeAgo, capitalize, BADGE_LABELS, BADGE_ICONS } from '../utils';
import { showToast } from '../components/toast';
import type { RequestType } from '../types';

export async function renderMemberQueue(container: HTMLElement) {
  const state = getState();
  container.innerHTML = '<div class="page"><div class="spinner"></div></div>';

  try {
    const [allRequests, platformReferral] = await Promise.all([
      getAllRequests(),
      getPlatformReferralInfo().catch(() => null),
    ]);
    const openRequests = allRequests.filter((r) => r.status === 'open');
    const myAccepted = allRequests.filter((r) => r.acceptedById === state.userId && (r.status === 'accepted' || r.status === 'proposed'));
    const myCompleted = allRequests.filter((r) => r.acceptedById === state.userId && r.status === 'completed');

    let activeFilter: RequestType | 'all' = 'all';

    function render() {
      const filtered =
        activeFilter === 'all'
          ? openRequests
          : openRequests.filter((r) => r.type === activeFilter);

      const badge = state.memberStats.badge;
      const badgeHTML = badge !== 'none'
        ? `<span class="member-badge">${BADGE_ICONS[badge]} ${BADGE_LABELS[badge]}</span>`
        : '';

      container.innerHTML = `
        <div class="page">
          <div class="greeting">
            <div class="greeting-row">
              <img src="/assets/logomark.svg" alt="Frontier Tower" class="greeting-logo" />
              <div>
                <h2>Hi, ${state.userName.split(' ')[0]} ${badgeHTML}</h2>
                <div class="balance">${state.balanceFormatted || 'Loading balance...'}</div>
              </div>
            </div>
          </div>

          <div class="stats-bar">
            <div class="stat-item">
              <div class="stat-value">${openRequests.length}</div>
              <div class="stat-label">Open</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${myAccepted.length}</div>
              <div class="stat-label">Accepted</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${myCompleted.length}</div>
              <div class="stat-label">Completed</div>
            </div>
          </div>

          <div class="referral-link-box">
            <label>Invite Guests to Frontier Tower</label>
            <div class="referral-link-row">
              <input type="text" readonly id="referral-link" value="${window.location.origin}/#/guest?ref=${encodeURIComponent(state.userName)}" />
              <button id="copy-referral">Copy</button>
            </div>
            ${platformReferral ? `
              <div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">
                Platform referrals: ${platformReferral.referralCount ?? 0} · Code: ${platformReferral.referralCode ?? '—'}
              </div>
            ` : ''}
          </div>

          <div class="filter-tabs">
            <button class="filter-tab ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
            <button class="filter-tab ${activeFilter === 'tour' ? 'active' : ''}" data-filter="tour">Tours</button>
            <button class="filter-tab ${activeFilter === 'office' ? 'active' : ''}" data-filter="office">Offices</button>
            <button class="filter-tab ${activeFilter === 'membership' ? 'active' : ''}" data-filter="membership">Memberships</button>
          </div>

          <div id="request-list"></div>

          ${filtered.length === 0
            ? '<div class="empty-state"><p>No open requests right now</p></div>'
            : ''}
        </div>
      `;

      const listEl = container.querySelector('#request-list')!;
      filtered.forEach((req) => {
        const declined = req.declinedBy.includes(state.userName);
        const statusColor = STATUS_COLORS[req.status];
        const card = document.createElement('div');
        card.className = `referral-card${declined ? ' declined-card' : ''}`;
        card.innerHTML = `
          <div class="referral-card-header">
            <span class="referral-card-name">${req.guestName}</span>
            <span class="status-badge" style="background: ${statusColor}20; color: ${statusColor}">
              ${capitalize(req.status)}
            </span>
          </div>
          <div class="referral-card-meta">
            <span class="type-badge">${TYPE_ICONS[req.type]} ${TYPE_LABELS[req.type]}</span>
            <span>${req.availableSlots.length} slot${req.availableSlots.length > 1 ? 's' : ''}</span>
            <span>${timeAgo(req.createdAt)}</span>
            ${declined ? '<span class="declined-tag">You passed</span>' : ''}
          </div>
        `;
        card.addEventListener('click', () => navigate(`/request/${req.id}`));
        listEl.appendChild(card);
      });

      // Copy referral link
      container.querySelector('#copy-referral')?.addEventListener('click', () => {
        const input = container.querySelector('#referral-link') as HTMLInputElement;
        navigator.clipboard.writeText(input.value);
        showToast('Referral link copied!');
      });

      // Filter tabs
      container.querySelectorAll('.filter-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          activeFilter = (tab as HTMLElement).dataset.filter as RequestType | 'all';
          render();
        });
      });
    }

    render();
  } catch (err) {
    container.innerHTML = `<div class="page"><div class="empty-state"><p>Failed to load. ${err}</p></div></div>`;
  }
}
