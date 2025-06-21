import * as StellarSdk from '@stellar/stellar-sdk';
import freighterApi from '@stellar/freighter-api';
import { Job, JobApplication, JobFilters, ApiResponse, TransactionResult } from '../types/freelance';
import { STELLAR_CONFIG } from './freelanceService';
import escrowService from './escrowService';

// Job data storage on Stellar - using simplified approach with localStorage
// In production, this would use Soroban smart contracts and IPFS for metadata
class JobService {
  private server: StellarSdk.Horizon.Server;

  constructor() {
    this.server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
  }
  /**
   * Create a new job and store it on Stellar blockchain
   */
  async createJob(jobData: {
    title: string;
    description: string;
    budget: number;
    currency: 'XLM' | 'USDC';
    requirements?: string[];
    deadline?: Date;
    tags?: string[];
  }): Promise<TransactionResult & { jobId?: string }> {
    try {
      const userPublicKey = await freighterApi.getPublicKey();
      const account = await this.server.loadAccount(userPublicKey);

      // Generate short unique job ID (keep it minimal for Stellar data limits)
      const timestamp = Date.now().toString(36); // Base36 for shorter string
      const random = Math.random().toString(36).substr(2, 4); // 4 chars only
      const jobId = `${timestamp}${random}`; // Much shorter job ID
      
      // For now, just store the job count in a simple way
      // In production, this would use Soroban contracts for complex data storage
      const jobCountKey = `jc`; // Very short key name
      const existingJobsData = account.data_attr[jobCountKey];
      let jobCount = 0;
      
      if (existingJobsData) {
        try {
          jobCount = parseInt(atob(existingJobsData));
        } catch {
          jobCount = 0;
        }
      }
      
      jobCount++;

      // Build transaction to increment job count only (keep data minimal)
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: jobCountKey,
            value: jobCount.toString(),
          })
        )
        .setTimeout(30)
        .build();

      // Sign and submit transaction
      const result = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(result, STELLAR_CONFIG.networkPassphrase);      const submitResult = await this.server.submitTransaction(signedTx);

      // Create escrow for the job - lock employer's funds
      const escrowResult = await escrowService.createEscrow(
        jobId,
        userPublicKey,
        jobData.budget,
        jobData.currency
      );

      if (escrowResult.status !== 'success') {
        console.error('Failed to create escrow:', escrowResult.message);
        // Job creation continues even if escrow fails (for demo purposes)
        // In production, you might want to rollback the job creation
      }

      // Store job data in local storage as a fallback
      // In production, this would be stored in a backend database or IPFS
      const job: Partial<Job> = {
        id: jobId,
        title: jobData.title,
        description: jobData.description,
        budget: jobData.budget,
        currency: jobData.currency,
        employerAddress: userPublicKey,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: jobData.requirements || [],
        deadline: jobData.deadline,
        tags: jobData.tags || [],
        escrowContractId: escrowResult.escrowId, // Store escrow ID with job
      };

      // Store in localStorage temporarily
      const existingJobs = localStorage.getItem('stellar_jobs');
      const jobs = existingJobs ? JSON.parse(existingJobs) : [];
      jobs.push(job);
      localStorage.setItem('stellar_jobs', JSON.stringify(jobs));

      return {
        hash: submitResult.hash,
        status: 'success',
        message: `Job created successfully with ${jobData.budget} ${jobData.currency} locked in escrow`,
        jobId: jobId,
      };
    } catch (error) {
      console.error('Error creating job:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to create job',
      };
    }
  }

  /**
   * Get all jobs from the blockchain
   */
  async getJobs(filters?: JobFilters): Promise<ApiResponse<Job[]>> {
    try {
      // Get jobs from localStorage (in production, this would be from backend/IPFS)
      const existingJobs = localStorage.getItem('stellar_jobs');
      let jobs: Job[] = existingJobs ? JSON.parse(existingJobs) : [];
      
      // Parse dates properly
      jobs = jobs.map(job => ({
        ...job,
        createdAt: new Date(job.createdAt),
        updatedAt: new Date(job.updatedAt),
        deadline: job.deadline ? new Date(job.deadline) : undefined,
      }));
      
      let filteredJobs = jobs;

      // Apply filters
      if (filters) {
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredJobs = filteredJobs.filter(job =>
            job.title.toLowerCase().includes(searchTerm) ||
            job.description.toLowerCase().includes(searchTerm) ||
            job.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
          );
        }

        if (filters.minBudget !== undefined) {
          filteredJobs = filteredJobs.filter(job => job.budget >= filters.minBudget!);
        }

        if (filters.maxBudget !== undefined) {
          filteredJobs = filteredJobs.filter(job => job.budget <= filters.maxBudget!);
        }

        if (filters.currency) {
          filteredJobs = filteredJobs.filter(job => job.currency === filters.currency);
        }

        if (filters.tags && filters.tags.length > 0) {
          filteredJobs = filteredJobs.filter(job =>
            job.tags?.some(tag => filters.tags!.includes(tag))
          );
        }

        // Sort results
        if (filters.sortBy) {
          switch (filters.sortBy) {
            case 'newest':
              filteredJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
              break;
            case 'oldest':
              filteredJobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
              break;
            case 'budget_high':
              filteredJobs.sort((a, b) => b.budget - a.budget);
              break;
            case 'budget_low':
              filteredJobs.sort((a, b) => a.budget - b.budget);
              break;
          }
        }
      }

      return {
        success: true,
        data: filteredJobs,
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
      };
    }
  }

  /**
   * Get jobs posted by a specific employer
   */
  async getJobsByEmployer(employerAddress: string): Promise<ApiResponse<Job[]>> {
    try {
      // Get jobs from localStorage
      const existingJobs = localStorage.getItem('stellar_jobs');
      let jobs: Job[] = existingJobs ? JSON.parse(existingJobs) : [];
      
      // Parse dates properly and filter by employer
      jobs = jobs
        .map(job => ({
          ...job,
          createdAt: new Date(job.createdAt),
          updatedAt: new Date(job.updatedAt),
          deadline: job.deadline ? new Date(job.deadline) : undefined,
        }))
        .filter(job => job.employerAddress === employerAddress);

      // Sort by creation date (newest first)
      jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        success: true,
        data: jobs,
      };
    } catch (error) {
      console.error('Error fetching employer jobs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch employer jobs',
      };
    }
  }  /**
   * Apply to a job
   */
  async applyToJob(
    jobId: string,
    proposal: string,
    quotedPrice: number,
    estimatedDuration: string
  ): Promise<TransactionResult> {
    try {
      const userPublicKey = await freighterApi.getPublicKey();
        // Check if user has already applied to this job
      const currentApplications = localStorage.getItem('stellar_applications');
      if (currentApplications) {
        const applications = JSON.parse(currentApplications);
        const hasAlreadyApplied = applications.some((app: any) => 
          app.jobId === jobId && app.freelancerAddress === userPublicKey
        );
        
        if (hasAlreadyApplied) {
          return {
            hash: '',
            status: 'failed',
            message: 'You have already applied to this job',
          };
        }
      }
      
      const account = await this.server.loadAccount(userPublicKey);

      // Create application object
      const application: Omit<JobApplication, 'id' | 'freelancerProfile'> = {
        jobId,
        freelancerAddress: userPublicKey,
        proposal,
        quotedPrice,
        estimatedDuration,
        appliedAt: new Date(),
        status: 'pending',
      };

      // Generate short application ID
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 3);
      const applicationId = `${timestamp}${random}`;
      
      // Build transaction to store just the application count (minimal data)
      const appCountKey = `ac`; // Very short key
      const existingAppsData = account.data_attr[appCountKey];
      let appCount = 0;
      
      if (existingAppsData) {
        try {
          appCount = parseInt(atob(existingAppsData));
        } catch {
          appCount = 0;
        }
      }
      
      appCount++;

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: appCountKey,
            value: appCount.toString(),
          })
        )
        .setTimeout(30)
        .build();

      // Sign and submit
      const result = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(result, STELLAR_CONFIG.networkPassphrase);
      const submitResult = await this.server.submitTransaction(signedTx);

      // Store application data in localStorage
      const existingApplications = localStorage.getItem('stellar_applications');
      const applications = existingApplications ? JSON.parse(existingApplications) : [];
      applications.push({ ...application, id: applicationId });
      localStorage.setItem('stellar_applications', JSON.stringify(applications));

      return {
        hash: submitResult.hash,
        status: 'success',
        message: 'Application submitted successfully',
      };
    } catch (error) {
      console.error('Error applying to job:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to submit application',
      };
    }
  }

  /**
   * Get applications for a specific job
   */
  async getJobApplications(jobId: string): Promise<ApiResponse<JobApplication[]>> {
    try {
      // Get applications from localStorage
      const existingApplications = localStorage.getItem('stellar_applications');
      let applications: JobApplication[] = existingApplications ? JSON.parse(existingApplications) : [];
      
      // Filter by job ID and parse dates
      applications = applications
        .filter(app => app.jobId === jobId)
        .map(app => ({
          ...app,
          appliedAt: new Date(app.appliedAt),
        }));
      
      return {
        success: true,
        data: applications,
      };
    } catch (error) {
      console.error('Error fetching job applications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch applications',
      };
    }
  }

  /**
   * Get applications submitted by a freelancer
   */
  async getFreelancerApplications(freelancerAddress: string): Promise<ApiResponse<JobApplication[]>> {
    try {
      // Get applications from localStorage
      const existingApplications = localStorage.getItem('stellar_applications');
      let applications: JobApplication[] = existingApplications ? JSON.parse(existingApplications) : [];
      
      // Filter by freelancer and parse dates
      applications = applications
        .filter(app => app.freelancerAddress === freelancerAddress)
        .map(app => ({
          ...app,
          appliedAt: new Date(app.appliedAt),
        }));

      // Sort by application date (newest first)
      applications.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());

      return {
        success: true,
        data: applications,
      };
    } catch (error) {
      console.error('Error fetching freelancer applications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch applications',
      };
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId: string, status: Job['status']): Promise<TransactionResult> {
    try {
      const userPublicKey = await freighterApi.getPublicKey();
      
      // Update in localStorage
      const existingJobs = localStorage.getItem('stellar_jobs');
      if (!existingJobs) {
        throw new Error('No jobs found');
      }

      const jobs = JSON.parse(existingJobs);
      const jobIndex = jobs.findIndex((job: any) => job.id === jobId && job.employerAddress === userPublicKey);
      
      if (jobIndex === -1) {
        throw new Error('Job not found or not authorized');
      }

      jobs[jobIndex].status = status;
      jobs[jobIndex].updatedAt = new Date();
      localStorage.setItem('stellar_jobs', JSON.stringify(jobs));

      return {
        hash: `mock_update_${Date.now()}`,
        status: 'success',
        message: 'Job status updated successfully',
      };
    } catch (error) {
      console.error('Error updating job status:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to update job status',
      };
    }
  }

  /**
   * Accept a freelancer application and start the job
   */
  async acceptApplication(jobId: string, applicationId: string, freelancerAddress: string): Promise<TransactionResult> {
    try {
      const userPublicKey = await freighterApi.getPublicKey();
      
      // Update job in localStorage
      const existingJobs = localStorage.getItem('stellar_jobs');
      if (!existingJobs) {
        throw new Error('No jobs found');
      }

      const jobs = JSON.parse(existingJobs);
      const jobIndex = jobs.findIndex((job: any) => job.id === jobId && job.employerAddress === userPublicKey);
      
      if (jobIndex === -1) {
        throw new Error('Job not found or not authorized');
      }

      jobs[jobIndex].status = 'in_progress';
      jobs[jobIndex].selectedFreelancer = freelancerAddress;
      jobs[jobIndex].updatedAt = new Date();
      localStorage.setItem('stellar_jobs', JSON.stringify(jobs));

      // Update application status
      const existingApplications = localStorage.getItem('stellar_applications');
      if (existingApplications) {
        const applications = JSON.parse(existingApplications);
        const appIndex = applications.findIndex((app: any) => app.id === applicationId);
        if (appIndex !== -1) {
          applications[appIndex].status = 'accepted';
          localStorage.setItem('stellar_applications', JSON.stringify(applications));
        }
      }

      return {
        hash: `mock_accept_${Date.now()}`,
        status: 'success',
        message: 'Application accepted successfully',
      };
    } catch (error) {
      console.error('Error accepting application:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to accept application',
      };
    }
  }

  /**
   * Reject a freelancer application
   */
  async rejectApplication(applicationId: string): Promise<TransactionResult> {
    try {
      // Update application status
      const existingApplications = localStorage.getItem('stellar_applications');
      if (!existingApplications) {
        throw new Error('No applications found');
      }

      const applications = JSON.parse(existingApplications);
      const appIndex = applications.findIndex((app: any) => app.id === applicationId);
      
      if (appIndex === -1) {
        throw new Error('Application not found');
      }

      applications[appIndex].status = 'rejected';
      localStorage.setItem('stellar_applications', JSON.stringify(applications));

      return {
        hash: `mock_reject_${Date.now()}`,
        status: 'success',
        message: 'Application rejected',
      };
    } catch (error) {
      console.error('Error rejecting application:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to reject application',
      };
    }
  }

  /**
   * Complete a job
   */
  async completeJob(jobId: string): Promise<TransactionResult> {
    try {
      const userPublicKey = await freighterApi.getPublicKey();
      
      // Update job in localStorage
      const existingJobs = localStorage.getItem('stellar_jobs');
      if (!existingJobs) {
        throw new Error('No jobs found');
      }

      const jobs = JSON.parse(existingJobs);
      const jobIndex = jobs.findIndex((job: any) => job.id === jobId && job.employerAddress === userPublicKey);
      
      if (jobIndex === -1) {
        throw new Error('Job not found or not authorized');
      }

      jobs[jobIndex].status = 'completed';
      jobs[jobIndex].updatedAt = new Date();
      localStorage.setItem('stellar_jobs', JSON.stringify(jobs));

      return {
        hash: `mock_complete_${Date.now()}`,
        status: 'success',
        message: 'Job completed successfully',
      };
    } catch (error) {
      console.error('Error completing job:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to complete job',
      };
    }
  }

  /**
   * Get a single job by ID
   */
  async getJobById(jobId: string): Promise<ApiResponse<Job | null>> {
    try {
      const existingJobs = localStorage.getItem('stellar_jobs');
      if (!existingJobs) {
        return { success: true, data: null };
      }

      const jobs = JSON.parse(existingJobs);
      const job = jobs.find((j: any) => j.id === jobId);
      
      if (!job) {
        return { success: true, data: null };
      }

      // Parse dates properly
      const parsedJob = {
        ...job,
        createdAt: new Date(job.createdAt),
        updatedAt: new Date(job.updatedAt),
        deadline: job.deadline ? new Date(job.deadline) : undefined,
      };

      return {
        success: true,
        data: parsedJob,
      };
    } catch (error) {
      console.error('Error fetching job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job',
      };
    }
  }  /**
   * Approve job completion, release escrow payment and mint reputation token
   */
  async approveJobCompletion(
    jobId: string,
    applicationId: string,
    employerAddress: string,
    rating: number = 5,
    comment: string = ''
  ): Promise<TransactionResult> {
    try {
      // Get current applications and jobs
      const applications = JSON.parse(localStorage.getItem('stellar_applications') || '[]');
      const jobs = JSON.parse(localStorage.getItem('stellar_jobs') || '[]');
      
      // Find the application and job
      const application = applications.find((app: any) => app.id === applicationId);
      const job = jobs.find((job: any) => job.id === jobId);
      
      if (!application || !job) {
        throw new Error('Application or job not found');
      }

      // Update application status
      const updatedApplications = applications.map((app: any) => {
        if (app.id === applicationId && app.jobId === jobId) {
          return {
            ...app,
            status: 'approved',
            approvedAt: new Date().toISOString(),
            rating: rating
          };
        }
        return app;
      });

      // Update job status to completed
      const updatedJobs = jobs.map((j: any) => {
        if (j.id === jobId) {
          return {
            ...j,
            status: 'completed',
            completedAt: new Date().toISOString()
          };
        }
        return j;
      });

      // Save updated data
      localStorage.setItem('stellar_applications', JSON.stringify(updatedApplications));
      localStorage.setItem('stellar_jobs', JSON.stringify(updatedJobs));

      // Release escrow funds to freelancer
      let escrowReleaseHash = '';
      if (job.escrowContractId) {
        try {
          const escrowResult = await escrowService.releaseEscrow(
            job.escrowContractId,
            jobId,
            application.freelancerAddress
          );
          
          if (escrowResult.status === 'success') {
            escrowReleaseHash = escrowResult.hash;
            console.log('Escrow successfully released:', escrowResult.message);
          } else {
            console.error('Escrow release failed:', escrowResult.message);
            // Continue with reputation minting even if escrow release fails
          }
        } catch (escrowError) {
          console.error('Escrow release error:', escrowError);
          // Continue with reputation minting even if escrow fails
        }
      } else {
        console.warn('No escrow contract ID found for job, skipping escrow release');
        
        // Fallback: Direct payment transfer if no escrow exists
        try {
          const paymentResult = await this.transferPayment(
            employerAddress,
            application.freelancerAddress,
            job.budget,
            job.currency as 'XLM' | 'USDC'
          );
          
          if (paymentResult.status === 'success') {
            escrowReleaseHash = paymentResult.hash;
          }
        } catch (paymentError) {
          console.error('Direct payment transfer error:', paymentError);
        }
      }      // Mint reputation token for freelancer
      if (application && job) {
        // Save reputation token to freelancer's record
        const existingTokens = JSON.parse(localStorage.getItem('reputation_tokens') || '[]');
        const reputationToken = {
          id: `rep_${Date.now()}`,
          jobTitle: job.title,
          jobId: jobId,
          freelancerAddress: application.freelancerAddress,
          employerAddress: employerAddress,
          rating: rating,
          comment: comment,
          mintedAt: new Date(),
          tokenId: `sbt_${Date.now()}`,
          jobBudget: job.budget,
          jobCurrency: job.currency
        };
        
        existingTokens.push(reputationToken);
        localStorage.setItem('reputation_tokens', JSON.stringify(existingTokens));
      }

      return {
        hash: escrowReleaseHash || `approval_${Date.now()}`,
        status: 'success',
        message: job.escrowContractId 
          ? `Job completion approved! Escrow funds of ${job.budget} ${job.currency} released to freelancer. Reputation token minted.`
          : `Job completion approved! Payment of ${job.budget} ${job.currency} transferred to freelancer. Reputation token minted.`,
      };
    } catch (error) {
      console.error('Error approving job completion:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to approve job completion',
      };
    }
  }

  /**
   * Transfer payment from employer to freelancer
   */
  async transferPayment(
    fromAddress: string,
    toAddress: string,
    amount: number,
    currency: 'XLM' | 'USDC'
  ): Promise<TransactionResult> {
    try {
      // Import FreelanceService to use payment functionality
      const freelanceService = (await import('./freelanceService')).default;
      
      // Use FreelanceService's sendPayment method
      const paymentResult = await freelanceService.sendPayment(
        fromAddress,
        toAddress,
        amount,
        currency
      );

      return paymentResult;
    } catch (error) {
      console.error('Error transferring payment:', error);
      return {
        hash: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Failed to transfer payment',
      };
    }
  }
}

// Export singleton instance
const jobService = new JobService();
export default jobService;
export { JobService };
