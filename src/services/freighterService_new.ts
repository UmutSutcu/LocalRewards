import { FreighterApi } from '@/types';

class FreighterWalletService {
  private freighterApi: FreighterApi | null = null;

  constructor() {
    this.initializeFreighter();
  }

  private initializeFreighter() {
    this.freighterApi = window.freighterApi || null;
  }

  /**
   * Check if Freighter is installed with multiple detection methods
   */
  async isFreighterInstalled(): Promise<boolean> {
    // Method 1: Direct window check
    if (window.freighterApi) {
      this.freighterApi = window.freighterApi;
      return true;
    }

    // Method 2: Check for Freighter in different ways
    if (typeof window !== 'undefined') {
      // Check if freighter is in window object with different keys
      const freighterChecks = [
        window.freighterApi,
        (window as any).freighter,
        (window as any).stellar,
        (window as any).StellarFreighter
      ];
      
      for (const check of freighterChecks) {
        if (check && typeof check.getPublicKey === 'function') {
          this.freighterApi = check;
          return true;
        }
      }
    }

    // Method 3: Wait for potential async loading
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 30; // 3 seconds
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (window.freighterApi) {
          this.freighterApi = window.freighterApi;
          clearInterval(checkInterval);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
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
   * Get public key from Freighter
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
      throw new Error('Failed to get public key from Freighter');
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
   * Connect to Freighter (request permission)
   */
  async connect(): Promise<{
    publicKey: string;
    network: string;
  }> {
    // Ensure Freighter is detected
    const isInstalled = await this.isFreighterInstalled();
    if (!isInstalled || !this.freighterApi) {
      throw new Error('Freighter is not installed. Please install Freighter extension.');
    }

    try {
      // Try to get public key directly - this will trigger permission request if needed
      const publicKey = await this.freighterApi.getPublicKey();
      const network = await this.freighterApi.getNetwork();

      return {
        publicKey,
        network
      };
    } catch (error) {
      console.error('Error connecting to Freighter:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('User declined access') || error.message.includes('denied')) {
          throw new Error('Connection to Freighter was declined by user');
        }
        if (error.message.includes('not found') || error.message.includes('not installed')) {
          throw new Error('Freighter extension not found. Please install Freighter.');
        }
      }
      
      throw new Error('Failed to connect to Freighter wallet. Please try again.');
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
  }

  /**
   * Force refresh Freighter detection
   */
  async refreshDetection(): Promise<boolean> {
    this.freighterApi = null;
    this.initializeFreighter();
    return await this.isFreighterInstalled();
  }
}

export default new FreighterWalletService();
