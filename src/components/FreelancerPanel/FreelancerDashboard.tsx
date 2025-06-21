import { useState, useEffect } from 'react';
import freelanceService from '../../services/freelanceService';
import jobService from '../../services/jobService';
import { EscrowData } from '../../services/escrowService';
import { ReputationToken } from '../../types/freelance';
import Button from '../Shared/Button';
import Card from '../Shared/Card';
import WalletConnection from '../Shared/WalletConnection';
import { Star, Search, DollarSign, Clock, Award, Shield } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency: 'XLM' | 'USDC';
  employerAddress: string;
  applicantCount: number;
  postedAt: Date;
  isApplied?: boolean;
}

export default function FreelancerDashboard() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [reputationTokens, setReputationTokens] = useState<ReputationToken[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [escrowData, setEscrowData] = useState<{ [jobId: string]: EscrowData }>({});
  const [applicationData, setApplicationData] = useState({
    proposal: '',
    quotedPrice: 0,
    estimatedDuration: '',
  });
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [isLoadingReputation, setIsLoadingReputation] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'browse' | 'applied' | 'reputation'>('browse');
  
  // Job completion states
  const [showCompleteJobModal, setShowCompleteJobModal] = useState(false);
  const [selectedApplicationForCompletion, setSelectedApplicationForCompletion] = useState<any | null>(null);
  const [completionData, setCompletionData] = useState({
    deliverables: '',
    notes: '',
    files: [] as File[]
  });// Load jobs from blockchain/backend
  useEffect(() => {
    loadJobs();
  }, []);
  // Load reputation tokens and applications when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      loadReputationTokens();
      loadMyApplications();
      loadEscrowData();
    }
  }, [walletAddress]);

  const loadJobs = async () => {
    try {
      setIsLoadingJobs(true);
      const response = await jobService.getJobs();
      if (response.success && response.data) {
        // Get applications for applicant count
        const existingApplications = localStorage.getItem('stellar_applications');
        const applications = existingApplications ? JSON.parse(existingApplications) : [];
          // Convert blockchain jobs to local interface format and filter out completed jobs
        const convertedJobs: Job[] = response.data
          .filter(job => job.status !== 'completed') // Filter out completed jobs
          .map(job => ({
            id: job.id,
            title: job.title,
            description: job.description,
            budget: job.budget,
            currency: job.currency,
            employerAddress: job.employerAddress,
            applicantCount: applications.filter((app: any) => app.jobId === job.id).length,
            postedAt: job.createdAt,
            isApplied: false, // Will be updated in loadMyApplications
          }));
        setJobs(convertedJobs);
      } else {
        console.error('Failed to load jobs:', response.error);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Load escrow data for jobs
  const loadEscrowData = async () => {
    try {
      const existingEscrows = JSON.parse(localStorage.getItem('stellar_escrows') || '[]');
      const escrowMap: { [jobId: string]: EscrowData } = {};
      
      existingEscrows.forEach((escrow: any) => {
        escrowMap[escrow.jobId] = {
          jobId: escrow.jobId,
          employerAddress: escrow.employerAddress,
          freelancerAddress: escrow.freelancerAddress,
          amount: escrow.amount,
          currency: escrow.currency,
          status: escrow.status,
          createdAt: new Date(escrow.createdAt),
          releasedAt: escrow.releasedAt ? new Date(escrow.releasedAt) : undefined
        };
      });
      
      setEscrowData(escrowMap);
    } catch (error) {
      console.error('Error loading escrow data:', error);
    }
  };
  const loadReputationTokens = async () => {
    if (!walletAddress) return;
    
    try {
      setIsLoadingReputation(true);
      const tokens = await freelanceService.getReputationTokens(walletAddress);
      setReputationTokens(tokens);
    } catch (error) {
      console.error('Error loading reputation tokens:', error);
    } finally {
      setIsLoadingReputation(false);
    }
  };
  const loadMyApplications = async () => {
    if (!walletAddress) return;
    
    try {
      setIsLoadingApplications(true);
      const response = await jobService.getFreelancerApplications(walletAddress);
      if (response.success && response.data) {
        setMyApplications(response.data);
          // Update jobs with application status
        setJobs(prevJobs => prevJobs.map(job => ({
          ...job,
          isApplied: response.data?.some(app => app.jobId === job.id) || false
        })));
      } else {
        console.error('Failed to load applications:', response.error);
      }
    } catch (error) {
      console.error('Error loading applications:', error);    } finally {
      setIsLoadingApplications(false);
    }
  };
  // View job details
  const handleViewJob = async (job: Job) => {
    // Get full job details
    const response = await jobService.getJobById(job.id);
    if (response.success && response.data) {
      // Check if user has applied to this job
      const hasApplied = myApplications.some(app => app.jobId === job.id);
      setSelectedJob({
        ...response.data,
        isApplied: hasApplied
      });
    } else {
      // Check if user has applied to this job
      const hasApplied = myApplications.some(app => app.jobId === job.id);
      setSelectedJob({
        ...job,
        isApplied: hasApplied
      });
    }
    setShowJobDetails(true);
  };

  // Open apply modal
  const handleOpenApplyModal = (job: Job) => {
    setSelectedJob(job);
    setApplicationData({
      proposal: '',
      quotedPrice: job.budget,
      estimatedDuration: '',
    });
    setShowApplyModal(true);
  };
  // Submit application
  const handleSubmitApplication = async () => {
    if (!walletAddress || !selectedJob) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!applicationData.proposal || !applicationData.estimatedDuration) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const result = await jobService.applyToJob(
        selectedJob.id,
        applicationData.proposal,
        applicationData.quotedPrice,
        applicationData.estimatedDuration
      );

      if (result.status === 'success') {
        // Update local state
        setJobs(jobs.map(job => 
          job.id === selectedJob.id 
            ? { ...job, isApplied: true, applicantCount: job.applicantCount + 1 }
            : job
        ));
        // Reload applications to get the updated list
        await loadMyApplications();
        setShowApplyModal(false);
        alert('Successfully applied to job!');
      } else {
        alert('Failed to apply to job: ' + result.message);
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to apply to job. Please try again.');
    }
  };

  // Open complete job modal
  const handleOpenCompleteJobModal = (application: any) => {
    setSelectedApplicationForCompletion(application);
    setCompletionData({
      deliverables: '',
      notes: '',
      files: []
    });
    setShowCompleteJobModal(true);
  };

  // Handle file upload for completion
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setCompletionData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setCompletionData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // Submit job completion
  const handleSubmitCompletion = async () => {
    if (!walletAddress || !selectedApplicationForCompletion) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!completionData.deliverables.trim()) {
      alert('Please provide completion details');
      return;
    }

    try {
      // In a real app, you would:
      // 1. Upload files to IPFS or cloud storage
      // 2. Get file URLs/hashes
      // 3. Submit completion data to blockchain
      
      const fileUrls = completionData.files.map(file => `mock://file/${file.name}`);
      
      const result = await freelanceService.submitJobCompletion(
        selectedApplicationForCompletion.jobId,
        selectedApplicationForCompletion.id,
        {
          deliverables: completionData.deliverables,
          notes: completionData.notes,
          fileUrls: fileUrls,
          completedAt: new Date()
        }
      );

      if (result.status === 'success') {
        // Reload applications to get updated status
        await loadMyApplications();
        setShowCompleteJobModal(false);
        alert('Job completion submitted successfully! Waiting for employer approval.');
      } else {
        alert('Failed to submit completion: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting completion:', error);
      alert('Failed to submit completion. Please try again.');
    }
  };
  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const appliedJobs = myApplications || [];
  
  // Calculate reputation metrics
  const calculateReputationMetrics = () => {
    if (reputationTokens.length === 0) {
      return {
        totalReputation: 0,
        averageRating: 0,
        totalEarnings: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recentRating: 0
      };
    }

    const totalReputation = reputationTokens.reduce((sum, token) => sum + token.rating, 0);
    const averageRating = totalReputation / reputationTokens.length;
    const totalEarnings = reputationTokens.reduce((sum, token) => sum + (token.jobBudget || 0), 0);
    
    // Rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reputationTokens.forEach(token => {
      ratingDistribution[token.rating as keyof typeof ratingDistribution]++;
    });

    // Recent rating (last 5 tokens)
    const recentTokens = reputationTokens.slice(-5);
    const recentRating = recentTokens.length > 0 
      ? recentTokens.reduce((sum, token) => sum + token.rating, 0) / recentTokens.length 
      : 0;

    return {
      totalReputation,
      averageRating,
      totalEarnings,
      ratingDistribution,
      recentRating
    };
  };

  const reputationMetrics = calculateReputationMetrics();
  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">{/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Freelancer Dashboard</h1>
            <p className="text-gray-600 mt-2">Find opportunities and build your reputation</p>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnection 
            publicKey={walletAddress} 
            onConnect={setWalletAddress} 
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Search className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applied Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{appliedJobs.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reputation Tokens</p>
                <p className="text-2xl font-bold text-gray-900">{reputationTokens.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{reputationMetrics.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <Button
            variant={selectedTab === 'browse' ? 'primary' : 'outline'}
            onClick={() => setSelectedTab('browse')}
          >
            Browse Jobs
          </Button>
          <Button
            variant={selectedTab === 'applied' ? 'primary' : 'outline'}
            onClick={() => setSelectedTab('applied')}
          >
            Applied Jobs ({appliedJobs.length})
          </Button>
          <Button
            variant={selectedTab === 'reputation' ? 'primary' : 'outline'}
            onClick={() => setSelectedTab('reputation')}
          >
            Reputation ({reputationTokens.length})
          </Button>
        </div>

        {/* Content */}
        {selectedTab === 'browse' && (
          <div>
            {/* Search */}
            <Card className="p-4 mb-6">
              <div className="flex items-center space-x-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-0 focus:ring-0 text-gray-900 placeholder-gray-400"
                />
              </div>
            </Card>

            {/* Jobs List */}
            <div className="space-y-4">
              {isLoadingJobs ? (
                <Card className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading jobs...</p>
                </Card>
              ) : filteredJobs.length === 0 ? (
                <Card className="p-8 text-center">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
                  <p className="text-gray-600">Try adjusting your search terms or check back later for new opportunities.</p>
                </Card>
              ) : (
                filteredJobs.map((job) => (
                  <Card key={job.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                          {job.isApplied && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Applied
                            </span>
                          )}
                        </div>                        <p className="text-gray-600 mb-3">{job.description}</p>
                        
                        {/* Escrow Status */}
                        {escrowData[job.id] && (
                          <div className="mb-3">
                            <div className="flex items-center space-x-2 text-sm">
                              <Shield className="w-4 h-4 text-blue-500" />
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                escrowData[job.id].status === 'locked' 
                                  ? 'text-blue-600 bg-blue-100' 
                                  : escrowData[job.id].status === 'released'
                                  ? 'text-green-600 bg-green-100'
                                  : 'text-gray-600 bg-gray-100'
                              }`}>
                                {escrowData[job.id].status === 'locked' && 'Funds Secured in Escrow'}
                                {escrowData[job.id].status === 'released' && 'Payment Released'}
                                {escrowData[job.id].status === 'cancelled' && 'Escrow Cancelled'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{job.budget} {job.currency}</span>
                          </div>
                          <span>{job.applicantCount} applicants</span>
                          <span>Posted: {job.postedAt.toLocaleDateString()}</span>
                          <span>Employer: {job.employerAddress.substring(0, 8)}...</span>
                        </div></div>
                      <div className="flex space-x-2 ml-4">
                        <Button 
                          variant="outline" 
                          onClick={() => handleViewJob(job)}
                        >
                          View Job
                        </Button>
                        {job.isApplied ? (
                          <Button variant="outline" disabled>Applied</Button>
                        ) : (
                          <Button onClick={() => handleOpenApplyModal(job)}>
                            Apply Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}        {selectedTab === 'applied' && (
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Applied Jobs</h2>
              {!walletAddress ? (
                <div className="text-center py-8">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-600">Connect your wallet to view your applications.</p>
                </div>
              ) : isLoadingApplications ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your applications...</p>
                </div>
              ) : appliedJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Applied Jobs</h3>
                  <p className="text-gray-600">Start applying to jobs to see them here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appliedJobs.map((application) => (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Job ID: {application.jobId}
                          </h3>
                          <p className="text-gray-600 mb-3">{application.proposal}</p>                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>Quoted: {application.quotedPrice}</span>
                            </div>
                            <span>Duration: {application.estimatedDuration}</span>
                            <span>Applied: {new Date(application.appliedAt).toLocaleDateString()}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              application.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                              application.status === 'accepted' ? 'text-green-600 bg-green-100' :
                              application.status === 'completed' ? 'text-blue-600 bg-blue-100' :
                              'text-red-600 bg-red-100'
                            }`}>
                              {application.status}
                            </span>
                          </div>

                          {/* Escrow Status for this job */}
                          {escrowData[application.jobId] && (
                            <div className="mt-2">
                              <div className="flex items-center space-x-2 text-sm">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  escrowData[application.jobId].status === 'locked' 
                                    ? 'text-blue-600 bg-blue-100' 
                                    : escrowData[application.jobId].status === 'released'
                                    ? 'text-green-600 bg-green-100'
                                    : 'text-gray-600 bg-gray-100'
                                }`}>
                                  {escrowData[application.jobId].status === 'locked' && 'Payment Secured in Escrow'}
                                  {escrowData[application.jobId].status === 'released' && 'Payment Released to You'}
                                  {escrowData[application.jobId].status === 'cancelled' && 'Escrow Cancelled'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {application.status === 'accepted' && (                            <Button 
                              variant="primary"
                              onClick={() => handleOpenCompleteJobModal(application)}
                            >
                              Mark as Complete
                            </Button>
                          )}
                          <Button 
                            variant="outline"
                            onClick={async () => {
                              // Get job details and show
                              const jobResponse = await jobService.getJobById(application.jobId);
                              if (jobResponse.success && jobResponse.data) {
                                const jobData = jobResponse.data;
                                // Convert to local Job interface
                                const localJob: Job = {
                                  id: jobData.id,
                                  title: jobData.title,
                                  description: jobData.description,
                                  budget: jobData.budget,
                                  currency: jobData.currency,
                                  employerAddress: jobData.employerAddress,
                                  applicantCount: 0,
                                  postedAt: jobData.createdAt,
                                  isApplied: true
                                };
                                handleViewJob(localJob);
                              }
                            }}
                          >
                            View Job
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}        {selectedTab === 'reputation' && (
          <div className="space-y-6">
            {/* Reputation Overview */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Reputation Overview</h2>
              
              {reputationTokens.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reputation Tokens</h3>
                  <p className="text-gray-600">Complete jobs to earn reputation tokens and build your reputation.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Average Rating */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="w-8 h-8 text-yellow-400 fill-current" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{reputationMetrics.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                    <div className="flex items-center justify-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(reputationMetrics.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Total Tokens */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Award className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{reputationTokens.length}</div>
                    <div className="text-sm text-gray-600">Reputation Tokens</div>
                  </div>

                  {/* Total Earnings */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{reputationMetrics.totalEarnings}</div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                  </div>

                  {/* Recent Performance */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{reputationMetrics.recentRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Recent Rating (Last 5)</div>
                  </div>
                </div>
              )}
            </Card>

            {/* Rating Distribution */}
            {reputationTokens.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reputationMetrics.ratingDistribution[rating as keyof typeof reputationMetrics.ratingDistribution];
                    const percentage = reputationTokens.length > 0 ? (count / reputationTokens.length) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 w-16">
                          <span className="text-sm font-medium">{rating}</span>
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-600 w-20">
                          {count} ({percentage.toFixed(0)}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Reputation Tokens List */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Reputation Tokens (SBT)</h2>
              {isLoadingReputation ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading reputation tokens...</p>
                </div>
              ) : reputationTokens.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reputation Tokens</h3>
                  <p className="text-gray-600">Complete jobs to earn reputation tokens.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reputationTokens.map((token) => (
                    <div key={token.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900">{token.jobTitle}</h3>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                              SBT #{token.tokenId.split('_')[1]}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < token.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {token.rating}/5 stars
                            </span>
                            {token.jobBudget && (
                              <span className="text-sm text-gray-500">
                                • {token.jobBudget} {token.jobCurrency}
                              </span>
                            )}
                          </div>

                          {/* Employer Comment */}
                          {token.comment && (
                            <div className="bg-gray-50 p-3 rounded-md mb-2">
                              <p className="text-sm text-gray-700 italic">"{token.comment}"</p>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Completed: {token.mintedAt.toLocaleDateString()}</span>
                            <span>Employer: {token.employerAddress.substring(0, 8)}...</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <div className="text-center">
                            <Award className="w-8 h-8 text-purple-600 mx-auto" />
                            <span className="text-xs font-medium text-purple-600">SBT</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
        </div>
      </div>

      {/* Job Details Modal */}
    {showJobDetails && selectedJob && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedJob.title}</h3>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="text-sm text-gray-500">Budget: {selectedJob.budget} {selectedJob.currency}</span>
                  <span className="text-sm text-gray-500">Employer: {selectedJob.employerAddress?.substring(0, 8)}...</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowJobDetails(false)}
              >
                Close
              </Button>
            </div>
          </div>

          <div className="p-6">
            {/* Job Description */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{selectedJob.description}</p>
            </div>

            {/* Job Requirements */}
            {selectedJob.requirements && selectedJob.requirements.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Requirements</h4>
                <ul className="list-disc list-inside text-gray-600">
                  {selectedJob.requirements.map((req: string, index: number) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Job Tags */}
            {selectedJob.tags && selectedJob.tags.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Section */}
            <div className="border-t pt-6">
              {selectedJob.isApplied ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">You have already applied to this job.</p>
                  <Button variant="outline" disabled>Already Applied</Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Interested in this job?</p>
                  <Button onClick={() => {
                    setShowJobDetails(false);
                    handleOpenApplyModal(selectedJob);
                  }}>
                    Apply Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Apply Modal */}
    {showApplyModal && selectedJob && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply to Job</h3>
          <div className="mb-4">
            <h4 className="font-medium text-gray-900">{selectedJob.title}</h4>
            <p className="text-sm text-gray-600">Budget: {selectedJob.budget} {selectedJob.currency}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proposal</label>
              <textarea
                value={applicationData.proposal}
                onChange={(e) => setApplicationData({ ...applicationData, proposal: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explain why you're the right fit for this job..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Quoted Price</label>
              <input
                type="number"
                value={applicationData.quotedPrice}
                onChange={(e) => setApplicationData({ ...applicationData, quotedPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your price"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration</label>
              <input
                type="text"
                value={applicationData.estimatedDuration}
                onChange={(e) => setApplicationData({ ...applicationData, estimatedDuration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 1 week, 3 days, 2 months"
                required
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              onClick={handleSubmitApplication} 
              className="flex-1"
            >
              Submit Application
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowApplyModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>        </Card>
      </div>
    )}

    {/* Complete Job Modal */}
    {showCompleteJobModal && selectedApplicationForCompletion && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Job</h3>
          <div className="mb-4">
            <h4 className="font-medium text-gray-900">Deliverables for Job ID: {selectedApplicationForCompletion.jobId}</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deliverables</label>
              <textarea
                value={completionData.deliverables}
                onChange={(e) => setCompletionData({ ...completionData, deliverables: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the deliverables for this job..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={completionData.notes}
                onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes for the employer..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Files</label>
              <input
                type="file"
                onChange={handleFileUpload}
                className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                multiple
              />
              <p className="text-sm text-gray-500 mt-1">Upload any files related to the job completion.</p>
            </div>
            
            {completionData.files.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Uploaded Files</h4>
                <div className="flex flex-wrap gap-2">
                  {completionData.files.map((file, index) => (
                    <div key={index} className="flex items-center bg-gray-100 rounded-md px-3 py-2">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="ml-2"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              onClick={handleSubmitCompletion} 
              className="flex-1"
            >
              Submit Completion
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCompleteJobModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>        </Card>
      </div>
    )}
    </>
  );
}
