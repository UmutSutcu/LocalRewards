import axios, { AxiosInstance } from 'axios';
import { 
  BusinessProfile, 
  CustomerProfile, 
  CommunityProject, 
  Transaction,
  LoyaltyToken 
} from '@/types';

// Local types for API responses
interface User {
  id: string;
  walletAddress: string;
  userType: 'business' | 'customer';
  profile: BusinessProfile | CustomerProfile;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface Donation {
  id: string;
  projectId: string;
  amount: string;
  tokenSymbol: string;
  transactionHash: string;
  donorAddress: string;
  isAnonymous: boolean;
  timestamp: string;
}

class BackendService {
  private api: AxiosInstance;
  private baseURL: string;
  constructor() {
    this.baseURL = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'http://localhost:3001/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(userData: {
    walletAddress: string;
    userType: 'business' | 'customer';
    profile: Partial<BusinessProfile | CustomerProfile>;
  }): Promise<AuthResponse> {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async login(walletAddress: string): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login', { walletAddress });
    return response.data;
  }

  // Business endpoints
  async createBusiness(businessData: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const response = await this.api.post('/businesses', businessData);
    return response.data;
  }

  async updateBusiness(businessId: string, businessData: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const response = await this.api.put(`/businesses/${businessId}`, businessData);
    return response.data;
  }

  async getBusiness(businessId: string): Promise<BusinessProfile> {
    const response = await this.api.get(`/businesses/${businessId}`);
    return response.data;
  }

  async getBusinesses(params?: { 
    category?: string; 
    location?: string; 
    limit?: number; 
  }): Promise<BusinessProfile[]> {
    const response = await this.api.get('/businesses', { params });
    return response.data;
  }

  // Token endpoints
  async createToken(tokenData: {
    businessId: string;
    name: string;
    symbol: string;
    totalSupply?: string;
    contractAddress?: string;
  }): Promise<LoyaltyToken> {
    const response = await this.api.post('/tokens', tokenData);
    return response.data;
  }

  async getTokensByBusiness(businessId: string): Promise<LoyaltyToken[]> {
    const response = await this.api.get(`/businesses/${businessId}/tokens`);
    return response.data;
  }

  async getTokensByCustomer(customerAddress: string): Promise<LoyaltyToken[]> {
    const response = await this.api.get(`/customers/${customerAddress}/tokens`);
    return response.data;
  }

  // Transaction endpoints
  async recordTransaction(transactionData: {
    hash: string;
    type: 'earn' | 'redeem' | 'donate' | 'transfer';
    amount: string;
    tokenSymbol: string;
    fromAddress: string;
    toAddress: string;
    metadata?: Record<string, unknown>;
  }): Promise<Transaction> {
    const response = await this.api.post('/transactions', transactionData);
    return response.data;
  }

  async getTransactions(params?: {
    address?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    const response = await this.api.get('/transactions', { params });
    return response.data;
  }

  // Community project endpoints
  async getCommunityProjects(params?: {
    category?: string;
    isActive?: boolean;
    limit?: number;
  }): Promise<CommunityProject[]> {
    const response = await this.api.get('/projects', { params });
    return response.data;
  }

  async getCommunityProject(projectId: string): Promise<CommunityProject> {
    const response = await this.api.get(`/projects/${projectId}`);
    return response.data;
  }

  async createCommunityProject(projectData: Partial<CommunityProject>): Promise<CommunityProject> {
    const response = await this.api.post('/projects', projectData);
    return response.data;
  }

  async updateCommunityProject(projectId: string, projectData: Partial<CommunityProject>): Promise<CommunityProject> {
    const response = await this.api.put(`/projects/${projectId}`, projectData);
    return response.data;
  }

  // Donation endpoints
  async recordDonation(donationData: {
    projectId: string;
    amount: string;
    tokenSymbol: string;
    transactionHash: string;
    donorAddress: string;
    isAnonymous: boolean;
  }): Promise<Donation> {
    const response = await this.api.post('/donations', donationData);
    return response.data;
  }

  async getDonationsByProject(projectId: string): Promise<Donation[]> {
    const response = await this.api.get(`/projects/${projectId}/donations`);
    return response.data;
  }

  // Mock endpoints for demo
  async triggerTokenEarn(data: {
    customerAddress: string;
    businessId: string;
    amount: string;
    reason: string;
  }): Promise<{ success: boolean; transactionHash: string }> {
    const response = await this.api.post('/demo/earn-tokens', data);
    return response.data;
  }

  async triggerTokenRedeem(data: {
    customerAddress: string;
    businessId: string;
    amount: string;
    redeemOptionId: string;
  }): Promise<{ success: boolean; transactionHash: string; redeemCode?: string }> {
    const response = await this.api.post('/demo/redeem-tokens', data);
    return response.data;
  }
}

export const backendService = new BackendService();
export default backendService;
