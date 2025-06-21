import { FreighterApi } from '../types';
import { freighterDetector } from '../utils/freighterDetection';

class FreighterWalletService {
  private freighterApi: FreighterApi | null = null;
  constructor() {
    // Don't auto-initialize, detect only when needed
  }

  /**
   * Check if Freighter is installed with improved detection
   */
  async isFreighterInstalled(): Promise<boolean> {
    // Use enhanced detection utility
    const isDetected = await freighterDetector.detectFreighter();
    if (isDetected && !this.freighterApi) {
      this.freighterApi = window.freighterApi || null;
    }
    return isDetected;
  }

  /**
   * Check if Freighter is connected
   */
  async isConnected(): Promise<boolean> {
    if (!this.freighterApi) return false;
    
    try {
      return await this.freighterApi.isConnected();
    } catch (error) {
      console.error('Error checking Freighter connection:', error);
      return false;
    }
  }

  /**
   * Get public key from Freighter with better error handling
   */
  async getPublicKey(): Promise<string> {
    if (!this.freighterApi) {
      throw new Error('Freighter is not installed');
    }

    try {
      const publicKey = await this.freighterApi.getPublicKey();
      return publicKey;
    } catch (error) {
      console.error('Error getting public key from Freighter:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('User declined access') || error.message.includes('denied')) {
          throw new Error('Wallet connection was declined by user');
        }
        if (error.message.includes('not found') || error.message.includes('not installed')) {
          throw new Error('Freighter extension not found. Please install Freighter.');
        }
      }
      
      throw new Error('Failed to get public key from Freighter. Please try again.');
    }
  }

  /**
   * Get network from Freighter
   */
  async getNetwork(): Promise<string> {
    if (!this.freighterApi) {
      throw new Error('Freighter is not installed');
    }

    try {
      return await this.freighterApi.getNetwork();
    } catch (error) {
      console.error('Error getting network from Freighter:', error);
      throw new Error('Failed to get network from Freighter');
    }
  }

  /**
   * Get network details from Freighter
   */
  async getNetworkDetails() {
    if (!this.freighterApi) {
      throw new Error('Freighter is not installed');
    }

    try {
      return await this.freighterApi.getNetworkDetails();
    } catch (error) {
      console.error('Error getting network details from Freighter:', error);
      throw new Error('Failed to get network details from Freighter');
    }
  }

  /**
   * Sign transaction with Freighter
   */
  async signTransaction(xdr: string, opts?: {
    network?: string;
    networkPassphrase?: string;
    accountToSign?: string;
  }): Promise<string> {
    if (!this.freighterApi) {
      throw new Error('Freighter is not installed');
    }

    try {
      return await this.freighterApi.signTransaction(xdr, opts);
    } catch (error) {
      console.error('Error signing transaction with Freighter:', error);
      throw new Error('Failed to sign transaction with Freighter');
    }
  }
  /**
   * Connect to Freighter with improved error handling and user experience
   */
  async connect(): Promise<{
    publicKey: string;
    network: string;
  }> {
    // Ensure Freighter is detected
    const isInstalled = await this.isFreighterInstalled();
    if (!isInstalled || !this.freighterApi) {
      throw new Error('FREIGHTER_NOT_INSTALLED');
    }

    try {
      // Request connection permission and get public key
      const publicKey = await this.freighterApi.getPublicKey();
      const network = await this.freighterApi.getNetwork();

      return {
        publicKey,
        network
      };
    } catch (error) {
      console.error('Error connecting to Freighter:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('User declined') || error.message.includes('denied')) {
          throw new Error('USER_REJECTED');
        }
        if (error.message.includes('not found') || error.message.includes('not installed')) {
          throw new Error('FREIGHTER_NOT_INSTALLED');
        }
      }
      
      throw new Error('CONNECTION_FAILED');
    }
  }

  /**
   * Get installation URL for Freighter
   */
  getInstallationUrl(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      return 'https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk';
    } else if (userAgent.includes('Firefox')) {
      return 'https://addons.mozilla.org/en-US/firefox/addon/freighter/';
    } else {
      return 'https://www.freighter.app/';
    }
  }  /**
   * Force refresh Freighter detection
   */
  async refreshDetection(): Promise<boolean> {
    this.freighterApi = null;
    return await freighterDetector.forceRedetection();
  }

  /**
   * Check if user has required wallet connection for transactions
   */
  async requireWalletConnection(): Promise<{ publicKey: string; network: string }> {
    const isInstalled = await this.isFreighterInstalled();
    if (!isInstalled) {
      throw new Error('FREIGHTER_NOT_INSTALLED');
    }

    const isConnected = await this.isConnected();
    if (!isConnected) {
      // Try to connect
      return await this.connect();
    }

    // Already connected, just return the details
    const publicKey = await this.getPublicKey();
    const network = await this.getNetwork();
    
    return { publicKey, network };
  }
  /**
   * Get user-friendly error messages
   */
  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'FREIGHTER_NOT_INSTALLED':
        return 'Freighter wallet is not installed. Please install the Freighter extension.';
      case 'USER_REJECTED':
        return 'Wallet connection was declined by user.';
      case 'CONNECTION_FAILED':
        return 'Wallet connection failed. Please try again.';
      default:
        return 'An unknown error occurred.';
    }
  }
}

export default new FreighterWalletService();
