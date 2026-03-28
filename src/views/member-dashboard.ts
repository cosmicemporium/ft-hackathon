import { getState } from '../state';
import { getAllReferrals, getPlatformReferralInfo } from '../sdk';
import { renderReferralCard } from '../components/referral-card';
import { showToast } from '../components/toast';
import type { ReferralType } from '../types';

export async function renderMemberDashboard(container: HTMLElement) {
  const state = getState();
  container.innerHTML = '<div class="page"><div class="spinner"></div></div>';

  try {
    const [allReferrals, referralInfo] = await Promise.all([
      getAllReferrals(),
      getPlatformReferralInfo().catch(() => null),
    ]);

    const myReferrals = allReferrals.filter((r) => r.referrerId === state.userId);
    const converted = myReferrals.filter((r) => r.status === 'converted' || r.status === 'paid');
    const paid = myReferrals.filter((r) => r.status === 'paid');
    const totalEarned = paid.reduce((sum, r) => sum + parseFloat(r.rewardAmount || '0'), 0);

    let activeFilter: ReferralType | 'all' = 'all';

    function render() {
      const filtered =
        activeFilter === 'all'
          ? myReferrals
          : myReferrals.filter((r) => r.type === activeFilter);

      container.innerHTML = `
        <div class="page">
          <div class="greeting">
            <h2>Hi, ${state.userName.split(' ')[0]}</h2>
            <div class="balance">${state.balanceFormatted || 'Loading balance...'}</div>
          </div>

          <div class="stats-bar">
            <div class="stat-item">
              <div class="stat-value">${myReferrals.length}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${converted.length}</div>
              <div class="stat-label">Converted</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">$${totalEarned.toFixed(0)}</div>
              <div class="stat-label">Earned</div>
            </div>
          </div>

          ${
            referralInfo
              ? `<div class="referral-link-box">
                  <label>Your Referral Link</label>
                  <div class="referral-link-row">
                    <input type="text" readonly value="${referralInfo.referralLink}" />
                    <button id="copy-link">Copy</button>
                  </div>
                </div>`
              : ''
          }

          <div class="filter-tabs">
            <button class="filter-tab ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
            <button class="filter-tab ${activeFilter === 'tour' ? 'active' : ''}" data-filter="tour">Tours</button>
            <button class="filter-tab ${activeFilter === 'office' ? 'active' : ''}" data-filter="office">Offices</button>
            <button class="filter-tab ${activeFilter === 'member' ? 'active' : ''}" data-filter="member">Members</button>
          </div>

          <div id="referral-list"></div>

          ${
            filtered.length === 0
              ? '<div class="empty-state"><p>No referrals yet. Tap "Refer" to get started!</p></div>'
              : ''
          }
        </div>
      `;

      const listEl = container.querySelector('#referral-list')!;
      filtered.forEach((r) => listEl.appendChild(renderReferralCard(r)));

      // Copy link handler
      container.querySelector('#copy-link')?.addEventListener('click', () => {
        const input = container.querySelector('.referral-link-row input') as HTMLInputElement;
        navigator.clipboard.writeText(input.value);
        showToast('Link copied!');
      });

      // Filter tabs
      container.querySelectorAll('.filter-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          activeFilter = (tab as HTMLElement).dataset.filter as ReferralType | 'all';
          render();
        });
      });
    }

    render();
  } catch (err) {
    container.innerHTML = `<div class="page"><div class="empty-state"><p>Failed to load dashboard. ${err}</p></div></div>`;
  }
}
