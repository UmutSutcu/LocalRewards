import * as StellarSdk from '@stellar/stellar-sdk';
import freighterApi from '@stellar/freighter-api';
import { TransactionResult } from '../types/freelance';
import { STELLAR_CONFIG } from './freelanceService';

// Extract needed classes from StellarSdk
const { 
  Networks, 
  TransactionBuilder, 
  Operation, 
  Asset,
  BASE_FEE
} = StellarSdk;

interface EscrowData {
  jobId: string;
  employerAddress: string;
  freelancerAddress?: string;
  amount: number;
  currency: 'XLM' | 'USDC';
  status: 'locked' | 'released' | 'cancelled';
  createdAt: Date;
  releasedAt?: Date;
}

class EscrowService {
  private server: StellarSdk.Horizon.Server;

  constructor() {
    this.server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
  }

  /**
   * Create escrow for a job - locks employer's funds
   */
  async createEscrow(
    jobId: string,
    employerAddress: string,
    amount: number,
    currency: 'XLM' | 'USDC'
  ): Promise<TransactionResult & { escrowId?: string }> {
    try {
      // Load employer account
      const account = await this.server.loadAccount(employerAddress);
      const asset = currency === 'XLM' ? Asset.native() : new Asset('USDC', 'USDC_ISSUER_ADDRESS');

      // In a real implementation, this would:
      // 1. Create a multi-sig escrow account
      // 2. Transfer funds to escrow account
      // 3. Set up smart contract conditions
      
      // For now, simulate by storing escrow data
      const escrowId = `escrow_${Date.now()}`;
      const escrowData: EscrowData = {
        jobId,
        employerAddress,
        amount,
        currency,
        status: 'locked',
        createdAt: new Date()
      };

      // Store escrow data in localStorage (in production: blockchain)
      const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
      existingEscrows.push({ id: escrowId, ...escrowData });
      localStorage.setItem('stellar_escrows', JSON.stringify(existingEscrows));

      // Simulate Stellar transaction for locking funds
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: 'ESCROW_CONTRACT_ADDRESS', // In production: actual escrow contract
            asset: asset,
            amount: amount.toString(),
          })
        )
        .addMemo(StellarSdk.Memo.text(`escrow:${jobId}`))
        .setTimeout(30)
        .build();

      // Sign and submit transaction (commented for simulation)
      /*
      const result = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      const transactionResult = await this.server.submitTransaction(result);
      */

      return {
        hash: `escrow_lock_${Date.now()}`,
        status: 'success',
        message: `${amount} ${currency} locked in escrow for job ${jobId}`,
        escrowId
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
   * Release escrow funds to freelancer after job approval
   */
  async releaseEscrow(
    escrowId: string,
    jobId: string,
    freelancerAddress: string
  ): Promise<TransactionResult> {
    try {
      // Get escrow data
      const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
      const escrowIndex = existingEscrows.findIndex((e: any) => e.id === escrowId);
      
      if (escrowIndex === -1) {
        throw new Error('Escrow not found');
      }

      const escrow = existingEscrows[escrowIndex];
      
      if (escrow.status !== 'locked') {
        throw new Error('Escrow is not in locked state');
      }

      // Update escrow data
      escrow.status = 'released';
      escrow.freelancerAddress = freelancerAddress;
      escrow.releasedAt = new Date();
      existingEscrows[escrowIndex] = escrow;
      localStorage.setItem('stellar_escrows', JSON.stringify(existingEscrows));

      // In a real implementation, this would:
      // 1. Call smart contract release function
      // 2. Transfer funds from escrow to freelancer
      // 3. Update contract state

      // Simulate Stellar transaction for releasing funds
      const asset = escrow.currency === 'XLM' ? Asset.native() : new Asset('USDC', 'USDC_ISSUER_ADDRESS');
      
      // Load escrow account (in production: the actual escrow contract account)
      const escrowAccount = await this.server.loadAccount('ESCROW_CONTRACT_ADDRESS');
      
      const transaction = new TransactionBuilder(escrowAccount, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: freelancerAddress,
            asset: asset,
            amount: escrow.amount.toString(),
          })
        )
        .addMemo(StellarSdk.Memo.text(`release:${jobId}`))
        .setTimeout(30)
        .build();

      // Sign and submit transaction (commented for simulation)
      /*
      const result = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      const transactionResult = await this.server.submitTransaction(result);
      */

      return {
        hash: `escrow_release_${Date.now()}`,
        status: 'success',
        message: `${escrow.amount} ${escrow.currency} released from escrow to ${freelancerAddress}`,
      };
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to release escrow',
      };
    }
  }

  /**
   * Cancel escrow and return funds to employer (if job is cancelled)
   */
  async cancelEscrow(
    escrowId: string,
    jobId: string
  ): Promise<TransactionResult> {
    try {
      // Get escrow data
      const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
      const escrowIndex = existingEscrows.findIndex((e: any) => e.id === escrowId);
      
      if (escrowIndex === -1) {
        throw new Error('Escrow not found');
      }

      const escrow = existingEscrows[escrowIndex];
      
      if (escrow.status !== 'locked') {
        throw new Error('Escrow is not in locked state');
      }

      // Update escrow data
      escrow.status = 'cancelled';
      escrow.releasedAt = new Date();
      existingEscrows[escrowIndex] = escrow;
      localStorage.setItem('stellar_escrows', JSON.stringify(existingEscrows));

      return {
        hash: `escrow_cancel_${Date.now()}`,
        status: 'success',
        message: `Escrow cancelled, ${escrow.amount} ${escrow.currency} returned to employer`,
      };
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to cancel escrow',
      };
    }
  }

  /**
   * Get escrow status for a job
   */
  async getEscrowByJobId(jobId: string): Promise<EscrowData | null> {
    try {
      const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
      const escrow = existingEscrows.find((e: any) => e.jobId === jobId);
      
      if (!escrow) {
        return null;
      }

      return {
        jobId: escrow.jobId,
        employerAddress: escrow.employerAddress,
        freelancerAddress: escrow.freelancerAddress,
        amount: escrow.amount,
        currency: escrow.currency,
        status: escrow.status,
        createdAt: new Date(escrow.createdAt),
        releasedAt: escrow.releasedAt ? new Date(escrow.releasedAt) : undefined
      };
    } catch (error) {
      console.error('Error getting escrow:', error);
      return null;
    }
  }

  /**
   * Get all escrows for an employer
   */
  async getEmployerEscrows(employerAddress: string): Promise<EscrowData[]> {
    try {
      const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
      return existingEscrows
        .filter((e: any) => e.employerAddress === employerAddress)
        .map((e: any) => ({
          jobId: e.jobId,
          employerAddress: e.employerAddress,
          freelancerAddress: e.freelancerAddress,
          amount: e.amount,
          currency: e.currency,
          status: e.status,
          createdAt: new Date(e.createdAt),
          releasedAt: e.releasedAt ? new Date(e.releasedAt) : undefined
        }));
    } catch (error) {
      console.error('Error getting employer escrows:', error);
      return [];
    }
  }
}

// Export singleton instance
const escrowService = new EscrowService();
export default escrowService;
export { EscrowService, type EscrowData };
