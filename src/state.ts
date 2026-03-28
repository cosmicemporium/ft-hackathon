type Listener = () => void;

export interface AppState {
  isAdmin: boolean;
  userName: string;
  userEmail: string;
  userId: number;
  walletAddress: string;
  balanceFormatted: string;
  currentView: string;
}

const state: AppState = {
  isAdmin: false,
  userName: '',
  userEmail: '',
  userId: 0,
  walletAddress: '',
  balanceFormatted: '',
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
