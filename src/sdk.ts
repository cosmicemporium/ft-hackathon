import { FrontierSDK } from '@frontiertower/frontier-sdk';
import { isInFrontierApp, renderStandaloneMessage } from '@frontiertower/frontier-sdk/ui-utils';
import type { GuestRequest, AppConfig, MemberStats } from './types';
import { DEFAULT_CONFIG } from './types';
import { computeBadge } from './utils';

// ── Dev Mode ──
const DEV_MODE = !isInFrontierApp();

let sdk: FrontierSDK;
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

const REQUESTS_KEY = 'guest_requests';
const CONFIG_KEY = 'config';
const STATS_KEY = 'member_stats';

async function storageGet<T>(key: string): Promise<T | null> {
  if (DEV_MODE) return devStorage[key] ?? null;
  try {
    return await sdk.getStorage().get<T>(key);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: any): Promise<void> {
  if (DEV_MODE) {
    devStorage[key] = value;
    return;
  }
  await sdk.getStorage().set(key, value);
}

// ── Guest Requests CRUD ──

export async function getAllRequests(): Promise<GuestRequest[]> {
  return (await storageGet<GuestRequest[]>(REQUESTS_KEY)) ?? [];
}

export async function saveRequests(requests: GuestRequest[]): Promise<void> {
  await storageSet(REQUESTS_KEY, requests);
}

export async function addRequest(request: GuestRequest): Promise<void> {
  const all = await getAllRequests();
  all.unshift(request);
  await saveRequests(all);
}

export async function updateRequest(id: string, patch: Partial<GuestRequest>): Promise<void> {
  const all = await getAllRequests();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Request not found');
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  await saveRequests(all);
}

export async function getRequestById(id: string): Promise<GuestRequest | undefined> {
  const all = await getAllRequests();
  return all.find((r) => r.id === id);
}

// ── Config ──

export async function getConfig(): Promise<AppConfig> {
  return (await storageGet<AppConfig>(CONFIG_KEY)) ?? DEFAULT_CONFIG;
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await storageSet(CONFIG_KEY, config);
}

export async function ensureConfig(): Promise<AppConfig> {
  const config = await getConfig();
  if (!config.defaultRewardAmount) {
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  return config;
}

// ── Member Stats ──

export async function getMemberStats(userId: number): Promise<MemberStats> {
  const key = `${STATS_KEY}_${userId}`;
  const stats = await storageGet<MemberStats>(key);
  return stats ?? { acceptances: 0, completions: 0, badge: 'none' };
}

export async function updateMemberStats(userId: number, patch: Partial<MemberStats>): Promise<MemberStats> {
  const key = `${STATS_KEY}_${userId}`;
  const current = await getMemberStats(userId);
  const updated = { ...current, ...patch };
  updated.badge = computeBadge(updated.completions);
  await storageSet(key, updated);
  return updated;
}

export async function incrementAcceptance(userId: number): Promise<MemberStats> {
  const stats = await getMemberStats(userId);
  return updateMemberStats(userId, { acceptances: stats.acceptances + 1 });
}

export async function incrementCompletion(userId: number): Promise<MemberStats> {
  const stats = await getMemberStats(userId);
  return updateMemberStats(userId, { completions: stats.completions + 1 });
}

// ── User / Auth helpers ──

export async function getCurrentUser() {
  if (DEV_MODE) {
    return {
      id: 1,
      firstName: 'Dev',
      lastName: 'User',
      email: 'dev@frontiertower.io',
      isActive: true,
      dateJoined: new Date().toISOString(),
      isSuperuser: false,
    };
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
  if (DEV_MODE) {
    return { referralLink: 'https://frontiertower.io/r/dev-user', referralCount: 3, referralCode: 'DEV123', referredBy: null, ranking: 12 };
  }
  return sdk.getUser().getReferralOverview();
}

// ── Payout ──

export async function sendPayout(to: string, amount: string, currency: 'FND' | 'iFND') {
  if (DEV_MODE) {
    console.log(`[DEV MODE] Mock payout: ${amount} ${currency} to ${to}`);
    return {
      userOpHash: '0xmock',
      transactionHash: '0xmock_tx_' + Date.now(),
      blockNumber: 0n,
      success: true,
    };
  }
  if (currency === 'iFND') {
    return sdk.getWallet().transferInternalFrontierDollar(to, amount);
  }
  return sdk.getWallet().transferFrontierDollar(to, amount);
}

// ── Seed mock data (DEV_MODE) ──

export async function seedMockData(): Promise<void> {
  const existing = await getAllRequests();
  if (existing.length > 0) return;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const threeDays = new Date(now);
  threeDays.setDate(threeDays.getDate() + 3);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const mockRequests: GuestRequest[] = [
    {
      id: 'a1b2c3d4-1111-4000-8000-000000000001',
      type: 'tour',
      status: 'open',
      guestName: 'Sarah Chen',
      guestEmail: 'sarah@startup.io',
      guestPhone: '+1 (415) 555-0101',
      interestedFloors: ['floor-2', 'floor-9', 'floor-7', 'floor-16'],
      availableSlots: [
        { date: fmt(tomorrow), startTime: '10:00', endTime: '12:00' },
        { date: fmt(tomorrow), startTime: '14:00', endTime: '16:00' },
        { date: fmt(dayAfter), startTime: '09:00', endTime: '11:00' },
      ],
      declinedBy: [],
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: 'a1b2c3d4-2222-4000-8000-000000000002',
      type: 'office',
      status: 'open',
      guestName: 'Marcus Rivera',
      guestEmail: 'marcus@techcorp.com',
      guestPhone: '+1 (650) 555-0202',
      interestedOffices: ['office-209', 'office-210'],
      availableSlots: [
        { date: fmt(dayAfter), startTime: '13:00', endTime: '15:00' },
        { date: fmt(threeDays), startTime: '10:00', endTime: '12:00' },
      ],
      declinedBy: [],
      createdAt: new Date(now.getTime() - 7200000).toISOString(),
      updatedAt: new Date(now.getTime() - 7200000).toISOString(),
    },
    {
      id: 'a1b2c3d4-3333-4000-8000-000000000003',
      type: 'membership',
      status: 'open',
      guestName: 'Aisha Patel',
      guestEmail: 'aisha@design.studio',
      guestPhone: '+1 (510) 555-0303',
      availableSlots: [
        { date: fmt(tomorrow), startTime: '11:00', endTime: '12:00' },
        { date: fmt(dayAfter), startTime: '15:00', endTime: '17:00' },
        { date: fmt(threeDays), startTime: '09:30', endTime: '11:00' },
      ],
      declinedBy: [],
      createdAt: new Date(now.getTime() - 1800000).toISOString(),
      updatedAt: new Date(now.getTime() - 1800000).toISOString(),
    },
    {
      id: 'a1b2c3d4-4444-4000-8000-000000000004',
      type: 'tour',
      status: 'open',
      guestName: 'Jake Morrison',
      guestEmail: 'jake@venture.capital',
      guestPhone: '+1 (415) 555-0404',
      interestedFloors: ['floor-4', 'floor-8', 'floor-12', 'floor-16'],
      availableSlots: [
        { date: fmt(threeDays), startTime: '14:00', endTime: '16:00' },
      ],
      declinedBy: [],
      createdAt: new Date(now.getTime() - 600000).toISOString(),
      updatedAt: new Date(now.getTime() - 600000).toISOString(),
    },
  ];

  await saveRequests(mockRequests);
}
