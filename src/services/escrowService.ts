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
      // Validate inputs
      if (!jobId || !employerAddress || amount <= 0) {
        throw new Error('Invalid escrow parameters');
      }

      // Load employer account
      const account = await this.server.loadAccount(employerAddress);
      const asset = currency === 'XLM' ? Asset.native() : new Asset('USDC', 'USDC_ISSUER_ADDRESS');

      // Check if employer has sufficient balance
      const balance = account.balances.find(b => 
        (currency === 'XLM' && b.asset_type === 'native') ||
        (currency === 'USDC' && b.asset_type === 'credit_alphanum4' && b.asset_code === 'USDC')
      );

      if (!balance || parseFloat(balance.balance) < amount) {
        throw new Error(`Insufficient ${currency} balance. Required: ${amount}, Available: ${balance?.balance || 0}`);
      }

      // Generate escrow ID
      const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      const escrowData: EscrowData = {
        jobId,
        employerAddress,
        amount,
        currency,
        status: 'locked',
        createdAt: new Date()
      };

      // Store escrow data (in production: this would be in smart contract state)
      const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
      existingEscrows.push({ id: escrowId, ...escrowData });
      localStorage.setItem('stellar_escrows', JSON.stringify(existingEscrows));      // In production: This would deploy and fund a Soroban smart contract
      // For now, simulate the escrow creation without actual token transfer
      
      // Generate a mock transaction hash for simulation
      const mockTransactionHash = `escrow_lock_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      // In a real implementation, you would:
      // 1. Deploy or invoke the Soroban escrow contract
      // 2. Transfer tokens to the contract
      // 3. Set contract state with job details
      // 
      // Example real implementation:
      // const contract = new SorobanContract(ESCROW_CONTRACT_ID);
      // const result = await contract.invoke('create_escrow', {
      //   job_id: jobId,
      //   employer: employerAddress,
      //   amount: amount,
      //   token: tokenAddress,
      //   deadline: null
      // });      console.log(`✅ Escrow simulation: ${amount} ${currency} virtually locked for job ${jobId}`);

      return {
        hash: `escrow_lock_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        status: 'success',
        message: `${amount} ${currency} successfully locked in escrow for job ${jobId} (simulation mode)`,
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
      escrow.releasedAt = new Date();      existingEscrows[escrowIndex] = escrow;
      localStorage.setItem('stellar_escrows', JSON.stringify(existingEscrows));

      // In a real implementation, this would:
      // 1. Call smart contract release function
      // 2. Transfer funds from escrow to freelancer
      // 3. Update contract state

      // Simulate escrow release without actual blockchain transaction
      console.log(`✅ Escrow release simulation: ${escrow.amount} ${escrow.currency} released to ${freelancerAddress.substring(0, 8)}...`);

      // In production, this would be:
      // const contract = new SorobanContract(ESCROW_CONTRACT_ID);
      // const result = await contract.invoke('release_escrow', { job_id: jobId });

      return {
        hash: `escrow_release_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
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

  /**
   * Update escrow with freelancer address when job is assigned
   */
  async assignFreelancerToEscrow(
    jobId: string,
    freelancerAddress: string
  ): Promise<TransactionResult> {
    try {
      const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
      const escrowIndex = existingEscrows.findIndex((e: any) => e.jobId === jobId);
      
      if (escrowIndex === -1) {
        return {
          hash: '',
          status: 'failed',
          message: 'Escrow not found for this job'
        };
      }

      const escrow = existingEscrows[escrowIndex];
      
      if (escrow.status !== 'locked') {
        return {
          hash: '',
          status: 'failed',
          message: 'Escrow is not in locked state'
        };
      }

      // Update escrow with freelancer address
      escrow.freelancerAddress = freelancerAddress;
      escrow.updatedAt = new Date();
      existingEscrows[escrowIndex] = escrow;
      localStorage.setItem('stellar_escrows', JSON.stringify(existingEscrows));

      // In production: Update smart contract with freelancer address
      console.log(`Escrow for job ${jobId} assigned to freelancer ${freelancerAddress}`);

      return {
        hash: `escrow_assign_${Date.now()}`,
        status: 'success',
        message: `Escrow assigned to freelancer ${freelancerAddress.substring(0, 8)}...`
      };
    } catch (error) {
      console.error('Error assigning freelancer to escrow:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to assign freelancer to escrow'
      };
    }
  }

  /**
   * Get escrow statistics for employer dashboard
   */
  async getEscrowStats(employerAddress: string): Promise<{
    totalLocked: number;
    totalReleased: number;
    activEscrows: number;
    completedEscrows: number;
  }> {
    try {
      const escrows = await this.getEmployerEscrows(employerAddress);
      
      return {
        totalLocked: escrows
          .filter(e => e.status === 'locked')
          .reduce((sum, e) => sum + e.amount, 0),
        totalReleased: escrows
          .filter(e => e.status === 'released')
          .reduce((sum, e) => sum + e.amount, 0),
        activEscrows: escrows.filter(e => e.status === 'locked').length,
        completedEscrows: escrows.filter(e => e.status === 'released').length
      };
    } catch (error) {
      console.error('Error getting escrow stats:', error);
      return {
        totalLocked: 0,
        totalReleased: 0,
        activEscrows: 0,
        completedEscrows: 0
      };
    }
  }
}

// Export singleton instance
const escrowService = new EscrowService();
export default escrowService;
export { EscrowService, type EscrowData };
