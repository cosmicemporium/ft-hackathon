import { getState, setState } from '../state';
import { getRequestById, getAllRequests, updateRequest, incrementCompletion, getConfig, sendPayout, getWalletAddress } from '../sdk';
import { showToast } from '../components/toast';
import { TYPE_LABELS, shortId } from '../utils';

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

        <p style="font-family: var(--font-expressive); color: var(--text-secondary); font-size: 14px; margin-bottom: 24px;" class="motion-reveal --visible" style="transition-delay: 50ms;">
          Scan the guest's QR code or enter their request code to mark a visit as completed.
        </p>

        <div class="card motion-reveal --visible" style="margin-bottom: 24px; text-align: center; transition-delay: 100ms;">
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
          <div class="card" style="border-color: var(--discord); border-left: 3px solid var(--discord);">
            <p style="font-family: var(--font-monument); color: var(--discord); font-weight: 700; text-transform: uppercase; font-size: 14px;">Not Found</p>
            <p style="font-family: var(--font-expressive); color: var(--text-muted); font-size: 13px; margin-top: 6px;">Check the code and try again</p>
          </div>`;
        return;
      }

      if (request.status === 'completed') {
        resultArea.innerHTML = `
          <div class="card" style="border-color: var(--warning); border-left: 3px solid var(--warning);">
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

      resultArea.innerHTML = `
        <div class="card motion-reveal --visible" style="border-color: rgba(118, 74, 226, 0.25); text-align: center;">
          <div style="font-family: var(--font-monument); font-size: var(--type-display); font-weight: 700; text-transform: uppercase; color: var(--accent); line-height: 1; margin-bottom: 4px; text-shadow: 0 0 30px rgba(118,74,226,0.4);">Done</div>
          <div class="glow-line" style="margin: 12px auto; max-width: 80px;"></div>
          <p style="font-family: var(--font-expressive); color: var(--text-secondary); font-size: 14px;">
            ${request.guestName}'s ${TYPE_LABELS[request.type].toLowerCase()}
          </p>
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
            <p style="font-family: var(--font-monument); font-size: 24px; font-weight: 700; color: var(--accent); text-shadow: 0 0 20px rgba(118,74,226,0.4);">+$${config.defaultRewardAmount} ${config.rewardCurrency}</p>
            <p style="font-family: var(--font-brutalist); font-size: 10px; color: var(--text-muted); margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em;">
              ${stats.completions} completion${stats.completions > 1 ? 's' : ''}
              ${stats.badge !== 'none' ? ` · ${stats.badge}` : ''}
            </p>
          </div>
        </div>`;

      showToast(`+$${config.defaultRewardAmount} ${config.rewardCurrency} earned!`);
    } catch (err) {
      resultArea.innerHTML = `
        <div class="card" style="border-color: var(--discord); border-left: 3px solid var(--discord);">
          <p style="font-family: var(--font-monument); color: var(--discord); font-weight: 700; text-transform: uppercase; font-size: 14px;">Error</p>
          <p style="font-family: var(--font-expressive); color: var(--text-muted); font-size: 13px; margin-top: 6px;">${err}</p>
        </div>`;
    }
  }

  render();

  return () => stopCamera();
}
