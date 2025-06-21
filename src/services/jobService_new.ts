import * as StellarSdk from '@stellar/stellar-sdk';
import freighterApi from '@stellar/freighter-api';
import { Job, JobApplication, JobFilters, ApiResponse, TransactionResult } from '../types/freelance';
import { STELLAR_CONFIG } from './freelanceService';

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

      // Generate unique job ID
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // For now, just store the job ID in a simple way
      // In production, this would use Soroban contracts for complex data storage
      const jobIndexKey = `jobs_count`;
      const existingJobsData = account.data_attr[jobIndexKey];
      let jobCount = 0;
      
      if (existingJobsData) {
        try {
          jobCount = parseInt(atob(existingJobsData));
        } catch {
          jobCount = 0;
        }
      }
      
      jobCount++;

      // Build transaction to increment job count
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: jobIndexKey,
            value: jobCount.toString(),
          })
        )
        .addOperation(
          StellarSdk.Operation.manageData({
            name: `job_id_${jobCount}`,
            value: jobId,
          })
        )
        .setTimeout(30)
        .build();

      // Sign and submit transaction
      const result = await freighterApi.signTransaction(transaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(result, STELLAR_CONFIG.networkPassphrase);
      const submitResult = await this.server.submitTransaction(signedTx);

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
        applicants: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        requirements: jobData.requirements || [],
        deadline: jobData.deadline,
        tags: jobData.tags || [],
      };

      // Store in localStorage temporarily
      const existingJobs = localStorage.getItem('stellar_jobs');
      const jobs = existingJobs ? JSON.parse(existingJobs) : [];
      jobs.push(job);
      localStorage.setItem('stellar_jobs', JSON.stringify(jobs));

      return {
        hash: submitResult.hash,
        status: 'success',
        message: 'Job created successfully',
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
  }

  /**
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

      // Store application ID on blockchain
      const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Build transaction to store application ID
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: `app_${applicationId}`,
            value: jobId, // Just store the job ID reference
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
}

// Export singleton instance
const jobService = new JobService();
export default jobService;
export { JobService };
