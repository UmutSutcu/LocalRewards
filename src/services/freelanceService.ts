import * as StellarSdk from '@stellar/stellar-sdk';
import freighterApi from '@stellar/freighter-api';
import { EscrowContract, ReputationToken, TransactionResult } from '../types/freelance';

// Extract needed classes from StellarSdk
const { 
  Networks, 
  TransactionBuilder, 
  Operation, 
  Asset,
  BASE_FEE
} = StellarSdk;

// Types for Stellar API responses
interface StellarBalance {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

// Stellar Horizon server (Testnet)
// const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

// Testnet configuration
export const STELLAR_CONFIG = {
  networkPassphrase: Networks.TESTNET,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  friendbotUrl: 'https://friendbot.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
};

// Smart Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  ESCROW_CONTRACT: 'CESCROW_CONTRACT_ADDRESS_PLACEHOLDER',
  REPUTATION_CONTRACT: 'CREPUTATION_CONTRACT_ADDRESS_PLACEHOLDER',
  DISPUTE_CONTRACT: 'CDISPUTE_CONTRACT_ADDRESS_PLACEHOLDER',
};

class FreelanceService {
  private server: StellarSdk.Horizon.Server;

  constructor() {
    this.server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
  }

  /**
   * Create and fund a testnet account
   */
  static async createTestnetAccount(): Promise<{ publicKey: string; secretKey: string }> {
    try {
      const keypair = StellarSdk.Keypair.random();
      const publicKey = keypair.publicKey();
      const secretKey = keypair.secret();

      // Fund account using friendbot
      const response = await fetch(`${STELLAR_CONFIG.friendbotUrl}?addr=${publicKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fund testnet account');
      }

      return { publicKey, secretKey };
    } catch (error) {
      console.error('Error creating testnet account:', error);
      throw error;
    }
  }

  /**
   * Get account balance for multiple assets
   */
  async getAccountBalance(publicKey: string): Promise<{ XLM: string; USDC: string }> {
    try {
      const account = await this.server.loadAccount(publicKey);
      let xlmBalance = '0';
      let usdcBalance = '0';

      account.balances.forEach((balance: StellarBalance) => {
        if (balance.asset_type === 'native') {
          xlmBalance = balance.balance;
        } else if (balance.asset_code === 'USDC') {
          usdcBalance = balance.balance;
        }
      });

      return { XLM: xlmBalance, USDC: usdcBalance };
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return { XLM: '0', USDC: '0' };
    }
  }

  /**
   * Connect Freighter wallet and get public key
   */
  static async connectWallet(): Promise<string> {
    try {
      await freighterApi.requestAccess();
      const publicKey = await freighterApi.getPublicKey();
      return publicKey;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw new Error('Failed to connect wallet');
    }
  }
  /**
   * Create escrow contract for a job (Mock implementation)
   */
  async createEscrow(
    jobId: string,
    employerAddress: string,
    freelancerAddress: string,
    amount: number,
    currency: 'XLM' | 'USDC'
  ): Promise<TransactionResult> {
    try {
      // Mock implementation - in production this would call Soroban contract
      console.log('Creating escrow:', { jobId, employerAddress, freelancerAddress, amount, currency });
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        hash: 'mock_transaction_hash_' + Date.now(),
        status: 'success',
        message: 'Escrow created successfully (mock)',
      };
    } catch (error) {
      console.error('Error creating escrow:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to create escrow',
      };
    }
  }
  /**
   * Release escrow funds to freelancer (Mock implementation)
   */
  async releaseEscrow(
    jobId: string,
    employerAddress: string
  ): Promise<TransactionResult> {
    try {
      // Mock implementation - in production this would call Soroban contract
      console.log('Releasing escrow:', { jobId, employerAddress });
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        hash: 'mock_release_hash_' + Date.now(),
        status: 'success',
        message: 'Funds released successfully (mock)',
      };
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to release funds',
      };
    }
  }
  /**
   * Mint reputation token (SBT) for completed job (Mock implementation)
   */
  async mintReputationToken(
    freelancerAddress: string,
    jobId: string,
    rating: number,
    skillTags: string[]
  ): Promise<TransactionResult> {
    try {
      // Mock implementation - in production this would call Soroban contract
      console.log('Minting reputation token:', { freelancerAddress, jobId, rating, skillTags });
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        hash: 'mock_reputation_hash_' + Date.now(),
        status: 'success',
        message: 'Reputation token minted successfully (mock)',
      };
    } catch (error) {
      console.error('Error minting reputation token:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to mint reputation token',
      };
    }
  }

  /**
   * Get freelancer's reputation tokens
   */  async getReputationTokens(freelancerAddress: string): Promise<ReputationToken[]> {
    try {
      // Get reputation tokens from localStorage
      const existingTokens = JSON.parse(localStorage.getItem('reputation_tokens') || '[]');
      
      // Filter tokens for this freelancer
      const freelancerTokens = existingTokens
        .filter((token: any) => token.freelancerAddress === freelancerAddress)
        .map((token: any) => ({
          id: token.id,
          tokenId: token.tokenId,
          freelancerAddress: token.freelancerAddress,
          jobId: token.jobId,
          jobTitle: token.jobTitle,
          employerAddress: token.employerAddress,
          rating: token.rating,
          skillTags: token.skillTags || [],
          mintedAt: new Date(token.mintedAt),
          isTransferable: false, // SBTs are non-transferable
        }));

      return freelancerTokens;
    } catch (error) {
      console.error('Error fetching reputation tokens:', error);
      return [];
    }
  }

  /**
   * Get escrow status for a job
   */
  async getEscrowStatus(jobId: string): Promise<EscrowContract | null> {
    try {
      // This would query the escrow contract for job status
      // For now, returning mock data - in production this would call the contract
      const mockEscrow: EscrowContract = {
        id: 'escrow_1',
        jobId,
        employerAddress: 'GXXXXXXX',
        freelancerAddress: 'GYYYYYYY',
        amount: 500,
        currency: 'USDC',
        status: 'locked',
        createdAt: new Date(),
      };

      return mockEscrow;
    } catch (error) {
      console.error('Error fetching escrow status:', error);
      return null;
    }
  }

  /**
   * Send payment (for non-escrow transactions)
   */
  async sendPayment(
    fromAddress: string,
    toAddress: string,
    amount: number,
    currency: 'XLM' | 'USDC'
  ): Promise<TransactionResult> {
    try {
      const account = await this.server.loadAccount(fromAddress);
      const asset = currency === 'XLM' ? Asset.native() : new Asset('USDC', 'USDC_ISSUER_ADDRESS');

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: toAddress,
            asset: asset,
            amount: amount.toString(),
          })
        )
        .setTimeout(30)
        .build();

      const result = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(result, STELLAR_CONFIG.networkPassphrase);
      const submitResult = await this.server.submitTransaction(signedTx);

      return {
        hash: submitResult.hash,
        status: 'success',
        message: 'Payment sent successfully',
      };
    } catch (error) {
      console.error('Error sending payment:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to send payment',
      };
    }
  }

  /**
   * Get transaction history for an account
   */
  async getTransactionHistory(publicKey: string, limit: number = 10) {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(publicKey)
        .order('desc')
        .limit(limit)
        .call();

      return transactions.records.map((tx: any) => ({
        hash: tx.hash,
        ledger: tx.ledger,
        timestamp: new Date(tx.created_at),
        fee: tx.fee_paid,
        operationCount: tx.operation_count,
      }));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }
  /**
   * Initialize dispute for a job (Mock implementation)
   */
  async initializeDispute(
    jobId: string,
    reason: string,
    description: string,
    initiatorAddress: string
  ): Promise<TransactionResult> {
    try {
      // Mock implementation - in production this would call Soroban contract
      console.log('Initializing dispute:', { jobId, reason, description, initiatorAddress });
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        hash: 'mock_dispute_hash_' + Date.now(),
        status: 'success',
        message: 'Dispute initialized successfully (mock)',
      };
    } catch (error) {
      console.error('Error initializing dispute:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to initialize dispute',
      };
    }
  }

  /**
   * Submit job completion by freelancer
   */
  async submitJobCompletion(
    jobId: string,
    applicationId: string,
    completionData: {
      deliverables: string;
      notes: string;
      fileUrls: string[];
      completedAt: Date;
    }
  ): Promise<TransactionResult> {
    try {      // Get current applications
      const applications = JSON.parse(localStorage.getItem('stellar_applications') || '[]');
      
      // Find and update the specific application
      const updatedApplications = applications.map((app: any) => {
        if (app.id === applicationId && app.jobId === jobId) {
          return {
            ...app,
            status: 'completed',
            completionData: completionData,
            submittedAt: new Date().toISOString()
          };
        }
        return app;
      });      // Save updated applications
      localStorage.setItem('stellar_applications', JSON.stringify(updatedApplications));// In a real implementation, this would:
      // 1. Upload files to IPFS/cloud storage
      // 2. Submit completion proof to smart contract
      // 3. Notify employer via blockchain event

      return {
        hash: `mock_completion_${Date.now()}`,
        status: 'success',
        message: 'Job completion submitted successfully',
      };
    } catch (error) {
      console.error('Error submitting job completion:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to submit job completion',
      };
    }
  }
}

// Export singleton instance
const freelanceService = new FreelanceService();
export default freelanceService;

// Export class for testing
export { FreelanceService };
