import { getState } from '../state';
import { addReferral, getConfig, getWalletAddress } from '../sdk';
import { showToast } from '../components/toast';
import { navigate } from '../router';
import { generateId, TYPE_ICONS } from '../utils';
import type { ReferralType, Referral } from '../types';

export async function renderCreateReferral(container: HTMLElement) {
  const state = getState();
  let selectedType: ReferralType | null = null;

  function render() {
    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <button class="back-btn" id="back">&larr;</button>
          <h1>New Referral</h1>
        </div>

        <div class="type-selector">
          <button class="type-option ${selectedType === 'tour' ? 'selected' : ''}" data-type="tour">
            <span class="type-icon">${TYPE_ICONS.tour}</span>
            <span class="type-label">Tour</span>
          </button>
          <button class="type-option ${selectedType === 'office' ? 'selected' : ''}" data-type="office">
            <span class="type-icon">${TYPE_ICONS.office}</span>
            <span class="type-label">Office</span>
          </button>
          <button class="type-option ${selectedType === 'member' ? 'selected' : ''}" data-type="member">
            <span class="type-icon">${TYPE_ICONS.member}</span>
            <span class="type-label">Member</span>
          </button>
        </div>

        ${
          selectedType
            ? `
          <form id="referral-form">
            <div class="form-group">
              <label>Prospect Name *</label>
              <input type="text" name="prospectName" placeholder="Full name" required />
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" name="prospectEmail" placeholder="email@example.com" required />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" name="prospectPhone" placeholder="+1 (555) 000-0000" />
            </div>
            ${
              selectedType === 'office'
                ? `<div class="form-group">
                    <label>Company Name</label>
                    <input type="text" name="prospectCompany" placeholder="Company name" />
                  </div>`
                : ''
            }
            <div class="form-group">
              <label>Notes</label>
              <textarea name="notes" placeholder="Any relevant context..."></textarea>
            </div>
            <button type="submit" class="btn-primary" id="submit-btn">Submit Referral</button>
          </form>
        `
            : '<div class="empty-state"><p>Select a referral type above</p></div>'
        }
      </div>
    `;

    // Back button
    container.querySelector('#back')?.addEventListener('click', () => navigate('/'));

    // Type selector
    container.querySelectorAll('.type-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedType = (btn as HTMLElement).dataset.type as ReferralType;
        render();
      });
    });

    // Form submit
    container.querySelector('#referral-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const submitBtn = container.querySelector('#submit-btn') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        const fd = new FormData(form);
        const config = await getConfig();
        let walletAddress = state.walletAddress;
        if (!walletAddress) {
          walletAddress = await getWalletAddress();
        }

        const referral: Referral = {
          id: generateId(),
          type: selectedType!,
          status: 'pending',
          referrerId: state.userId,
          referrerEmail: state.userEmail,
          referrerName: state.userName,
          referrerWalletAddress: walletAddress,
          prospectName: fd.get('prospectName') as string,
          prospectEmail: fd.get('prospectEmail') as string,
          prospectPhone: (fd.get('prospectPhone') as string) || undefined,
          prospectCompany: (fd.get('prospectCompany') as string) || undefined,
          notes: (fd.get('notes') as string) || undefined,
          rewardAmount: config.defaultRewards[selectedType!],
          rewardCurrency: config.rewardCurrency,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await addReferral(referral);
        showToast('Referral submitted!');
        navigate('/');
      } catch (err) {
        showToast(`Failed: ${err}`, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Referral';
      }
    });
  }

  render();
}
