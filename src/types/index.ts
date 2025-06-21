export interface User {
  id: string;
  walletAddress: string;
  userType: 'business' | 'customer';
  profile: UserProfile;
  createdAt: Date;
}

export interface UserProfile {
  name: string;
  email?: string;
  avatar?: string;
  isVerified: boolean;
}

export interface BusinessProfile extends UserProfile {
  businessName: string;
  description: string;
  category: string;
  location: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenName?: string;
}

export interface CustomerProfile extends UserProfile {
  preferences: string[];
  loyaltyTokens: LoyaltyToken[];
}

export interface LoyaltyToken {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  balance: string;
  businessId: string;
  businessName: string;
  earnRate: number;
  redeemOptions: RedeemOption[];
}

export interface RedeemOption {
  id: string;
  title: string;
  description: string;
  cost: string;
  category: string;
  isAvailable: boolean;
}

export interface Transaction {
  id: string;
  hash: string;
  type: 'earn' | 'redeem' | 'donate' | 'transfer';
  amount: string;
  tokenSymbol: string;
  fromAddress: string;
  toAddress: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  metadata?: TransactionMetadata;
}

export interface TransactionMetadata {
  businessName?: string;
  redeemOptionId?: string;
  projectId?: string;
  description?: string;
}

export interface CommunityProject {
  id: string;
  title: string;
  description: string;
  category: string;
  walletAddress: string;
  targetAmount?: string;
  currentAmount: string;
  donorCount: number;
  imageUrl?: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  tags: string[];
}

export interface Donation {
  id: string;
  donorAddress: string;
  projectId: string;
  amount: string;
  tokenSymbol: string;
  transactionHash: string;
  timestamp: Date;
  isAnonymous: boolean;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  duration?: number;
}

// Freighter Wallet Types
export interface FreighterApi {
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  getNetwork(): Promise<string>;
  getNetworkDetails(): Promise<{
    network: string;
    networkPassphrase: string;
    networkUrl: string;
  }>;
  signTransaction(xdr: string, opts?: {
    network?: string;
    networkPassphrase?: string;
    accountToSign?: string;
  }): Promise<string>;
  signBlob(blob: string, opts?: {
    accountToSign?: string;
  }): Promise<string>;
  signAuthEntry(entryXdr: string, opts?: {
    accountToSign?: string;
  }): Promise<string>;
}

declare global {
  interface Window {
    freighterApi?: FreighterApi;
  }
}
