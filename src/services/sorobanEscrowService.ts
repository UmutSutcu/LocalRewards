import * as StellarSdk from '@stellar/stellar-sdk';
import { Contract, nativeToScVal } from '@stellar/stellar-sdk';
import freighterApi from '@stellar/freighter-api';
import { STELLAR_CONFIG } from './freelanceService';
import { TransactionResult } from '../types/freelance';

// Soroban Escrow Contract Integration
// This service interfaces with the actual Soroban smart contract

interface SorobanEscrowData {
  job_id: string;
  employer: string;
  freelancer?: string;
  amount: string;
  token: string;
  status: 'Locked' | 'Released' | 'Cancelled' | 'Disputed';
  created_at: string;
  deadline?: string;
}

class SorobanEscrowService {
  private server: StellarSdk.Horizon.Server;
  private contractId: string;
  private contract: Contract;

  constructor() {
    this.server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
      // In production, this would be the actual deployed contract ID
    // For now, we'll use a placeholder that will be replaced when contract is deployed
    this.contractId = 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Placeholder contract ID
    
    this.contract = new Contract(this.contractId);
  }

  /**
   * Create escrow by calling Soroban smart contract
   */
  async createEscrow(
    jobId: string,
    employerAddress: string,
    amount: number,
    currency: 'XLM' | 'USDC'
  ): Promise<TransactionResult & { escrowId?: string }> {    try {
      // Get user's account
      const account = await this.server.loadAccount(employerAddress);

      // Determine token contract address
      const tokenAddress = currency === 'XLM' 
        ? 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' // Native XLM wrapper
        : 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // USDC contract

      // Prepare contract function arguments
      const args = [
        nativeToScVal(jobId, { type: 'string' }),
        nativeToScVal(employerAddress, { type: 'address' }),
        nativeToScVal(amount * 10000000, { type: 'i128' }), // Convert to stroops/smallest unit
        nativeToScVal(tokenAddress, { type: 'address' }),
        nativeToScVal(null, { type: 'option' }) // deadline
      ];

      // Build contract invocation transaction
      const operation = this.contract.call('create_escrow', ...args);
      
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // Sign transaction with Freighter
      const signedXdr = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
        accountToSign: employerAddress,
      });      // Submit transaction
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, STELLAR_CONFIG.networkPassphrase);
      const result = await this.server.submitTransaction(signedTransaction);

      // For now, simulate success since we don't have real contract deployed
      console.log(`✅ Soroban escrow created: ${amount} ${currency} for job ${jobId}`);

      return {
        hash: result.hash,
        status: 'success',
        message: `${amount} ${currency} locked in escrow contract for job ${jobId}`,
        escrowId: jobId // In this implementation, jobId is the escrow identifier
      };

    } catch (error) {
      console.error('Soroban escrow creation error:', error);
      
      // If Soroban contract is not available, fall back to simulation
      if (error instanceof Error && error.message.includes('Contract not found')) {
        console.warn('⚠️ Soroban contract not deployed, falling back to simulation mode');
        return this.simulateEscrow(jobId, employerAddress, amount, currency);
      }

      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to create escrow',
      };
    }
  }

  /**
   * Assign freelancer to escrow
   */
  async assignFreelancer(jobId: string, freelancerAddress: string): Promise<TransactionResult> {
    try {
      // Get current user (should be employer)
      const userPublicKey = await freighterApi.getPublicKey();
      const account = await this.server.loadAccount(userPublicKey);

      const args = [
        nativeToScVal(jobId, { type: 'string' }),
        nativeToScVal(freelancerAddress, { type: 'address' })
      ];

      const operation = this.contract.call('assign_freelancer', ...args);
      
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const signedXdr = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, STELLAR_CONFIG.networkPassphrase);
      const result = await this.server.submitTransaction(signedTransaction);

      return {
        hash: result.hash,
        status: 'success',
        message: `Freelancer ${freelancerAddress.substring(0, 8)}... assigned to escrow`
      };

    } catch (error) {
      console.error('Soroban assign freelancer error:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to assign freelancer'
      };
    }
  }

  /**
   * Release escrow funds to freelancer
   */
  async releaseEscrow(jobId: string): Promise<TransactionResult> {
    try {
      const userPublicKey = await freighterApi.getPublicKey();
      const account = await this.server.loadAccount(userPublicKey);

      const args = [nativeToScVal(jobId, { type: 'string' })];
      const operation = this.contract.call('release_escrow', ...args);
      
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const signedXdr = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, STELLAR_CONFIG.networkPassphrase);
      const result = await this.server.submitTransaction(signedTransaction);

      return {
        hash: result.hash,
        status: 'success',
        message: 'Escrow funds released to freelancer'
      };

    } catch (error) {
      console.error('Soroban release escrow error:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to release escrow'
      };
    }
  }

  /**
   * Cancel escrow and refund to employer
   */
  async cancelEscrow(jobId: string): Promise<TransactionResult> {
    try {
      const userPublicKey = await freighterApi.getPublicKey();
      const account = await this.server.loadAccount(userPublicKey);

      const args = [nativeToScVal(jobId, { type: 'string' })];
      const operation = this.contract.call('cancel_escrow', ...args);
      
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const signedXdr = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, STELLAR_CONFIG.networkPassphrase);
      const result = await this.server.submitTransaction(signedTransaction);

      return {
        hash: result.hash,
        status: 'success',
        message: 'Escrow cancelled and funds refunded'
      };

    } catch (error) {
      console.error('Soroban cancel escrow error:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to cancel escrow'
      };
    }
  }
  /**
   * Get escrow data from contract
   */
  async getEscrow(jobId: string): Promise<SorobanEscrowData | null> {
    try {
      // For now, return null since contract simulation is complex
      // In production, this would call the actual contract
      console.log(`📋 Getting escrow data for job ${jobId} from contract`);
      return null;

    } catch (error) {
      console.error('Error getting escrow from contract:', error);
      return null;
    }
  }

  /**
   * Wrapper methods for test component compatibility
   */
  async createJob(
    jobId: string,
    employerAddress: string,
    freelancerAddress: string,
    amount: number
  ): Promise<TransactionResult> {
    // Remove any existing escrow for this job to prevent duplicates
    const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
    const filteredEscrows = existingEscrows.filter((e: any) => e.jobId !== jobId);
    localStorage.setItem('stellar_escrows', JSON.stringify(filteredEscrows));

    const result = await this.createEscrow(jobId, employerAddress, amount, 'XLM');
    
    if (result.status === 'success' && freelancerAddress) {
      // Assign freelancer if provided
      await this.assignFreelancer(jobId, freelancerAddress);
    }
    
    return {
      hash: result.hash,
      status: result.status,
      message: result.message
    };
  }

  async releasePayment(jobId: string): Promise<TransactionResult> {
    return this.releaseEscrow(jobId);
  }

  async getJob(jobId: string): Promise<SorobanEscrowData | null> {
    // Try to get from Soroban contract first
    const contractData = await this.getEscrow(jobId);
    if (contractData) {
      return contractData;
    }

    // Fallback to localStorage simulation
    const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
    const escrow = existingEscrows.find((e: any) => e.jobId === jobId);
    
    if (!escrow) {
      return null;
    }

    return {
      job_id: escrow.jobId,
      employer: escrow.employerAddress,
      freelancer: escrow.freelancerAddress,
      amount: escrow.amount.toString(),
      token: 'XLM',
      status: escrow.status === 'locked' ? 'Locked' : 
              escrow.status === 'released' ? 'Released' : 
              escrow.status === 'cancelled' ? 'Cancelled' : 'Locked',
      created_at: escrow.createdAt || new Date().toISOString(),
      deadline: undefined
    };
  }

  async cancelJob(jobId: string): Promise<TransactionResult> {
    return this.cancelEscrow(jobId);
  }

  /**
   * Get escrow statistics for dashboard
   */
  async getEscrowStats(employerAddress: string): Promise<{
    totalReserved: number;
    totalPaid: number;
    activeEscrows: number;
    completedPayments: number;
  }> {
    try {
      const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
      const employerEscrows = existingEscrows.filter((e: any) => e.employerAddress === employerAddress);

      const stats = {
        totalReserved: 0,
        totalPaid: 0,
        activeEscrows: 0,
        completedPayments: 0
      };

      employerEscrows.forEach((escrow: any) => {
        const amount = parseFloat(escrow.amount) || 0;
        
        if (escrow.status === 'locked') {
          stats.totalReserved += amount;
          stats.activeEscrows += 1;
        } else if (escrow.status === 'released') {
          stats.totalPaid += amount;
          stats.completedPayments += 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting escrow stats:', error);
      return {
        totalReserved: 0,
        totalPaid: 0,
        activeEscrows: 0,
        completedPayments: 0
      };
    }
  }
  /**
   * Fallback simulation when contract is not available
   */
  private async simulateEscrow(
    jobId: string,
    employerAddress: string,
    amount: number,
    currency: 'XLM' | 'USDC'
  ): Promise<TransactionResult & { escrowId?: string }> {
    // Remove any existing escrow for this job to prevent duplicates
    const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
    const filteredEscrows = existingEscrows.filter((e: any) => e.jobId !== jobId);
    
    // Store in localStorage for simulation
    const escrowData = {
      jobId,
      employerAddress,
      amount,
      currency,
      status: 'locked',
      createdAt: new Date()
    };

    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    filteredEscrows.push({ id: escrowId, ...escrowData });
    localStorage.setItem('stellar_escrows', JSON.stringify(filteredEscrows));

    console.log(`✅ Soroban escrow simulation: ${amount} ${currency} reserved for job ${jobId}`);
    console.log(`📋 Previous duplicate escrows for job ${jobId} have been removed`);

    return {
      hash: `simulation_${Date.now()}`,
      status: 'success',
      message: `${amount} ${currency} locked in escrow (simulation mode)`,
      escrowId
    };
  }
}

// Export singleton instance
const sorobanEscrowService = new SorobanEscrowService();
export default sorobanEscrowService;
export { SorobanEscrowService, type SorobanEscrowData };
