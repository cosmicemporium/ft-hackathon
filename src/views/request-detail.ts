import { getState, setState } from '../state';
import { getRequestById, updateRequest, incrementAcceptance, getMemberStats } from '../sdk';
import { navigate } from '../router';
import { STATUS_COLORS, TYPE_LABELS, formatSlot, capitalize, formatSlotDate, formatTime24to12 } from '../utils';
import { showModal } from '../components/modal';
import { showToast } from '../components/toast';
import type { TimeSlot } from '../types';
import { TOWER_FLOORS, OFFICE_OPTIONS } from '../types';

export async function renderRequestDetail(container: HTMLElement, params: Record<string, string>) {
  container.innerHTML = '<div class="page"><div class="spinner"></div></div>';

  async function load() {
    const state = getState();
    const request = await getRequestById(params.id);
    if (!request) {
      container.innerHTML = '<div class="page"><div class="empty-state"><p>Request not found</p></div></div>';
      return;
    }

    const statusColor = STATUS_COLORS[request.status];
    const isMyRequest = request.acceptedById === state.userId;
    const iDeclined = request.declinedBy.includes(state.userName);

    container.innerHTML = `
      <div class="page">
        <div class="page-header motion-reveal --visible">
          <button class="back-btn" id="back">&larr;</button>
          <h1>Request Detail</h1>
        </div>

        <div class="motion-reveal --visible" style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px; transition-delay: 50ms;">
          <span class="type-badge">${TYPE_LABELS[request.type]}</span>
          <span class="status-badge" style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30;">
            ${capitalize(request.status)}
          </span>
          ${isMyRequest ? '<span class="status-badge" style="background: var(--accent-subtle); color: var(--accent); border: 1px solid rgba(118,74,226,0.20);">Yours</span>' : ''}
        </div>

        <div class="glow-line"></div>

        <div class="detail-section motion-reveal --visible" style="transition-delay: 100ms;">
          <h3>Guest Info</h3>
          <div class="card">
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${request.guestName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${request.guestEmail}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">${request.guestPhone}</span>
            </div>
          </div>
        </div>

        ${request.interestedFloors && request.interestedFloors.length > 0 ? `
          <div class="detail-section motion-reveal --visible" style="transition-delay: 150ms;">
            <h3>Interested Floors</h3>
            <div class="card">
              <div class="floor-tags">
                ${request.interestedFloors.map((fid) => {
                  const floor = TOWER_FLOORS.find((f) => f.id === fid);
                  return floor ? `<span class="floor-tag">${floor.label}</span>` : '';
                }).join('')}
              </div>
            </div>
          </div>
        ` : ''}

        ${request.interestedOffices && request.interestedOffices.length > 0 ? `
          <div class="detail-section motion-reveal --visible" style="transition-delay: 150ms;">
            <h3>Interested Offices</h3>
            <div class="card">
              ${request.interestedOffices.map((oid) => {
                const office = OFFICE_OPTIONS.find((o) => o.id === oid);
                return office ? `
                  <div class="detail-row">
                    <span class="detail-label">${office.label}</span>
                    <span class="detail-value" style="color: var(--accent);">${office.price}</span>
                  </div>` : '';
              }).join('')}
            </div>
          </div>
        ` : ''}

        ${request.selectedSlot ? `
          <div class="detail-section motion-reveal --visible" style="transition-delay: 200ms;">
            <h3>Scheduled</h3>
            <div class="card" style="border-color: rgba(118, 74, 226, 0.25);">
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value" style="color: var(--accent);">${formatSlot(request.selectedSlot)}</span>
              </div>
              ${request.acceptedBy ? `
                <div class="detail-row">
                  <span class="detail-label">Host</span>
                  <span class="detail-value">${request.acceptedBy}</span>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${request.proposedSlot && request.status === 'proposed' ? `
          <div class="detail-section motion-reveal --visible" style="transition-delay: 200ms;">
            <h3>Proposed Time</h3>
            <div class="card" style="border-color: rgba(139, 92, 246, 0.3);">
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${formatSlot(request.proposedSlot)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">By</span>
                <span class="detail-value">${request.acceptedBy}</span>
              </div>
            </div>
          </div>
        ` : ''}

        ${request.status === 'open' ? `
          <div class="detail-section motion-reveal --visible" style="transition-delay: 200ms;">
            <h3>Available Slots</h3>
            <p style="font-family: var(--font-expressive); font-size: 13px; color: var(--accent); margin-bottom: 12px;">Select a time slot to accept this request</p>
            <div id="slots-list"></div>
          </div>
          <div class="admin-actions" id="actions"></div>
        ` : ''}

        ${request.status === 'completed' ? `
          <div class="detail-section motion-reveal --visible" style="transition-delay: 200ms;">
            <h3>Completed</h3>
            <div class="card" style="border-color: rgba(118, 74, 226, 0.25); text-align: center;">
              <div style="font-family: var(--font-monument); font-size: 16px; font-weight: 700; text-transform: uppercase; color: var(--accent); margin-bottom: 8px;">Complete</div>
              ${request.rewardAmount ? `
                <div style="font-family: var(--font-monument); font-size: 24px; font-weight: 700; color: var(--accent); text-shadow: 0 0 20px rgba(118,74,226,0.4);">
                  +$${request.rewardAmount} ${request.rewardCurrency}
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    container.querySelector('#back')?.addEventListener('click', () => navigate('/member'));

    if (request.status === 'open') {
      // Render slot cards
      const slotsEl = container.querySelector('#slots-list')!;
      request.availableSlots.forEach((slot) => {
        const card = document.createElement('div');
        card.className = 'slot-card';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="slot-card-date">${formatSlotDate(slot.date)}</div>
              <div class="slot-card-time">${formatTime24to12(slot.startTime)} – ${formatTime24to12(slot.endTime)}</div>
            </div>
            <span style="font-family: var(--font-monument); color: var(--accent); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Accept →</span>
          </div>
        `;
        card.addEventListener('click', () => handleAccept(slot));
        slotsEl.appendChild(card);
      });

      // Action buttons
      const actionsEl = container.querySelector('#actions')!;

      const proposeBtn = document.createElement('button');
      proposeBtn.className = 'btn-secondary';
      proposeBtn.textContent = 'Propose Different Time';
      proposeBtn.addEventListener('click', () => handlePropose());
      actionsEl.appendChild(proposeBtn);

      if (!iDeclined) {
        const declineBtn = document.createElement('button');
        declineBtn.className = 'btn-danger';
        declineBtn.textContent = 'Pass on This Request';
        declineBtn.addEventListener('click', () => handleDecline());
        actionsEl.appendChild(declineBtn);
      } else {
        const tag = document.createElement('p');
        tag.style.cssText = 'font-family: var(--font-brutalist); color: var(--text-muted); font-size: 11px; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;';
        tag.textContent = 'You previously passed on this request';
        actionsEl.appendChild(tag);
      }
    }

    async function handleAccept(slot: TimeSlot) {
      showModal(
        'Accept This Slot?',
        `<p style="font-family: var(--font-expressive); color: var(--text-secondary); margin-bottom: 14px;">
          You'll be hosting <strong style="color: var(--text-primary);">${request!.guestName}</strong> for a <strong style="color: var(--accent);">${TYPE_LABELS[request!.type].toLowerCase()}</strong>.
        </p>
        <div class="card">
          <div class="detail-row">
            <span class="detail-label">When</span>
            <span class="detail-value" style="color: var(--accent);">${formatSlot(slot)}</span>
          </div>
        </div>`,
        [
          { label: 'Cancel', className: 'btn-secondary', onClick: () => {} },
          {
            label: 'Accept',
            className: 'btn-primary',
            onClick: async () => {
              try {
                await updateRequest(request!.id, {
                  status: 'accepted',
                  acceptedBy: state.userName,
                  acceptedById: state.userId,
                  selectedSlot: slot,
                });
                const stats = await incrementAcceptance(state.userId);
                setState({ memberStats: stats });
                showToast('Request accepted!');
                navigate('/accepted');
              } catch (err) {
                showToast(`Failed: ${err}`, 'error');
              }
            },
          },
        ]
      );
    }

    function handlePropose() {
      const today = new Date().toISOString().split('T')[0];
      showModal(
        'Propose a Time',
        `<div class="form-group">
          <label>Date</label>
          <input type="date" id="propose-date" min="${today}" />
        </div>
        <div class="form-group">
          <label>Start Time</label>
          <input type="time" id="propose-start" value="10:00" />
        </div>
        <div class="form-group">
          <label>End Time</label>
          <input type="time" id="propose-end" value="12:00" />
        </div>`,
        [
          { label: 'Cancel', className: 'btn-secondary', onClick: () => {} },
          {
            label: 'Propose',
            className: 'btn-primary',
            onClick: async () => {
              const dateEl = document.querySelector('#propose-date') as HTMLInputElement;
              const startEl = document.querySelector('#propose-start') as HTMLInputElement;
              const endEl = document.querySelector('#propose-end') as HTMLInputElement;

              if (!dateEl?.value || !startEl?.value || !endEl?.value) {
                showToast('Please fill all fields', 'error');
                return;
              }

              try {
                await updateRequest(request!.id, {
                  status: 'proposed',
                  acceptedBy: state.userName,
                  acceptedById: state.userId,
                  proposedSlot: {
                    date: dateEl.value,
                    startTime: startEl.value,
                    endTime: endEl.value,
                  },
                });
                const stats = await incrementAcceptance(state.userId);
                setState({ memberStats: stats });
                showToast('Time proposed!');
                navigate('/accepted');
              } catch (err) {
                showToast(`Failed: ${err}`, 'error');
              }
            },
          },
        ]
      );
    }

    async function handleDecline() {
      try {
        const updated = [...request!.declinedBy, state.userName];
        await updateRequest(request!.id, { declinedBy: updated });
        showToast('Passed on request');
        navigate('/member');
      } catch (err) {
        showToast(`Failed: ${err}`, 'error');
      }
    }
  }

  await load();
}
