import { getReferralById, updateReferral, sendPayout, getConfig } from '../sdk';
import { navigate } from '../router';
import { STATUS_COLORS, TYPE_LABELS, formatDate, capitalize } from '../utils';
import { showModal } from '../components/modal';
import { showToast } from '../components/toast';
import type { ReferralStatus } from '../types';

const TIMELINE_STEPS: ReferralStatus[] = ['pending', 'contacted', 'converted', 'paid'];

export async function renderAdminReferralDetail(container: HTMLElement, params: Record<string, string>) {
  container.innerHTML = '<div class="page"><div class="spinner"></div></div>';

  async function load() {
    const referral = await getReferralById(params.id);
    if (!referral) {
      container.innerHTML = '<div class="page"><div class="empty-state"><p>Referral not found</p></div></div>';
      return;
    }

    const config = await getConfig();
    const stepIdx = referral.status === 'rejected' ? -1 : TIMELINE_STEPS.indexOf(referral.status);
    const statusColor = STATUS_COLORS[referral.status];

    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <button class="back-btn" id="back">&larr;</button>
          <h1>Review Referral</h1>
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
          <h3>Referrer</h3>
          <div class="card">
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${referral.referrerName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${referral.referrerEmail}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Wallet</span>
              <span class="detail-value" style="font-size: 12px;">${referral.referrerWalletAddress.slice(0, 8)}...${referral.referrerWalletAddress.slice(-6)}</span>
            </div>
          </div>
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
            ${referral.prospectPhone ? `<div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${referral.prospectPhone}</span></div>` : ''}
            ${referral.prospectCompany ? `<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${referral.prospectCompany}</span></div>` : ''}
            ${referral.notes ? `<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">${referral.notes}</span></div>` : ''}
          </div>
        </div>

        <div class="detail-section">
          <h3>Timeline</h3>
          <div class="card">
            <div class="detail-row">
              <span class="detail-label">Created</span>
              <span class="detail-value">${formatDate(referral.createdAt)}</span>
            </div>
            ${referral.convertedAt ? `<div class="detail-row"><span class="detail-label">Converted</span><span class="detail-value">${formatDate(referral.convertedAt)}</span></div>` : ''}
            ${referral.paidAt ? `<div class="detail-row"><span class="detail-label">Paid</span><span class="detail-value">${formatDate(referral.paidAt)}</span></div>` : ''}
            ${referral.payoutTxHash ? `<div class="detail-row"><span class="detail-label">Tx Hash</span><span class="detail-value" style="font-size: 12px;">${referral.payoutTxHash.slice(0, 10)}...${referral.payoutTxHash.slice(-8)}</span></div>` : ''}
          </div>
        </div>

        <div class="admin-actions" id="admin-actions"></div>
      </div>
    `;

    container.querySelector('#back')?.addEventListener('click', () => navigate('/admin'));

    // Render action buttons based on status
    const actionsEl = container.querySelector('#admin-actions')!;

    if (referral.status === 'pending') {
      const contactedBtn = document.createElement('button');
      contactedBtn.className = 'btn-primary';
      contactedBtn.textContent = 'Mark as Contacted';
      contactedBtn.addEventListener('click', async () => {
        await updateReferral(referral.id, { status: 'contacted' });
        showToast('Marked as contacted');
        load();
      });

      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'btn-danger';
      rejectBtn.textContent = 'Reject';
      rejectBtn.addEventListener('click', async () => {
        await updateReferral(referral.id, { status: 'rejected' });
        showToast('Referral rejected');
        load();
      });

      actionsEl.appendChild(contactedBtn);
      actionsEl.appendChild(rejectBtn);
    }

    if (referral.status === 'contacted') {
      const convertBtn = document.createElement('button');
      convertBtn.className = 'btn-success';
      convertBtn.textContent = 'Mark as Converted';
      convertBtn.addEventListener('click', async () => {
        await updateReferral(referral.id, {
          status: 'converted',
          convertedAt: new Date().toISOString(),
        });
        showToast('Marked as converted!');
        load();
      });
      actionsEl.appendChild(convertBtn);
    }

    if (referral.status === 'converted') {
      const payoutBtn = document.createElement('button');
      payoutBtn.className = 'btn-primary';
      payoutBtn.textContent = 'Send Payout';
      payoutBtn.addEventListener('click', () => {
        const defaultAmount = config.defaultRewards[referral.type] || referral.rewardAmount;
        showModal(
          'Send Payout',
          `
            <div class="form-group">
              <label>Recipient</label>
              <input type="text" readonly value="${referral.referrerName} (${referral.referrerWalletAddress.slice(0, 8)}...)" />
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input type="number" id="payout-amount" value="${defaultAmount}" step="0.01" min="0.01" />
            </div>
            <div class="form-group">
              <label>Currency</label>
              <div style="display: flex; gap: 8px;">
                <button class="filter-tab active" id="curr-ifnd" data-curr="iFND">iFND</button>
                <button class="filter-tab" id="curr-fnd" data-curr="FND">FND</button>
              </div>
            </div>
          `,
          [
            {
              label: 'Cancel',
              className: 'btn-secondary',
              onClick: () => {},
            },
            {
              label: 'Confirm Payout',
              className: 'btn-primary',
              onClick: async () => {
                try {
                  const amountInput = document.querySelector('#payout-amount') as HTMLInputElement;
                  const amount = amountInput?.value || defaultAmount;
                  const currActive = document.querySelector('.modal-content .filter-tab.active') as HTMLElement;
                  const currency = (currActive?.dataset.curr as 'FND' | 'iFND') || 'iFND';

                  showToast('Processing payout...');

                  const receipt = await sendPayout(
                    referral.referrerWalletAddress,
                    amount,
                    currency
                  );

                  await updateReferral(referral.id, {
                    status: 'paid',
                    rewardAmount: amount,
                    rewardCurrency: currency,
                    payoutTxHash: receipt.transactionHash,
                    paidAt: new Date().toISOString(),
                  });

                  showToast('Payout sent successfully!');
                  load();
                } catch (err) {
                  showToast(`Payout failed: ${err}`, 'error');
                }
              },
            },
          ]
        );

        // Wire up currency toggle in modal
        setTimeout(() => {
          document.querySelectorAll('.modal-content .filter-tab').forEach((tab) => {
            tab.addEventListener('click', () => {
              document.querySelectorAll('.modal-content .filter-tab').forEach((t) => t.classList.remove('active'));
              tab.classList.add('active');
            });
          });
        }, 50);
      });
      actionsEl.appendChild(payoutBtn);
    }
  }

  await load();
}
