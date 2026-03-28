import { FrontierSDK } from '@frontiertower/frontier-sdk';
import { isInFrontierApp, renderStandaloneMessage } from '@frontiertower/frontier-sdk/ui-utils';
import type { Referral, AppConfig } from './types';
import { DEFAULT_CONFIG } from './types';

let sdk: FrontierSDK;

export function initSDK(): FrontierSDK {
  if (!isInFrontierApp()) {
    renderStandaloneMessage(document.body, 'Referral OS');
    throw new Error('App must run inside Frontier Wallet');
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
  try {
    const data = await sdk.getStorage().get<Referral[]>(REFERRALS_KEY);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function saveReferrals(referrals: Referral[]): Promise<void> {
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
  try {
    const data = await sdk.getStorage().get<AppConfig>(CONFIG_KEY);
    return data ?? DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
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
  return sdk.getUser().getDetails();
}

export async function getWalletAddress(): Promise<string> {
  return sdk.getWallet().getAddress();
}

export async function getFormattedBalance() {
  return sdk.getWallet().getBalanceFormatted();
}

export async function getPlatformReferralInfo() {
  return sdk.getUser().getReferralOverview();
}

// ── Payout ──

export async function sendPayout(
  to: string,
  amount: string,
  currency: 'FND' | 'iFND'
) {
  if (currency === 'iFND') {
    return sdk.getWallet().transferInternalFrontierDollar(to, amount);
  }
  return sdk.getWallet().transferFrontierDollar(to, amount);
}
