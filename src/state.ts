import type { MemberStats } from './types';

type Listener = () => void;

export interface AppState {
  isGuestMode: boolean;
  userName: string;
  userEmail: string;
  userId: number;
  walletAddress: string;
  balanceFormatted: string;
  memberStats: MemberStats;
  currentView: string;
}

const state: AppState = {
  isGuestMode: true,
  userName: '',
  userEmail: '',
  userId: 0,
  walletAddress: '',
  balanceFormatted: '',
  memberStats: { acceptances: 0, completions: 0, badge: 'none' },
  currentView: '/',
};

const listeners: Listener[] = [];

export function getState(): Readonly<AppState> {
  return state;
}

export function setState(partial: Partial<AppState>) {
  Object.assign(state, partial);
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}
