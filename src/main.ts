import './styles/global.css';
import './styles/components.css';
import { initSDK, checkIsAdmin, getCurrentUser, getWalletAddress, getFormattedBalance, ensureConfig } from './sdk';
import { addRoute, startRouter } from './router';
import { setState } from './state';
import { renderNavBar } from './components/nav-bar';
import { renderMemberDashboard } from './views/member-dashboard';
import { renderCreateReferral } from './views/create-referral';
import { renderReferralDetail } from './views/referral-detail';
import { renderAdminDashboard } from './views/admin-dashboard';
import { renderAdminReferralDetail } from './views/admin-referral-detail';

async function boot() {
  const app = document.getElementById('app')!;
  app.innerHTML = '<div class="page"><div class="spinner"></div></div>';

  try {
    initSDK();

    // Load user data in parallel
    const [user, walletAddress, balance, isAdmin] = await Promise.all([
      getCurrentUser(),
      getWalletAddress(),
      getFormattedBalance(),
      checkIsAdmin(),
    ]);

    // Seed config if needed
    await ensureConfig();

    setState({
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      userId: user.id,
      walletAddress,
      balanceFormatted: balance.total,
      isAdmin,
    });

    // Set up routes
    addRoute('/', () => {
      renderMemberDashboard(app);
      renderNavBar(document.body);
    });

    addRoute('/create', () => {
      renderCreateReferral(app);
      renderNavBar(document.body);
    });

    addRoute('/referral/:id', (params) => {
      renderReferralDetail(app, params);
      renderNavBar(document.body);
    });

    addRoute('/admin', () => {
      if (!isAdmin) {
        window.location.hash = '/';
        return;
      }
      renderAdminDashboard(app);
      renderNavBar(document.body);
    });

    addRoute('/admin/referral/:id', (params) => {
      if (!isAdmin) {
        window.location.hash = '/';
        return;
      }
      renderAdminReferralDetail(app, params);
      renderNavBar(document.body);
    });

    startRouter();
  } catch (err) {
    // If not in Frontier app, renderStandaloneMessage already handled it
    console.error('Boot failed:', err);
  }
}

boot();
