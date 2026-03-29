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
        <div class="page-header">
          <h1>Complete Request</h1>
        </div>

        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 20px;">
          Scan the guest's QR code or enter their request code to mark a visit as completed.
        </p>

        <div class="card" style="margin-bottom: 20px; text-align: center;">
          <div id="camera-area" style="margin-bottom: 16px;">
            <button class="btn-primary" id="start-scan" style="margin-bottom: 12px;">
              Open Camera
            </button>
            <video id="scan-video" style="width: 100%; max-width: 300px; border-radius: 12px; display: none;" playsinline></video>
            <canvas id="scan-canvas" style="display: none;"></canvas>
          </div>

          <div style="color: var(--text-muted); font-size: 13px; margin: 12px 0;">or enter code manually</div>

          <div style="display: flex; gap: 8px;">
            <input type="text" id="manual-code" placeholder="Request code (e.g. A1B2C3D4)" style="text-transform: uppercase; font-family: monospace; letter-spacing: 1px;" />
            <button class="btn-primary" id="submit-code" style="width: auto; padding: 12px 20px;">Go</button>
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

    // Try to detect QR code using BarcodeDetector API if available
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
      // Fallback: no native QR detection, just keep showing camera
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

    // Try to find request by short ID prefix
    const all = await getAllRequests();
    const match = all.find((r) => r.id.toUpperCase().startsWith(code) || shortId(r.id) === code);

    if (match) {
      await completeRequest(match.id);
    } else {
      // Try as full UUID
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
          <div class="card" style="border-color: var(--danger);">
            <p style="color: var(--danger); font-weight: 600;">Request not found</p>
            <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Check the code and try again</p>
          </div>`;
        return;
      }

      if (request.status === 'completed') {
        resultArea.innerHTML = `
          <div class="card" style="border-color: var(--warning);">
            <p style="color: var(--warning); font-weight: 600;">Already completed</p>
            <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">${request.guestName}'s ${TYPE_LABELS[request.type].toLowerCase()} was already marked done</p>
          </div>`;
        return;
      }

      // Get config for reward amount
      const config = await getConfig();
      const walletAddress = state.walletAddress || await getWalletAddress();

      // Send payout
      let txHash = '';
      try {
        const receipt = await sendPayout(walletAddress, config.defaultRewardAmount, config.rewardCurrency);
        txHash = receipt.transactionHash;
      } catch (err) {
        console.error('Payout failed:', err);
      }

      // Mark complete
      await updateRequest(requestId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        rewardAmount: config.defaultRewardAmount,
        rewardCurrency: config.rewardCurrency,
        payoutTxHash: txHash || undefined,
        acceptedBy: request.acceptedBy || state.userName,
        acceptedById: request.acceptedById || state.userId,
      });

      // Increment stats
      const stats = await incrementCompletion(state.userId);
      setState({ memberStats: stats });

      resultArea.innerHTML = `
        <div class="card" style="border-color: var(--success); text-align: center;">
          <div style="font-size: 36px; margin-bottom: 8px;">🎉</div>
          <p style="color: var(--success); font-weight: 700; font-size: 18px;">Completed!</p>
          <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">
            ${request.guestName}'s ${TYPE_LABELS[request.type].toLowerCase()}
          </p>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
            <p style="color: var(--accent); font-weight: 600;">+$${config.defaultRewardAmount} ${config.rewardCurrency}</p>
            <p style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">
              ${stats.completions} total completion${stats.completions > 1 ? 's' : ''}
              ${stats.badge !== 'none' ? ` · ${stats.badge} badge` : ''}
            </p>
          </div>
        </div>`;

      showToast(`+$${config.defaultRewardAmount} ${config.rewardCurrency} earned!`);
    } catch (err) {
      resultArea.innerHTML = `
        <div class="card" style="border-color: var(--danger);">
          <p style="color: var(--danger); font-weight: 600;">Error</p>
          <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">${err}</p>
        </div>`;
    }
  }

  render();

  // Cleanup camera on navigation
  return () => stopCamera();
}
