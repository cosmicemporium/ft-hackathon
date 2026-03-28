export type ReferralType = 'tour' | 'office' | 'member';

export type ReferralStatus = 'pending' | 'contacted' | 'converted' | 'paid' | 'rejected';

export interface Referral {
  id: string;
  type: ReferralType;
  status: ReferralStatus;
  referrerId: number;
  referrerEmail: string;
  referrerName: string;
  referrerWalletAddress: string;
  prospectName: string;
  prospectEmail: string;
  prospectPhone?: string;
  prospectCompany?: string;
  notes?: string;
  rewardAmount: string;
  rewardCurrency: 'FND' | 'iFND';
  payoutTxHash?: string;
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
  paidAt?: string;
}

export interface AppConfig {
  adminEmails: string[];
  defaultRewards: Record<ReferralType, string>;
  rewardCurrency: 'FND' | 'iFND';
}

export const DEFAULT_CONFIG: AppConfig = {
  adminEmails: [],
  defaultRewards: {
    tour: '10',
    office: '100',
    member: '25',
  },
  rewardCurrency: 'iFND',
};
