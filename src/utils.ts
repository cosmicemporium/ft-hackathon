import type { ReferralStatus, ReferralType } from './types';

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export const STATUS_COLORS: Record<ReferralStatus, string> = {
  pending: '#f59e0b',
  contacted: '#3b82f6',
  converted: '#10b981',
  paid: '#8b5cf6',
  rejected: '#ef4444',
};

export const TYPE_LABELS: Record<ReferralType, string> = {
  tour: 'Tour',
  office: 'Office',
  member: 'Member',
};

export const TYPE_ICONS: Record<ReferralType, string> = {
  tour: '🏢',
  office: '🏠',
  member: '👤',
};

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
