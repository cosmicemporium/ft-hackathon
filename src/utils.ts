import type { RequestStatus, RequestType, BadgeTier, TimeSlot } from './types';

export function generateId(): string {
  return crypto.randomUUID();
}

export function shortId(id: string): string {
  return id.split('-')[0].toUpperCase();
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatSlotDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime24to12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function formatSlot(slot: TimeSlot): string {
  return `${formatSlotDate(slot.date)}, ${formatTime24to12(slot.startTime)} – ${formatTime24to12(slot.endTime)}`;
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

export const STATUS_COLORS: Record<RequestStatus, string> = {
  open: '#f59e0b',
  accepted: '#3b82f6',
  proposed: '#8b5cf6',
  completed: '#10b981',
};

export const TYPE_LABELS: Record<RequestType, string> = {
  tour: 'Tour',
  office: 'Office',
  membership: 'Membership',
};

export const TYPE_ICONS: Record<RequestType, string> = {
  tour: '🏢',
  office: '🏠',
  membership: '👤',
};

export const BADGE_LABELS: Record<BadgeTier, string> = {
  none: '',
  helper: 'Helper',
  ambassador: 'Ambassador',
  champion: 'Champion',
};

export const BADGE_ICONS: Record<BadgeTier, string> = {
  none: '',
  helper: '🌟',
  ambassador: '⭐',
  champion: '🏆',
};

export function computeBadge(completions: number): BadgeTier {
  if (completions >= 30) return 'champion';
  if (completions >= 15) return 'ambassador';
  if (completions >= 5) return 'helper';
  return 'none';
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let h = 9; h <= 18; h++) {
    times.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 18) times.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return times;
}
