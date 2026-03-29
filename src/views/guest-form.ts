import { addRequest } from '../sdk';
import { navigate } from '../router';
import { showToast } from '../components/toast';
import { generateId, TYPE_ICONS, formatSlot, generateTimeOptions, formatTime24to12 } from '../utils';
import type { RequestType, TimeSlot, GuestRequest } from '../types';
import { TOWER_FLOORS, OFFICE_OPTIONS } from '../types';

export async function renderGuestForm(container: HTMLElement) {
  let selectedType: RequestType | null = null;
  const slots: TimeSlot[] = [];
  const timeOptions = generateTimeOptions();
  const openSections: Record<string, boolean> = { floors: true, offices: true, info: true, availability: true };

  function render() {
    const timeOptionsHTML = timeOptions
      .map((t) => `<option value="${t}">${formatTime24to12(t)}</option>`)
      .join('');

    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = `
      <div class="page">
        <div class="page-header motion-reveal --visible">
          <img src="/assets/logomark.svg" alt="Frontier Tower" class="greeting-logo" />
          <div>
            <h1>Request a Visit</h1>
            <p class="page-subtitle">Frontier Tower — San Francisco</p>
          </div>
        </div>

        <div class="glow-line"></div>

        <form id="guest-form">
          <!-- Type selector -->
          <div class="type-selector motion-stagger --visible">
            <button type="button" class="type-option ${selectedType === 'tour' ? 'selected' : ''}" data-type="tour">
              <span class="type-icon">${TYPE_ICONS.tour}</span>
              <span class="type-label">Tour</span>
            </button>
            <button type="button" class="type-option ${selectedType === 'office' ? 'selected' : ''}" data-type="office">
              <span class="type-icon">${TYPE_ICONS.office}</span>
              <span class="type-label">Office</span>
            </button>
            <button type="button" class="type-option ${selectedType === 'membership' ? 'selected' : ''}" data-type="membership">
              <span class="type-icon">${TYPE_ICONS.membership}</span>
              <span class="type-label">Member</span>
            </button>
          </div>

          ${selectedType ? `
          <div class="form-dropdowns motion-reveal --visible">

            ${selectedType === 'tour' ? `
            <!-- Floors dropdown -->
            <div class="dropdown-section">
              <button type="button" class="dropdown-toggle" data-section="floors">
                <span class="dropdown-label">Floors to Visit</span>
                <span class="dropdown-arrow ${openSections.floors ? '--open' : ''}">›</span>
              </button>
              <div class="dropdown-body ${openSections.floors ? '--open' : ''}">
                <div class="floor-checklist" id="floor-checklist">
                  ${TOWER_FLOORS.map((f) => `
                    <label class="floor-option">
                      <input type="checkbox" name="floors" value="${f.id}" />
                      <div class="floor-option-info">
                        <span class="floor-option-label">${f.label}</span>
                        <span class="floor-option-desc">${f.description}</span>
                      </div>
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>
            ` : ''}

            ${selectedType === 'office' ? `
            <!-- Offices dropdown -->
            <div class="dropdown-section">
              <button type="button" class="dropdown-toggle" data-section="offices">
                <span class="dropdown-label">Office Options</span>
                <span class="dropdown-arrow ${openSections.offices ? '--open' : ''}">›</span>
              </button>
              <div class="dropdown-body ${openSections.offices ? '--open' : ''}">
                <div class="floor-checklist" id="office-checklist">
                  ${OFFICE_OPTIONS.map((o) => `
                    <label class="floor-option">
                      <input type="checkbox" name="offices" value="${o.id}" />
                      <div class="floor-option-info">
                        <span class="floor-option-label">${o.label} <span style="color: var(--accent); font-weight: 600;">${o.price}</span></span>
                        <span class="floor-option-desc">${o.description}</span>
                      </div>
                    </label>
                  `).join('')}
                </div>
                <p style="font-family: var(--font-expressive); font-size: 11px; color: var(--text-muted); margin-top: 8px;">Founding Citizenship ($150/mo) required. All offices include 24/7 access, meeting rooms, gym, kitchen & lounge.</p>
              </div>
            </div>
            ` : ''}

            <!-- Personal Info dropdown -->
            <div class="dropdown-section">
              <button type="button" class="dropdown-toggle" data-section="info">
                <span class="dropdown-label">Personal Info</span>
                <span class="dropdown-arrow ${openSections.info ? '--open' : ''}">›</span>
              </button>
              <div class="dropdown-body ${openSections.info ? '--open' : ''}">
                <div class="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="guestName" placeholder="Your name" required />
                </div>
                <div class="form-group">
                  <label>Email *</label>
                  <input type="email" name="guestEmail" placeholder="you@example.com" required />
                </div>
                <div class="form-group">
                  <label>Phone *</label>
                  <input type="tel" name="guestPhone" placeholder="+1 (555) 000-0000" required />
                </div>
              </div>
            </div>

            <!-- Availability dropdown -->
            <div class="dropdown-section">
              <button type="button" class="dropdown-toggle" data-section="availability">
                <span class="dropdown-label">Availability${slots.length > 0 ? ` <span class="dropdown-count">${slots.length}</span>` : ''}</span>
                <span class="dropdown-arrow ${openSections.availability ? '--open' : ''}">›</span>
              </button>
              <div class="dropdown-body ${openSections.availability ? '--open' : ''}">
                <div class="form-group" style="margin-bottom: 8px;">
                  <div class="slot-picker">
                    <div class="slot-picker-date">
                      <input type="date" id="slot-date" min="${today}" />
                    </div>
                    <div class="slot-picker-time">
                      <select id="slot-start">${timeOptionsHTML}</select>
                      <span class="slot-picker-to">to</span>
                      <select id="slot-end">${timeOptionsHTML.replace('value="10:00"', 'value="10:00" selected')}</select>
                      <button type="button" class="slot-add-btn" id="add-slot">+</button>
                    </div>
                  </div>
                </div>

                <div id="slot-list" class="slot-chips">
                  ${slots.length === 0 ? '<p class="slot-empty">Add at least one time slot</p>' : ''}
                  ${slots.map((s, i) => `
                    <div class="slot-chip">
                      <span>${formatSlot(s)}</span>
                      <button type="button" class="slot-remove" data-idx="${i}">&times;</button>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <button type="submit" class="btn-primary" id="submit-btn" style="margin-top: 12px;" ${slots.length === 0 ? 'disabled' : ''}>
              Submit Request
            </button>
          </div>
          ` : ''}
        </form>
      </div>
    `;

    // Type selector
    container.querySelectorAll('.type-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedType = (btn as HTMLElement).dataset.type as RequestType;
        render();
      });
    });

    // Dropdown toggles
    container.querySelectorAll('.dropdown-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const section = (btn as HTMLElement).dataset.section!;
        openSections[section] = !openSections[section];
        render();
      });
    });

    // Add slot
    container.querySelector('#add-slot')?.addEventListener('click', () => {
      const dateEl = container.querySelector('#slot-date') as HTMLInputElement;
      const startEl = container.querySelector('#slot-start') as HTMLSelectElement;
      const endEl = container.querySelector('#slot-end') as HTMLSelectElement;

      if (!dateEl.value) {
        showToast('Please select a date', 'error');
        return;
      }
      if (startEl.value >= endEl.value) {
        showToast('End time must be after start time', 'error');
        return;
      }

      slots.push({ date: dateEl.value, startTime: startEl.value, endTime: endEl.value });
      render();
    });

    // Remove slot
    container.querySelectorAll('.slot-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset.idx!);
        slots.splice(idx, 1);
        render();
      });
    });

    // Submit
    container.querySelector('#guest-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedType || slots.length === 0) return;

      const submitBtn = container.querySelector('#submit-btn') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        const fd = new FormData(e.target as HTMLFormElement);
        const selectedFloors: string[] = [];
        const selectedOffices: string[] = [];
        if (selectedType === 'tour') {
          container.querySelectorAll<HTMLInputElement>('input[name="floors"]:checked').forEach((cb) => {
            selectedFloors.push(cb.value);
          });
        }
        if (selectedType === 'office') {
          container.querySelectorAll<HTMLInputElement>('input[name="offices"]:checked').forEach((cb) => {
            selectedOffices.push(cb.value);
          });
        }

        const request: GuestRequest = {
          id: generateId(),
          type: selectedType,
          status: 'open',
          guestName: fd.get('guestName') as string,
          guestEmail: fd.get('guestEmail') as string,
          guestPhone: fd.get('guestPhone') as string,
          interestedFloors: selectedFloors.length > 0 ? selectedFloors : undefined,
          interestedOffices: selectedOffices.length > 0 ? selectedOffices : undefined,
          availableSlots: [...slots],
          declinedBy: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await addRequest(request);
        navigate(`/guest/success/${request.id}`);
      } catch (err) {
        showToast(`Failed: ${err}`, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
      }
    });
  }

  render();
}
