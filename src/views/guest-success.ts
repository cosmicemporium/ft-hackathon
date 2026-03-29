import QRCode from 'qrcode';
import { getRequestById } from '../sdk';
import { navigate } from '../router';
import { TYPE_LABELS, formatSlot, shortId } from '../utils';

export async function renderGuestSuccess(container: HTMLElement, params: Record<string, string>) {
  container.innerHTML = '<div class="page"><div class="spinner"></div></div>';

  const request = await getRequestById(params.id);
  if (!request) {
    container.innerHTML = '<div class="page"><div class="empty-state"><p>Request not found</p></div></div>';
    return;
  }

  // Generate QR code with signal green
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(request.id, {
      width: 200,
      margin: 2,
      color: { dark: '#764AE2', light: '#0f0a1a' },
    });
  } catch {
    console.error('QR generation failed');
  }

  const code = shortId(request.id);

  container.innerHTML = `
    <div class="page" style="text-align: center;">
      <div class="motion-reveal --visible" style="margin: 24px 0 32px;">
        <div style="font-family: var(--font-monument); font-size: var(--type-display); font-weight: 700; letter-spacing: -0.02em; text-transform: uppercase; line-height: 1; margin-bottom: 8px; color: var(--accent);">
          Submitted
        </div>
        <div class="glow-line" style="margin: 16px auto; max-width: 120px;"></div>
        <p style="font-family: var(--font-expressive); color: var(--text-secondary); font-size: 14px; max-width: 280px; margin: 0 auto;">
          A Frontier Tower member will review your ${TYPE_LABELS[request.type].toLowerCase()} request
        </p>
      </div>

      <div class="card motion-reveal --visible" style="margin-bottom: 20px; transition-delay: 100ms;">
        <div style="margin-bottom: 16px; position: relative;">
          ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" style="width: min(180px, 45vw); height: min(180px, 45vw); border-radius: 8px; border: 1px solid var(--border); margin: 0 auto; display: block;" />` : ''}
        </div>
        <p style="font-family: var(--font-brutalist); font-size: 10px; color: var(--text-muted); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.15em;">Request Code</p>
        <p style="font-family: var(--font-monument); font-size: 28px; font-weight: 700; letter-spacing: 0.15em; color: var(--accent); text-shadow: 0 0 20px rgba(118, 74, 226, 0.4);">${code}</p>
        <p style="font-family: var(--font-expressive); font-size: 12px; color: var(--text-muted); margin-top: 10px;">
          Show this QR code to your host after your visit
        </p>
      </div>

      <div class="card motion-reveal --visible" style="text-align: left; transition-delay: 200ms;">
        <div class="detail-row">
          <span class="detail-label">Name</span>
          <span class="detail-value">${request.guestName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Type</span>
          <span class="detail-value">${TYPE_LABELS[request.type]}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Slots</span>
          <span class="detail-value">${request.availableSlots.length} time${request.availableSlots.length > 1 ? 's' : ''}</span>
        </div>
        ${request.availableSlots.map((s) => `
          <div class="detail-row">
            <span class="detail-label" style="font-size: 12px;"></span>
            <span class="detail-value" style="font-size: 13px;">${formatSlot(s)}</span>
          </div>
        `).join('')}
      </div>

      <button class="btn-primary" style="margin-top: 24px;" id="new-request">Submit Another Request</button>
    </div>
  `;

  container.querySelector('#new-request')?.addEventListener('click', () => navigate('/guest'));
}
