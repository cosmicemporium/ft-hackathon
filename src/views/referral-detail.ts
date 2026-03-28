import { getReferralById } from '../sdk';
import { navigate } from '../router';
import { STATUS_COLORS, TYPE_LABELS, formatDate, capitalize } from '../utils';
import type { ReferralStatus } from '../types';

const TIMELINE_STEPS: ReferralStatus[] = ['pending', 'contacted', 'converted', 'paid'];

export async function renderReferralDetail(container: HTMLElement, params: Record<string, string>) {
  container.innerHTML = '<div class="page"><div class="spinner"></div></div>';

  const referral = await getReferralById(params.id);
  if (!referral) {
    container.innerHTML = '<div class="page"><div class="empty-state"><p>Referral not found</p></div></div>';
    return;
  }

  const stepIdx = referral.status === 'rejected' ? -1 : TIMELINE_STEPS.indexOf(referral.status);
  const statusColor = STATUS_COLORS[referral.status];

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" id="back">&larr;</button>
        <h1>Referral Detail</h1>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <span class="type-badge">${TYPE_LABELS[referral.type]}</span>
        <span class="status-badge" style="background: ${statusColor}20; color: ${statusColor}">
          ${capitalize(referral.status)}
        </span>
      </div>

      <div class="status-timeline">
        ${TIMELINE_STEPS.map(
          (_, i) =>
            `<div class="timeline-step ${i <= stepIdx ? 'completed' : ''}"></div>`
        ).join('')}
      </div>

      <div class="detail-section">
        <h3>Prospect</h3>
        <div class="card">
          <div class="detail-row">
            <span class="detail-label">Name</span>
            <span class="detail-value">${referral.prospectName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">${referral.prospectEmail}</span>
          </div>
          ${
            referral.prospectPhone
              ? `<div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">${referral.prospectPhone}</span>
                </div>`
              : ''
          }
          ${
            referral.prospectCompany
              ? `<div class="detail-row">
                  <span class="detail-label">Company</span>
                  <span class="detail-value">${referral.prospectCompany}</span>
                </div>`
              : ''
          }
          ${
            referral.notes
              ? `<div class="detail-row">
                  <span class="detail-label">Notes</span>
                  <span class="detail-value">${referral.notes}</span>
                </div>`
              : ''
          }
        </div>
      </div>

      <div class="detail-section">
        <h3>Reward</h3>
        <div class="card">
          <div class="detail-row">
            <span class="detail-label">Amount</span>
            <span class="detail-value">$${referral.rewardAmount} ${referral.rewardCurrency}</span>
          </div>
          ${
            referral.payoutTxHash
              ? `<div class="detail-row">
                  <span class="detail-label">Tx Hash</span>
                  <span class="detail-value" style="font-size: 12px;">${referral.payoutTxHash.slice(0, 10)}...${referral.payoutTxHash.slice(-8)}</span>
                </div>`
              : ''
          }
        </div>
      </div>

      <div class="detail-section">
        <h3>Timeline</h3>
        <div class="card">
          <div class="detail-row">
            <span class="detail-label">Created</span>
            <span class="detail-value">${formatDate(referral.createdAt)}</span>
          </div>
          ${
            referral.convertedAt
              ? `<div class="detail-row">
                  <span class="detail-label">Converted</span>
                  <span class="detail-value">${formatDate(referral.convertedAt)}</span>
                </div>`
              : ''
          }
          ${
            referral.paidAt
              ? `<div class="detail-row">
                  <span class="detail-label">Paid</span>
                  <span class="detail-value">${formatDate(referral.paidAt)}</span>
                </div>`
              : ''
          }
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back')?.addEventListener('click', () => navigate('/'));
}
