import { getAllRequests } from '../sdk';
import { BADGE_ICONS, BADGE_LABELS, computeBadge } from '../utils';

interface LeaderEntry {
  name: string;
  completions: number;
  acceptances: number;
  badge: string;
  badgeIcon: string;
}

export async function renderLeaderboard(container: HTMLElement) {
  container.innerHTML = '<div class="page"><div class="spinner"></div></div>';

  try {
    const allRequests = await getAllRequests();

    // Build leaderboard from completed/accepted requests
    const memberMap = new Map<string, { completions: number; acceptances: number }>();

    allRequests.forEach((req) => {
      if (req.acceptedBy) {
        const entry = memberMap.get(req.acceptedBy) || { completions: 0, acceptances: 0 };
        if (req.status === 'completed') entry.completions++;
        if (['accepted', 'proposed', 'completed'].includes(req.status)) entry.acceptances++;
        memberMap.set(req.acceptedBy, entry);
      }
    });

    const leaders: LeaderEntry[] = Array.from(memberMap.entries())
      .map(([name, stats]) => {
        const badge = computeBadge(stats.completions);
        return {
          name,
          completions: stats.completions,
          acceptances: stats.acceptances,
          badge: BADGE_LABELS[badge],
          badgeIcon: BADGE_ICONS[badge],
        };
      })
      .sort((a, b) => b.completions - a.completions || b.acceptances - a.acceptances);

    container.innerHTML = `
      <div class="page">
        <div class="page-header motion-reveal --visible">
          <h1>Leaderboard</h1>
        </div>

        <div class="glow-line"></div>

        <!-- Badge tiers legend -->
        <div class="badge-legend motion-reveal --visible" style="transition-delay: 50ms;">
          <div class="badge-tier">
            <span class="badge-tier-icon">🌟</span>
            <div>
              <span class="badge-tier-name">Helper</span>
              <span class="badge-tier-req">5 visits</span>
            </div>
          </div>
          <div class="badge-tier">
            <span class="badge-tier-icon">⭐</span>
            <div>
              <span class="badge-tier-name">Ambassador</span>
              <span class="badge-tier-req">15 visits</span>
            </div>
          </div>
          <div class="badge-tier">
            <span class="badge-tier-icon">🏆</span>
            <div>
              <span class="badge-tier-name">Champion</span>
              <span class="badge-tier-req">30 visits</span>
            </div>
          </div>
        </div>

        <div id="leader-list" class="motion-stagger --visible" style="margin-top: 20px;">
          ${leaders.length === 0 ? `
            <div class="empty-state">
              <p style="font-size: 32px; margin-bottom: 8px;">🏅</p>
              <p>No completed referrals yet. Be the first!</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    if (leaders.length > 0) {
      const listEl = container.querySelector('#leader-list')!;
      leaders.forEach((entry, i) => {
        const rank = i + 1;
        const card = document.createElement('div');
        card.className = 'leaderboard-card';

        const rankDisplay = rank <= 3
          ? `<span class="leader-rank --top">${rank}</span>`
          : `<span class="leader-rank">${rank}</span>`;

        card.innerHTML = `
          <div class="leader-left">
            ${rankDisplay}
            <div class="leader-info">
              <span class="leader-name">${entry.name}</span>
              ${entry.badge ? `<span class="member-badge">${entry.badgeIcon} ${entry.badge}</span>` : ''}
            </div>
          </div>
          <div class="leader-stats">
            <div class="leader-stat">
              <span class="leader-stat-value">${entry.completions}</span>
              <span class="leader-stat-label">Done</span>
            </div>
            <div class="leader-stat">
              <span class="leader-stat-value">${entry.acceptances}</span>
              <span class="leader-stat-label">Accepted</span>
            </div>
          </div>
        `;
        listEl.appendChild(card);
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="page"><div class="empty-state"><p>Failed to load. ${err}</p></div></div>`;
  }
}
