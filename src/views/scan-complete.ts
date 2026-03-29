import { getState, setState } from '../state';
import { getRequestById, getAllRequests, updateRequest, incrementCompletion, getConfig, sendPayout, getWalletAddress } from '../sdk';
import { showToast } from '../components/toast';
import { TYPE_LABELS, shortId, BADGE_LABELS, BADGE_ICONS } from '../utils';

function createConfetti(container: HTMLElement) {
  const colors = ['#764AE2', '#938DEE', '#ABF882', '#A86EDC', '#ffffff'];
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.setProperty('--x', `${Math.random() * 100}vw`);
    piece.style.setProperty('--delay', `${Math.random() * 600}ms`);
    piece.style.setProperty('--duration', `${1500 + Math.random() * 2000}ms`);
    piece.style.setProperty('--rotation', `${Math.random() * 720 - 360}deg`);
    piece.style.setProperty('--drift', `${Math.random() * 100 - 50}px`);
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = `${6 + Math.random() * 6}px`;
    piece.style.height = `${4 + Math.random() * 8}px`;
    confettiContainer.appendChild(piece);
  }

  container.appendChild(confettiContainer);
  setTimeout(() => confettiContainer.remove(), 4000);
}

function animateCounter(el: HTMLElement, target: number, prefix: string, suffix: string) {
  const duration = 1200;
  const start = performance.now();

  function step(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out expo
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = `${prefix}${current}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = `${prefix}${target}${suffix}`;
  }

  requestAnimationFrame(step);
}

export async function renderScanComplete(container: HTMLElement) {
  const state = getState();
  let scanning = false;
  let videoStream: MediaStream | null = null;

  function render() {
    container.innerHTML = `
      <div class="page">
        <div class="page-header motion-reveal --visible">
          <h1>Complete Request</h1>
        </div>

        <p style="font-family: var(--font-expressive); color: var(--text-secondary); font-size: 14px; margin-bottom: 24px;" class="motion-reveal --visible">
          Scan the guest's QR code or enter their request code to mark a visit as completed.
        </p>

        <div class="card motion-reveal --visible" style="margin-bottom: 24px; text-align: center;">
          <div id="camera-area" style="margin-bottom: 16px;">
            <button class="btn-primary" id="start-scan" style="margin-bottom: 12px;">
              Open Camera
            </button>
            <video id="scan-video" style="width: 100%; border-radius: 8px; border: 1px solid var(--border); display: none;" playsinline></video>
            <canvas id="scan-canvas" style="display: none;"></canvas>
          </div>

          <div class="glow-line" style="margin: 16px 0;"></div>

          <p style="font-family: var(--font-brutalist); font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px;">Or enter code manually</p>

          <div style="display: flex; gap: 8px;">
            <input type="text" id="manual-code" placeholder="A1B2C3D4" style="text-transform: uppercase; font-family: var(--font-brutalist); letter-spacing: 0.1em;" />
            <button class="btn-primary" id="submit-code" style="width: auto; padding: 12px 24px;">Go</button>
          </div>
        </div>

        <div id="result-area"></div>
      </div>
    `;

    container.querySelector('#start-scan')?.addEventListener('click', startCamera);
    container.querySelector('#submit-code')?.addEventListener('click', handleManualCode);
    container.querySelector('#manual-code')?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') handleManualCode();
    });
  }

  async function startCamera() {
    const video = container.querySelector('#scan-video') as HTMLVideoElement;
    const startBtn = container.querySelector('#start-scan') as HTMLButtonElement;

    try {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      video.srcObject = videoStream;
      video.style.display = 'block';
      startBtn.style.display = 'none';
      await video.play();
      scanning = true;
      scanFrame();
    } catch {
      showToast('Camera access denied. Use manual entry.', 'error');
    }
  }

  function scanFrame() {
    if (!scanning) return;
    const video = container.querySelector('#scan-video') as HTMLVideoElement;
    const canvas = container.querySelector('#scan-canvas') as HTMLCanvasElement;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      detector.detect(canvas).then((barcodes: any[]) => {
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          stopCamera();
          completeRequest(code);
          return;
        }
        if (scanning) requestAnimationFrame(scanFrame);
      }).catch(() => {
        if (scanning) requestAnimationFrame(scanFrame);
      });
    } else {
      if (scanning) requestAnimationFrame(scanFrame);
    }
  }

  function stopCamera() {
    scanning = false;
    if (videoStream) {
      videoStream.getTracks().forEach((t) => t.stop());
      videoStream = null;
    }
  }

  async function handleManualCode() {
    const input = container.querySelector('#manual-code') as HTMLInputElement;
    const code = input.value.trim().toUpperCase();
    if (!code) {
      showToast('Please enter a code', 'error');
      return;
    }

    const all = await getAllRequests();
    const match = all.find((r) => r.id.toUpperCase().startsWith(code) || shortId(r.id) === code);

    if (match) {
      await completeRequest(match.id);
    } else {
      await completeRequest(code.toLowerCase());
    }
  }

  async function completeRequest(requestId: string) {
    const resultArea = container.querySelector('#result-area')!;
    resultArea.innerHTML = '<div class="spinner"></div>';

    try {
      const request = await getRequestById(requestId);
      if (!request) {
        resultArea.innerHTML = `
          <div class="card" style="border-left: 3px solid var(--danger);">
            <p style="font-family: var(--font-monument); color: var(--danger); font-weight: 700; text-transform: uppercase; font-size: 14px;">Not Found</p>
            <p style="font-family: var(--font-expressive); color: var(--text-muted); font-size: 13px; margin-top: 6px;">Check the code and try again</p>
          </div>`;
        return;
      }

      if (request.status === 'completed') {
        resultArea.innerHTML = `
          <div class="card" style="border-left: 3px solid var(--warning);">
            <p style="font-family: var(--font-monument); color: var(--warning); font-weight: 700; text-transform: uppercase; font-size: 14px;">Already Completed</p>
            <p style="font-family: var(--font-expressive); color: var(--text-muted); font-size: 13px; margin-top: 6px;">${request.guestName}'s ${TYPE_LABELS[request.type].toLowerCase()} was already marked done</p>
          </div>`;
        return;
      }

      const config = await getConfig();
      const walletAddress = state.walletAddress || await getWalletAddress();

      let txHash = '';
      try {
        const receipt = await sendPayout(walletAddress, config.defaultRewardAmount, config.rewardCurrency);
        txHash = receipt.transactionHash;
      } catch (err) {
        console.error('Payout failed:', err);
      }

      await updateRequest(requestId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        rewardAmount: config.defaultRewardAmount,
        rewardCurrency: config.rewardCurrency,
        payoutTxHash: txHash || undefined,
        acceptedBy: request.acceptedBy || state.userName,
        acceptedById: request.acceptedById || state.userId,
      });

      const stats = await incrementCompletion(state.userId);
      setState({ memberStats: stats });

      const rewardNum = parseInt(config.defaultRewardAmount) || 10;
      const badgeLabel = stats.badge !== 'none' ? `${BADGE_ICONS[stats.badge]} ${BADGE_LABELS[stats.badge]}` : '';

      // Celebration!
      resultArea.innerHTML = `
        <div class="celebration-card motion-reveal --visible">
          <div class="celebration-glow"></div>
          <div class="celebration-content">
            <div class="celebration-check">✓</div>
            <p class="celebration-title">Visit Complete!</p>
            <p class="celebration-guest">${request.guestName}'s ${TYPE_LABELS[request.type].toLowerCase()}</p>

            <div class="celebration-reward">
              <p class="celebration-reward-label">Reward Earned</p>
              <p class="celebration-reward-amount" id="reward-counter">+$0 ${config.rewardCurrency}</p>
            </div>

            <div class="celebration-stats">
              <div class="celebration-stat">
                <span class="celebration-stat-value">${stats.completions}</span>
                <span class="celebration-stat-label">Total</span>
              </div>
              ${badgeLabel ? `
                <div class="celebration-stat">
                  <span class="celebration-stat-value" style="font-size: 20px;">${BADGE_ICONS[stats.badge]}</span>
                  <span class="celebration-stat-label">${BADGE_LABELS[stats.badge]}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>`;

      // Launch confetti
      createConfetti(container);

      // Animate the reward counter
      const counterEl = resultArea.querySelector('#reward-counter') as HTMLElement;
      if (counterEl) {
        setTimeout(() => animateCounter(counterEl, rewardNum, '+$', ` ${config.rewardCurrency}`), 300);
      }

      showToast(`+$${config.defaultRewardAmount} ${config.rewardCurrency} earned!`);
    } catch (err) {
      resultArea.innerHTML = `
        <div class="card" style="border-left: 3px solid var(--danger);">
          <p style="font-family: var(--font-monument); color: var(--danger); font-weight: 700; text-transform: uppercase; font-size: 14px;">Error</p>
          <p style="font-family: var(--font-expressive); color: var(--text-muted); font-size: 13px; margin-top: 6px;">${err}</p>
        </div>`;
    }
  }

  render();

  return () => stopCamera();
}
