import { navigate } from '../router';
import { setState } from '../state';

export function renderSplash(container: HTMLElement) {
  container.innerHTML = `
    <div class="splash">
      <div class="splash-bg"></div>

      <div class="splash-content">
        <div class="splash-logo-area motion-reveal --visible">
          <img src="/assets/logomark.svg" alt="Frontier Tower" class="splash-logo" />
        </div>

        <div class="splash-text motion-reveal --visible" style="transition-delay: 200ms;">
          <h1 class="splash-title">Frontier<br/>Tower</h1>
          <div class="glow-line" style="margin: 16px auto; max-width: 100px;"></div>
          <p class="splash-tagline">The Vertical Village</p>
          <p class="splash-desc">16 floors of builders, creators, and frontier technology — under one roof in San Francisco.</p>
        </div>

        <div class="splash-actions motion-reveal --visible" style="transition-delay: 400ms;">
          <button class="btn-primary splash-btn" id="splash-guest">
            I'm a Guest
          </button>
          <button class="btn-secondary splash-btn" id="splash-member">
            I'm a Member
          </button>
          <button class="splash-status-link" id="splash-status">
            Check request status →
          </button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#splash-guest')?.addEventListener('click', () => {
    setState({ isGuestMode: true });
    navigate('/guest');
  });

  container.querySelector('#splash-member')?.addEventListener('click', () => {
    setState({ isGuestMode: false });
    navigate('/member');
  });

  container.querySelector('#splash-status')?.addEventListener('click', () => {
    navigate('/guest/status');
  });
}
