import { getAllRequests } from '../sdk';
import { navigate } from '../router';
import { showToast } from '../components/toast';
import { TYPE_LABELS, TYPE_ICONS, shortId, formatSlot } from '../utils';
import type { GuestRequest } from '../types';

// Step index not needed externally — logic is inline in renderResult

export async function renderGuestStatus(container: HTMLElement) {
  let foundRequest: GuestRequest | null = null;

  function renderLookup() {
    container.innerHTML = `
      <div class="page">
        <div class="page-header motion-reveal --visible">
          <button class="back-btn" id="back">&larr;</button>
          <div>
            <h1>Check Status</h1>
            <p class="page-subtitle">Enter your request code</p>
          </div>
        </div>

        <div class="glow-line"></div>

        <div class="card motion-reveal --visible" style="text-align: center; transition-delay: 100ms;">
          <p style="font-family: var(--font-expressive); font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
            Enter the code you received when you submitted your visit request.
          </p>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="status-code" placeholder="A1B2C3D4" style="text-transform: uppercase; font-family: var(--font-brutalist); letter-spacing: 0.1em; text-align: center; font-size: 18px;" />
            <button class="btn-primary" id="status-lookup" style="width: auto; padding: 12px 24px;">Go</button>
          </div>
        </div>

        <div id="status-result" style="margin-top: 20px;"></div>
      </div>
    `;

    container.querySelector('#back')?.addEventListener('click', () => navigate('/'));
    container.querySelector('#status-lookup')?.addEventListener('click', handleLookup);
    container.querySelector('#status-code')?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') handleLookup();
    });

    // Auto-focus the input
    (container.querySelector('#status-code') as HTMLInputElement)?.focus();
  }

  async function handleLookup() {
    const input = container.querySelector('#status-code') as HTMLInputElement;
    const code = input.value.trim().toUpperCase();
    if (!code) {
      showToast('Please enter a code', 'error');
      return;
    }

    const resultArea = container.querySelector('#status-result') as HTMLElement;
    resultArea.innerHTML = '<div class="spinner"></div>';

    const all = await getAllRequests();
    const match = all.find((r) => r.id.toUpperCase().startsWith(code) || shortId(r.id) === code);

    if (!match) {
      resultArea.innerHTML = `
        <div class="card" style="border-left: 3px solid var(--danger); text-align: center;">
          <p style="font-family: var(--font-monument); color: var(--danger); font-weight: 700; text-transform: uppercase; font-size: 14px;">Not Found</p>
          <p style="font-family: var(--font-expressive); color: var(--text-muted); font-size: 13px; margin-top: 6px;">No request matches that code. Check and try again.</p>
        </div>`;
      return;
    }

    foundRequest = match;
    renderResult(resultArea as HTMLElement, match);
  }

  function renderResult(el: HTMLElement, req: GuestRequest) {
    const steps = ['Submitted', 'Accepted', 'Completed'];
    const activeStep = req.status === 'completed' ? 3 : (req.status === 'open' ? 1 : 2);

    el.innerHTML = `
      <div class="card motion-reveal --visible" style="border-color: rgba(118, 74, 226, 0.25);">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <p style="font-family: var(--font-monument); font-size: 16px; font-weight: 700; text-transform: uppercase;">${req.guestName}</p>
            <span class="type-badge" style="margin-top: 4px;">${TYPE_ICONS[req.type]} ${TYPE_LABELS[req.type]}</span>
          </div>
          <div style="text-align: right;">
            <p style="font-family: var(--font-brutalist); font-size: 16px; color: var(--accent); letter-spacing: 0.1em;">${shortId(req.id)}</p>
          </div>
        </div>

        <div class="glow-line" style="margin: 12px 0;"></div>

        <!-- Timeline -->
        <div class="status-progress">
          ${steps.map((label, i) => {
            const isActive = i < activeStep;
            const isCurrent = i === activeStep - 1;
            return `
              <div class="progress-step ${isActive ? '--active' : ''} ${isCurrent ? '--current' : ''}">
                <div class="progress-dot"></div>
                <span class="progress-label">${label}</span>
              </div>
              ${i < steps.length - 1 ? `<div class="progress-line ${i < activeStep - 1 ? '--active' : ''}"></div>` : ''}
            `;
          }).join('')}
        </div>

        <!-- Status message -->
        <div style="margin-top: 20px; padding: 14px; background: var(--accent-subtle); border-radius: var(--radius-md); border: 1px solid rgba(118, 74, 226, 0.15);">
          <p style="font-family: var(--font-expressive); font-size: 14px; color: var(--text-primary);">
            ${req.status === 'open' ? 'Your request is in the queue. A Frontier Tower member will review it soon.' : ''}
            ${req.status === 'accepted' ? `Your visit has been accepted by <strong>${req.acceptedBy}</strong>. See you at Frontier Tower!` : ''}
            ${req.status === 'proposed' ? `<strong>${req.acceptedBy}</strong> proposed a different time for your visit.` : ''}
            ${req.status === 'completed' ? 'Your visit is complete! Thanks for visiting Frontier Tower.' : ''}
          </p>
        </div>

        <!-- Scheduled time -->
        ${req.selectedSlot ? `
          <div style="margin-top: 16px;">
            <p style="font-family: var(--font-brutalist); font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px;">Scheduled</p>
            <p style="font-family: var(--font-swiss); font-size: 14px; color: var(--accent);">${formatSlot(req.selectedSlot)}</p>
          </div>
        ` : ''}

        ${req.proposedSlot && req.status === 'proposed' ? `
          <div style="margin-top: 16px;">
            <p style="font-family: var(--font-brutalist); font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px;">Proposed Time</p>
            <p style="font-family: var(--font-swiss); font-size: 14px; color: var(--accent);">${formatSlot(req.proposedSlot)}</p>
          </div>
        ` : ''}

        ${req.acceptedBy ? `
          <div style="margin-top: 16px;">
            <p style="font-family: var(--font-brutalist); font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px;">Your Host</p>
            <p style="font-family: var(--font-swiss); font-size: 14px;">${req.acceptedBy}</p>
          </div>
        ` : ''}

        ${req.status === 'completed' && req.rewardAmount ? `
          <div style="margin-top: 16px; text-align: center; padding-top: 16px; border-top: 1px solid var(--border);">
            <p style="font-family: var(--font-brutalist); font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 4px;">Reward Earned by Host</p>
            <p style="font-family: var(--font-monument); font-size: 20px; font-weight: 700; color: var(--discord);">+$${req.rewardAmount} ${req.rewardCurrency}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderLookup();
}
