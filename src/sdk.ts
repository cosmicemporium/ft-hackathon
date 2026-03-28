import { FrontierSDK } from '@frontiertower/frontier-sdk';
import { isInFrontierApp, renderStandaloneMessage } from '@frontiertower/frontier-sdk/ui-utils';
import type { Referral, AppConfig } from './types';
import { DEFAULT_CONFIG } from './types';

// ── Dev Mode ──
// Set to true to run standalone with mock data (no PWA needed)
const DEV_MODE = !isInFrontierApp();

let sdk: FrontierSDK;

// Local storage mock for dev mode
const devStorage: Record<string, any> = {};

export function initSDK(): FrontierSDK {
  if (DEV_MODE) {
    console.log('[DEV MODE] Running with mock SDK data');
    return {} as FrontierSDK;
  }
  sdk = new FrontierSDK();
  return sdk;
}

export function getSDK(): FrontierSDK {
  return sdk;
}

// ── Storage helpers ──

const REFERRALS_KEY = 'referrals';
const CONFIG_KEY = 'config';

export async function getAllReferrals(): Promise<Referral[]> {
  if (DEV_MODE) {
    return devStorage[REFERRALS_KEY] ?? [];
  }
  try {
    const data = await sdk.getStorage().get<Referral[]>(REFERRALS_KEY);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function saveReferrals(referrals: Referral[]): Promise<void> {
  if (DEV_MODE) {
    devStorage[REFERRALS_KEY] = referrals;
    return;
  }
  await sdk.getStorage().set(REFERRALS_KEY, referrals);
}

export async function addReferral(referral: Referral): Promise<void> {
  const all = await getAllReferrals();
  all.unshift(referral);
  await saveReferrals(all);
}

export async function updateReferral(id: string, patch: Partial<Referral>): Promise<void> {
  const all = await getAllReferrals();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Referral not found');
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  await saveReferrals(all);
}

export async function getReferralById(id: string): Promise<Referral | undefined> {
  const all = await getAllReferrals();
  return all.find((r) => r.id === id);
}

export async function getConfig(): Promise<AppConfig> {
  if (DEV_MODE) {
    return devStorage[CONFIG_KEY] ?? DEFAULT_CONFIG;
  }
  try {
    const data = await sdk.getStorage().get<AppConfig>(CONFIG_KEY);
    return data ?? DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  if (DEV_MODE) {
    devStorage[CONFIG_KEY] = config;
    return;
  }
  await sdk.getStorage().set(CONFIG_KEY, config);
}

export async function ensureConfig(): Promise<AppConfig> {
  const config = await getConfig();
  if (!config.adminEmails) {
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  return config;
}

// ── User / Auth helpers ──

export async function checkIsAdmin(): Promise<boolean> {
  if (DEV_MODE) return true;
  try {
    const access = await sdk.getUser().getVerifiedAccessControls();
    if (access.isSuperuser) return true;
    const config = await getConfig();
    return config.adminEmails.includes(access.email);
  } catch {
    return false;
  }
}

export async function getCurrentUser() {
  if (DEV_MODE) {
    return { id: 1, firstName: 'Dev', lastName: 'User', email: 'dev@frontiertower.io', isActive: true, dateJoined: new Date().toISOString(), isSuperuser: false };
  }
  return sdk.getUser().getDetails();
}

export async function getWalletAddress(): Promise<string> {
  if (DEV_MODE) return '0xDEV0000000000000000000000000000000000001';
  return sdk.getWallet().getAddress();
}

export async function getFormattedBalance() {
  if (DEV_MODE) return { total: '$250.00', fnd: '$200.00', internalFnd: '$50.00' };
  return sdk.getWallet().getBalanceFormatted();
}

export async function getPlatformReferralInfo() {
  if (DEV_MODE) return { referralLink: 'https://frontiertower.io/r/dev-user', totalReferrals: 3, convertedReferrals: 1 };
  return sdk.getUser().getReferralOverview();
}

// ── Payout ──

export async function sendPayout(
  to: string,
  amount: string,
  currency: 'FND' | 'iFND'
) {
  if (DEV_MODE) {
    console.log(`[DEV MODE] Mock payout: ${amount} ${currency} to ${to}`);
    return { userOpHash: '0xmock', transactionHash: '0xmock_tx_' + Date.now(), blockNumber: 0n, success: true };
  }
  if (currency === 'iFND') {
    return sdk.getWallet().transferInternalFrontierDollar(to, amount);
  }
  return sdk.getWallet().transferFrontierDollar(to, amount);
}
