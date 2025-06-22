import * as StellarSdk from '@stellar/stellar-sdk';
import freighterApi from '@stellar/freighter-api';
import { TransactionResult } from '../types/freelance';
import { STELLAR_CONFIG } from './freelanceService';

// Extract needed classes from StellarSdk
const { 
  TransactionBuilder,
  Operation, 
  BASE_FEE
} = StellarSdk;

interface EscrowData {
  jobId: string;
  employerAddress: string;
  freelancerAddress?: string;
  amount: number;
  currency: 'XLM'; // Only XLM supported now
  status: 'locked' | 'released' | 'cancelled';
  createdAt: Date;
  releasedAt?: Date;
  contractAddress: string; // Soroban contract address instead of escrow account
}

class EscrowService {
  private server: StellarSdk.Horizon.Server;
  private contractAddress: string;

  constructor() {
    this.server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
    // In production, this would be the deployed Soroban contract address
    // For now, we'll simulate the contract behavior
    this.contractAddress = 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';
  }

  /**
   * Create escrow for a job - stores job data on Soroban contract
   * Only locks the amount metadata, actual payment happens on release
   */
  async createEscrow(
    jobId: string,
    employerAddress: string,
    amount: number,
    currency: 'XLM'
  ): Promise<TransactionResult & { escrowId?: string }> {
    try {
      // Validate inputs
      if (!jobId || !employerAddress || amount <= 0) {
        throw new Error('Invalid escrow parameters');
      }

      // Validate employer address format
      try {
        StellarSdk.Keypair.fromPublicKey(employerAddress);
        console.log(`📋 Employer address validated: ${employerAddress}`);
      } catch (e) {
        throw new Error(`Invalid employer address: ${employerAddress}`);
      }

      // Load employer account to check balance
      const account = await this.server.loadAccount(employerAddress);

      // Only XLM is supported
      if (currency !== 'XLM') {
        throw new Error('Only XLM currency is supported');
      }

      // Check if employer has sufficient XLM balance
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      if (!xlmBalance || parseFloat(xlmBalance.balance) < amount) {
        throw new Error(`Insufficient XLM balance. Required: ${amount}, Available: ${xlmBalance?.balance || 0}`);
      }

      // Generate escrow ID
      const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      console.log(`📋 Creating escrow contract entry for job ${jobId} with ${amount} XLM`);
      console.log(`📋 Employer balance: ${xlmBalance.balance} XLM (sufficient for ${amount} XLM)`);

      // In a real Soroban implementation, this would call the contract:
      // contract.create_job(jobId, employerAddress, amount)
      // For now, we simulate by storing the job data

      const escrowData: EscrowData = {
        jobId,
        employerAddress,
        amount,
        currency,
        status: 'locked',
        createdAt: new Date(),
        contractAddress: this.contractAddress
      };

      // Store escrow data (simulating Soroban contract storage)
      const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
      existingEscrows.push({ 
        id: escrowId, 
        ...escrowData
      });
      localStorage.setItem('stellar_escrows', JSON.stringify(existingEscrows));

      console.log(`✅ Escrow contract created: ${amount} XLM reserved for job ${jobId}`);
      console.log(`📋 No funds transferred yet - payment will happen on release`);

      return {
        hash: `contract_create_${Date.now()}`, // In real implementation, this would be the contract transaction hash
        status: 'success',
        message: `${amount} XLM escrow created for job (payment reserved, not transferred)`,
        escrowId
      };
    } catch (error: any) {
      console.error('Error creating escrow:', error);
      
      let errorMessage = 'Failed to create escrow';
      if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        hash: '',
        status: 'failed',
        message: errorMessage,
      };
    }
  }  /**
   * Release escrow funds to freelancer after job approval
   * This is where the actual payment happens (employer -> freelancer)
   */
  async releaseEscrow(
    escrowId: string,
    _jobId: string,
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

      // Validate freelancer address
      try {
        StellarSdk.Keypair.fromPublicKey(freelancerAddress);
        console.log(`📋 Freelancer address validated: ${freelancerAddress}`);
      } catch (e) {
        throw new Error(`Invalid freelancer address: ${freelancerAddress}`);
      }

      // Load employer account for the payment
      const employerAccount = await this.server.loadAccount(escrow.employerAddress);
      
      console.log(`📋 Processing payment: ${escrow.amount} XLM from employer ${escrow.employerAddress} to freelancer ${freelancerAddress}`);
      
      // Check if employer still has sufficient balance
      const xlmBalance = employerAccount.balances.find(b => b.asset_type === 'native');
      if (!xlmBalance || parseFloat(xlmBalance.balance) < escrow.amount) {
        throw new Error(`Employer has insufficient balance. Available: ${xlmBalance?.balance || 0}, Required: ${escrow.amount}`);
      }
      
      console.log(`📋 Employer balance: ${xlmBalance.balance} XLM, Payment amount: ${escrow.amount} XLM`);
      
      // Create payment transaction from employer to freelancer
      const transaction = new TransactionBuilder(employerAccount, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: freelancerAddress,
            asset: StellarSdk.Asset.native(),
            amount: escrow.amount.toString(),
          })
        )
        .setTimeout(30);

      const builtTransaction = transaction.build();
      
      console.log(`📋 Payment transaction XDR: ${builtTransaction.toXDR()}`);
      
      // Sign with employer's key (via Freighter) - requires employer authorization
      console.log(`📋 Requesting employer authorization for payment...`);
      const signedTransaction = await freighterApi.signTransaction(builtTransaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      console.log(`📋 Transaction signed by employer, submitting to network...`);
      const txFromXdr = TransactionBuilder.fromXDR(signedTransaction, STELLAR_CONFIG.networkPassphrase);
      
      // Submit the payment transaction
      const submitResult = await this.server.submitTransaction(txFromXdr);

      // Update escrow data to released status
      escrow.status = 'released';
      escrow.freelancerAddress = freelancerAddress;
      escrow.releasedAt = new Date();
      existingEscrows[escrowIndex] = escrow;
      localStorage.setItem('stellar_escrows', JSON.stringify(existingEscrows));

      console.log(`✅ Payment successful: ${escrow.amount} XLM sent from employer to freelancer`);
      console.log(`📋 Transaction hash: ${submitResult.hash}`);

      return {
        hash: submitResult.hash,
        status: 'success',
        message: `${escrow.amount} XLM successfully paid to freelancer`,
      };
    } catch (error: any) {
      console.error('Error releasing escrow:', error);
      
      // Enhanced error logging for Stellar API errors
      if (error.response?.data) {
        console.error('📋 Stellar API Error Details:', error.response.data);
        if (error.response.data.extras?.result_codes) {
          console.error('📋 Result Codes:', error.response.data.extras.result_codes);
        }
        if (error.response.data.extras?.operations) {
          console.error('📋 Operation Errors:', error.response.data.extras.operations);
        }
      }
      
      let errorMessage = 'Failed to release escrow';
      
      // Extract meaningful error message from Stellar response
      if (error.response?.data?.title) {
        errorMessage = error.response.data.title;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        hash: '',
        status: 'failed',
        message: errorMessage,
      };
    }
  }  /**
   * Cancel escrow - simply marks as cancelled (no funds to return since none were locked)
   */
  async cancelEscrow(
    escrowId: string,
    _jobId: string
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

      console.log(`📋 Cancelling escrow for job ${escrow.jobId} - no funds to return since none were locked`);

      // Update escrow data
      escrow.status = 'cancelled';
      escrow.releasedAt = new Date();
      existingEscrows[escrowIndex] = escrow;
      localStorage.setItem('stellar_escrows', JSON.stringify(existingEscrows));

      console.log(`✅ Escrow cancelled: Contract entry marked as cancelled`);

      return {
        hash: `contract_cancel_${Date.now()}`,
        status: 'success',
        message: `Escrow cancelled - no funds were locked so nothing to return`,
      };
    } catch (error: any) {
      console.error('Error cancelling escrow:', error);
      
      let errorMessage = 'Failed to cancel escrow';
      if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        hash: '',
        status: 'failed',
        message: errorMessage,
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
      }      return {
        jobId: escrow.jobId,
        employerAddress: escrow.employerAddress,
        freelancerAddress: escrow.freelancerAddress,
        amount: escrow.amount,
        currency: 'XLM',
        status: escrow.status,
        createdAt: new Date(escrow.createdAt),
        releasedAt: escrow.releasedAt ? new Date(escrow.releasedAt) : undefined,
        contractAddress: escrow.contractAddress || this.contractAddress
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
        .filter((e: any) => e.employerAddress === employerAddress)        .map((e: any) => ({
          jobId: e.jobId,
          employerAddress: e.employerAddress,
          freelancerAddress: e.freelancerAddress,
          amount: e.amount,
          currency: 'XLM' as const,
          status: e.status,
          createdAt: new Date(e.createdAt),
          releasedAt: e.releasedAt ? new Date(e.releasedAt) : undefined,
          contractAddress: e.contractAddress || this.contractAddress
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
