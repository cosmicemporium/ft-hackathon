import './styles/global.css';
import './styles/components.css';
import { initSDK, getCurrentUser, getWalletAddress, getFormattedBalance, ensureConfig, seedMockData, getMemberStats } from './sdk';
import { addRoute, startRouter } from './router';
import { setState, getState } from './state';
import { renderNavBar } from './components/nav-bar';
import { renderSplash } from './views/splash';
import { renderGuestForm } from './views/guest-form';
import { renderGuestSuccess } from './views/guest-success';
import { renderGuestStatus } from './views/guest-status';
import { renderMemberQueue } from './views/member-queue';
import { renderRequestDetail } from './views/request-detail';
import { renderMyAccepted } from './views/my-accepted';
import { renderScanComplete } from './views/scan-complete';
import { renderLeaderboard } from './views/leaderboard';

async function boot() {
  const app = document.getElementById('app')!;
  app.innerHTML = '<div class="page"><div class="spinner"></div></div>';

  try {
    initSDK();

    // Load user data in parallel
    const [user, walletAddress, balance] = await Promise.all([
      getCurrentUser(),
      getWalletAddress(),
      getFormattedBalance(),
    ]);

    await ensureConfig();
    await seedMockData();

    const stats = await getMemberStats(user.id);

    setState({
      isGuestMode: true,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      userId: user.id,
      walletAddress,
      balanceFormatted: balance.total,
      memberStats: stats,
    });

    // Splash / landing
    addRoute('/', () => {
      renderSplash(app);
      // Remove nav bar on splash
      const existing = document.body.querySelector('.nav-bar');
      if (existing) existing.remove();
    });

    // Guest routes
    addRoute('/guest', () => {
      renderGuestForm(app);
      renderNavBar(document.body);
    });

    addRoute('/guest/success/:id', (params) => {
      renderGuestSuccess(app, params);
      renderNavBar(document.body);
    });

    addRoute('/guest/status', () => {
      renderGuestStatus(app);
      renderNavBar(document.body);
    });

    // Member routes
    addRoute('/member', () => {
      renderMemberQueue(app);
      renderNavBar(document.body);
    });

    addRoute('/request/:id', (params) => {
      renderRequestDetail(app, params);
      renderNavBar(document.body);
    });

    addRoute('/accepted', () => {
      renderMyAccepted(app);
      renderNavBar(document.body);
    });

    addRoute('/scan', () => {
      renderScanComplete(app);
      renderNavBar(document.body);
    });

    addRoute('/leaderboard', () => {
      renderLeaderboard(app);
      renderNavBar(document.body);
    });

    startRouter();

    // Default to splash
    if (!window.location.hash || window.location.hash === '#/') {
      window.location.hash = '/';
    }
  } catch (err) {
    console.error('Boot failed:', err);
  }
}

boot();
