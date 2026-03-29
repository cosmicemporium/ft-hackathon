export interface TimeSlot {
  date: string;       // 'YYYY-MM-DD'
  startTime: string;  // 'HH:MM' (24h)
  endTime: string;    // 'HH:MM' (24h)
}

export type RequestType = 'tour' | 'office' | 'membership';

export type RequestStatus = 'open' | 'accepted' | 'proposed' | 'completed';

export interface TowerFloor {
  id: string;
  label: string;
  description: string;
}

export const TOWER_FLOORS: TowerFloor[] = [
  { id: 'ground', label: 'Ground Floor — Entrance', description: 'Main entrance to Frontier Tower' },
  { id: 'mezzanine', label: 'Mezzanine — Co-Living 1', description: 'Co-living space for residents' },
  { id: 'floor-2', label: 'Floor 2 — Event & Hackathon Space', description: 'Event space for hackathons, talks & launches' },
  { id: 'floor-3', label: 'Floor 3 — Private Offices', description: 'Private offices for teams' },
  { id: 'floor-4', label: 'Floor 4 — Robotics & Hard Tech', description: 'Robotics and hardware technology' },
  { id: 'floor-5', label: 'Floor 5 — Movement Floor & Fitness Center', description: 'Fitness center and movement space' },
  { id: 'floor-6', label: 'Floor 6 — Arts & Music', description: 'Creative arts and music space' },
  { id: 'floor-7', label: 'Floor 7 — Frontier Maker Space', description: 'Prototyping and maker tools' },
  { id: 'floor-8', label: 'Floor 8 — Neuro & Biotech', description: 'Neuroscience and biotechnology' },
  { id: 'floor-9', label: 'Floor 9 — AI & Autonomous Systems', description: 'AI research and autonomous systems' },
  { id: 'floor-10', label: 'Floor 10 — Frontier @ Accelerate', description: 'Accelerator program space' },
  { id: 'floor-11', label: 'Floor 11 — Health & Longevity', description: 'Health science and longevity research' },
  { id: 'floor-12', label: 'Floor 12 — Ethereum & Decentralized Tech', description: 'Ethereum and decentralized technologies' },
  { id: 'floor-13', label: 'Floor 13 — Frontier Labs', description: 'Experimental research and frontier science' },
  { id: 'floor-14', label: 'Floor 14 — Human Flourishing', description: 'Human flourishing and wellbeing' },
  { id: 'floor-15', label: 'Floor 15 — Coworking & The Library', description: 'Coworking space and library' },
  { id: 'floor-16', label: 'Floor 16 — d/acc Lounge', description: 'Cross-pollination lounge for the community' },
];

export interface OfficeOption {
  id: string;
  label: string;
  description: string;
  price: string;
}

export const OFFICE_OPTIONS: OfficeOption[] = [
  { id: 'office-208', label: 'Office 208', description: 'Private office for 1–2 people', price: '$1,000/mo' },
  { id: 'office-209', label: 'Office 209', description: 'Private office for 2–4 people', price: '$2,000/mo' },
  { id: 'office-210', label: 'Office 210', description: 'Private office for 4–6 people', price: '$3,000/mo' },
  { id: 'office-suite', label: 'Team Suite', description: 'Large suite for 6–10 people, premium floor', price: '$4,000/mo' },
];

export interface GuestRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  interestedFloors?: string[];  // floor IDs for tour requests
  interestedOffices?: string[]; // office IDs for office requests
  availableSlots: TimeSlot[];
  acceptedBy?: string;
  acceptedById?: number;
  selectedSlot?: TimeSlot;
  proposedSlot?: TimeSlot;
  declinedBy: string[];
  completedAt?: string;
  rewardAmount?: string;
  rewardCurrency?: 'FND' | 'iFND';
  payoutTxHash?: string;
  createdAt: string;
  updatedAt: string;
}

export type BadgeTier = 'none' | 'helper' | 'ambassador' | 'champion';

export interface MemberStats {
  acceptances: number;
  completions: number;
  badge: BadgeTier;
}

export interface AppConfig {
  defaultRewardAmount: string;
  rewardCurrency: 'FND' | 'iFND';
}

export const DEFAULT_CONFIG: AppConfig = {
  defaultRewardAmount: '10',
  rewardCurrency: 'iFND',
};
