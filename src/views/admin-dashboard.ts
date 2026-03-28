import { getAllReferrals } from '../sdk';
import { renderReferralCard } from '../components/referral-card';
import type { ReferralStatus } from '../types';

export async function renderAdminDashboard(container: HTMLElement) {
  container.innerHTML = '<div class="page"><div class="spinner"></div></div>';

  try {
    const allReferrals = await getAllReferrals();

    const pending = allReferrals.filter((r) => r.status === 'pending');
    const converted = allReferrals.filter((r) => r.status === 'converted' || r.status === 'paid');
    const paid = allReferrals.filter((r) => r.status === 'paid');
    const totalPaid = paid.reduce((sum, r) => sum + parseFloat(r.rewardAmount || '0'), 0);

    let activeFilter: ReferralStatus | 'all' = 'all';

    function render() {
      const filtered =
        activeFilter === 'all'
          ? allReferrals
          : allReferrals.filter((r) => r.status === activeFilter);

      container.innerHTML = `
        <div class="page">
          <div class="page-header">
            <h1>Admin Dashboard</h1>
          </div>

          <div class="stats-bar">
            <div class="stat-item">
              <div class="stat-value">${pending.length}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${converted.length}</div>
              <div class="stat-label">Converted</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">$${totalPaid.toFixed(0)}</div>
              <div class="stat-label">Paid Out</div>
            </div>
          </div>

          <div class="filter-tabs">
            <button class="filter-tab ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All (${allReferrals.length})</button>
            <button class="filter-tab ${activeFilter === 'pending' ? 'active' : ''}" data-filter="pending">Pending (${pending.length})</button>
            <button class="filter-tab ${activeFilter === 'contacted' ? 'active' : ''}" data-filter="contacted">Contacted</button>
            <button class="filter-tab ${activeFilter === 'converted' ? 'active' : ''}" data-filter="converted">Converted</button>
            <button class="filter-tab ${activeFilter === 'paid' ? 'active' : ''}" data-filter="paid">Paid</button>
            <button class="filter-tab ${activeFilter === 'rejected' ? 'active' : ''}" data-filter="rejected">Rejected</button>
          </div>

          <div id="referral-list"></div>

          ${
            filtered.length === 0
              ? '<div class="empty-state"><p>No referrals matching this filter</p></div>'
              : ''
          }
        </div>
      `;

      const listEl = container.querySelector('#referral-list')!;
      filtered.forEach((r) => listEl.appendChild(renderReferralCard(r, true)));

      container.querySelectorAll('.filter-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          activeFilter = (tab as HTMLElement).dataset.filter as ReferralStatus | 'all';
          render();
        });
      });
    }

    render();
  } catch (err) {
    container.innerHTML = `<div class="page"><div class="empty-state"><p>Failed to load. ${err}</p></div></div>`;
  }
}
