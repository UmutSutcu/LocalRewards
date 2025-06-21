// Backend API types
export interface User {
  id: string;
  walletAddress: string;
  userType: 'business' | 'customer';
  profile: BusinessProfile | CustomerProfile;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  businessName: string;
  businessType: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

export interface CustomerProfile {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  preferences?: Record<string, unknown>;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  endDate: string;
  category: string;
  organizerAddress: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}
