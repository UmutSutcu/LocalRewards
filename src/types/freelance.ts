// StellarFreelance Types

export interface User {
  id: string;
  walletAddress: string;
  userType: 'employer' | 'freelancer';
  profile: UserProfile;
  createdAt: Date;
}

export interface UserProfile {
  name: string;
  email?: string;
  avatar?: string;
  isVerified: boolean;
}

export interface EmployerProfile extends UserProfile {
  companyName?: string;
  description?: string;
  website?: string;
  location?: string;
  totalJobsPosted: number;
  totalAmountSpent: number;
  averageRating: number;
}

export interface FreelancerProfile extends UserProfile {
  title?: string;
  bio?: string;
  skills: string[];
  hourlyRate?: number;
  preferredCurrency: 'XLM' | 'USDC';
  reputationTokens: ReputationToken[];
  totalEarnings: number;
  completedJobs: number;
  averageRating: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string[];
  budget: number;
  currency: 'XLM' | 'USDC';
  employerAddress: string;
  employerProfile: EmployerProfile;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  applicants: JobApplication[];
  selectedFreelancer?: string;
  escrowContractId?: string;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  tags?: string[];
}

export interface JobApplication {
  id: string;
  jobId: string;
  freelancerAddress: string;
  freelancerProfile: FreelancerProfile;
  proposal: string;
  quotedPrice: number;
  estimatedDuration: string;
  appliedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface EscrowContract {
  id: string;
  jobId: string;
  employerAddress: string;
  freelancerAddress: string;
  amount: number;
  currency: 'XLM' | 'USDC';
  status: 'locked' | 'released' | 'disputed' | 'refunded';
  createdAt: Date;
  releasedAt?: Date;
  disputeReason?: string;
}

export interface ReputationToken {
  id: string;
  tokenId: string; // Soroban token ID
  freelancerAddress: string;
  jobId: string;
  jobTitle: string;
  employerAddress: string;
  rating: number; // 1-5 stars
  review?: string;
  skillTags: string[];
  mintedAt: Date;
  isTransferable: false; // Soulbound Token
}

export interface Dispute {
  id: string;
  escrowContractId: string;
  jobId: string;
  initiatedBy: string; // wallet address
  reason: string;
  description: string;
  evidence?: string[];
  status: 'open' | 'resolved' | 'closed';
  resolution?: 'favor_employer' | 'favor_freelancer' | 'partial_refund';
  arbitratorAddress?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'job_application' | 'job_update' | 'payment_received' | 'dispute_opened' | 'reputation_earned';
  title: string;
  message: string;
  isRead: boolean;
  relatedJobId?: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JobFilters {
  search?: string;
  minBudget?: number;
  maxBudget?: number;
  currency?: 'XLM' | 'USDC';
  tags?: string[];
  employerRating?: number;
  sortBy?: 'newest' | 'oldest' | 'budget_high' | 'budget_low';
}

export interface FreelancerFilters {
  search?: string;
  skills?: string[];
  minRating?: number;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  currency?: 'XLM' | 'USDC';
  sortBy?: 'rating' | 'rate_low' | 'rate_high' | 'newest';
}

// Blockchain specific types
export interface StellarTransaction {
  hash: string;
  ledger: number;
  operation: string;
  amount: string;
  from: string;
  to: string;
  asset: string;
  timestamp: Date;
}

export interface ContractCall {
  contractId: string;
  method: string;
  params: any[];
  result?: any;
  transactionHash?: string;
  gasUsed?: number;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: {
    XLM: string;
    USDC: string;
  };
  isLoading: boolean;
  error: string | null;
}

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface TransactionResult {
  hash: string;
  status: TransactionStatus;
  message?: string;
  gasUsed?: number;
}
