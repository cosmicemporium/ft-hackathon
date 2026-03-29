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

  // Generate QR code as data URL
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(request.id, {
      width: 200,
      margin: 2,
      color: { dark: '#764AE2', light: '#ffffff' },
    });
  } catch {
    console.error('QR generation failed');
  }

  const code = shortId(request.id);

  container.innerHTML = `
    <div class="page" style="text-align: center;">
      <div style="margin: 20px 0 30px;">
        <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
        <h1 style="font-size: 24px; margin-bottom: 6px;">Request Submitted!</h1>
        <p style="color: var(--text-secondary); font-size: 14px;">
          A Frontier Tower member will review your ${TYPE_LABELS[request.type].toLowerCase()} request
        </p>
      </div>

      <div class="card" style="margin-bottom: 20px;">
        <div style="margin-bottom: 16px;">
          ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" style="width: 200px; height: 200px; border-radius: 12px;" />` : ''}
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">Your request code</p>
        <p style="font-size: 24px; font-weight: 700; font-family: monospace; letter-spacing: 2px; color: var(--accent);">${code}</p>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
          Show this QR code to your host after your visit
        </p>
      </div>

      <div class="card" style="text-align: left;">
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

      <button class="btn-primary" style="margin-top: 20px;" id="new-request">Submit Another Request</button>
    </div>
  `;

  container.querySelector('#new-request')?.addEventListener('click', () => navigate('/guest'));
}
