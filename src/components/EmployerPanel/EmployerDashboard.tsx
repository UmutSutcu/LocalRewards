import { useState, useEffect } from 'react';
import jobService from '../../services/jobService';
import escrowService, { EscrowData } from '../../services/escrowService';
import Button from '../Shared/Button';
import Card from '../Shared/Card';
import WalletConnection from '../Shared/WalletConnection';
import { Plus, Briefcase, Clock, CheckCircle, DollarSign, Shield } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency: 'XLM' | 'USDC';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  selectedFreelancer?: string;
  createdAt: Date;
  requirements?: string[];
  tags?: string[];
  escrowContractId?: string;
}

export default function EmployerDashboard() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [escrowData, setEscrowData] = useState<{ [jobId: string]: EscrowData }>({});
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    budget: 0,
    currency: 'USDC' as 'XLM' | 'USDC',
    requirements: [] as string[],
    tags: [] as string[],
  });
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  // Load jobs when component mounts or when address changes
  useEffect(() => {
    if (walletAddress) {
      loadJobs();
      loadAllApplications();
      loadEscrowData();
    }
  }, [walletAddress]);

  const loadJobs = async () => {
    if (!walletAddress) return;
    
    try {
      setIsLoadingJobs(true);
      const response = await jobService.getJobsByEmployer(walletAddress);
      if (response.success && response.data) {
        // Show all jobs including completed ones
        setJobs(response.data);
      } else {
        console.error('Failed to load jobs:', response.error);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Load escrow data for all jobs
  const loadEscrowData = async () => {
    if (!walletAddress) return;
    
    try {
      const escrows = await escrowService.getEmployerEscrows(walletAddress);
      const escrowMap: { [jobId: string]: EscrowData } = {};
      
      escrows.forEach(escrow => {
        escrowMap[escrow.jobId] = escrow;
      });
      
      setEscrowData(escrowMap);
    } catch (error) {
      console.error('Error loading escrow data:', error);
    }
  };const handleCreateJob = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!newJob.title || !newJob.description || !newJob.budget) return;

    try {
      setIsCreatingJob(true);
      const result = await jobService.createJob({
        title: newJob.title,
        description: newJob.description,
        budget: newJob.budget,
        currency: newJob.currency,
        requirements: newJob.requirements,
        tags: newJob.tags,
      });

      if (result.status === 'success') {
        // Reload jobs to include the new one
        await loadJobs();
        setNewJob({ 
          title: '', 
          description: '', 
          budget: 0, 
          currency: 'USDC',
          requirements: [],
          tags: []
        });
        setShowCreateJob(false);
        alert('Job created successfully!');
      } else {
        alert('Failed to create job: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job. Please try again.');
    } finally {
      setIsCreatingJob(false);
    }
  };

  // Load job applications for a specific job
  const loadJobApplications = async (jobId: string) => {
    try {
      setIsLoadingApplications(true);
      const response = await jobService.getJobApplications(jobId);
      if (response.success && response.data) {
        setJobApplications(response.data);
      } else {
        console.error('Failed to load applications:', response.error);
        setJobApplications([]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      setJobApplications([]);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  // View job details and applications
  const handleViewJob = async (job: Job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
    await loadJobApplications(job.id);
  };

  // Accept an application
  const handleAcceptApplication = async (applicationId: string, freelancerAddress: string) => {
    if (!selectedJob) return;
    
    try {
      const result = await jobService.acceptApplication(selectedJob.id, applicationId, freelancerAddress);
      if (result.status === 'success') {
        alert('Application accepted! Job has been assigned.');
        await loadJobs(); // Reload jobs to update status
        await loadJobApplications(selectedJob.id); // Reload applications
      } else {
        alert('Failed to accept application: ' + result.message);
      }
    } catch (error) {
      console.error('Error accepting application:', error);
      alert('Failed to accept application. Please try again.');
    }
  };

  // Reject an application
  const handleRejectApplication = async (applicationId: string) => {
    try {
      const result = await jobService.rejectApplication(applicationId);
      if (result.status === 'success') {
        await loadJobApplications(selectedJob!.id); // Reload applications
      } else {
        alert('Failed to reject application: ' + result.message);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application. Please try again.');
    }
  };

  // Complete a job
  const handleCompleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to mark this job as completed?')) return;
    
    try {
      const result = await jobService.completeJob(jobId);
      if (result.status === 'success') {
        alert('Job marked as completed!');
        await loadJobs(); // Reload jobs to update status
        setShowJobDetails(false);
      } else {
        alert('Failed to complete job: ' + result.message);
      }
    } catch (error) {
      console.error('Error completing job:', error);
      alert('Failed to complete job. Please try again.');
    }
  };

  // Approve job completion and process payment
  const handleApproveCompletion = async (applicationId: string, rating: number = 5) => {
    if (!selectedJob) return;
    
    if (!confirm('This will approve the job completion, transfer payment, and mint reputation token. Continue?')) {
      return;
    }
    
    try {
      const result = await jobService.approveJobCompletion(
        selectedJob.id,
        applicationId,
        walletAddress!,
        rating
      );
      
      if (result.status === 'success') {
        alert('Job completion approved! Payment transferred and reputation token minted.');
        await loadJobs(); // Reload jobs to update status
        await loadJobApplications(selectedJob.id); // Reload applications
        setShowJobDetails(false);
      } else {
        alert('Failed to approve completion: ' + result.message);
      }
    } catch (error) {
      console.error('Error approving completion:', error);
      alert('Failed to approve completion. Please try again.');
    }
  };

  // Update job status
  const handleUpdateJobStatus = async (jobId: string, newStatus: Job['status']) => {
    try {
      const result = await jobService.updateJobStatus(jobId, newStatus);
      if (result.status === 'success') {
        await loadJobs(); // Reload jobs to update status
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob({ ...selectedJob, status: newStatus });
        }
      } else {
        alert('Failed to update job status: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status. Please try again.');
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
    }
  };

  const getStatusText = (status: Job['status']) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
    }  };

  // Load all applications for counting
  const loadAllApplications = async () => {
    try {
      const existingApplications = localStorage.getItem('stellar_applications');
      const applications = existingApplications ? JSON.parse(existingApplications) : [];
      setAllApplications(applications);
    } catch (error) {
      console.error('Error loading all applications:', error);
      setAllApplications([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your freelance projects and hire talent</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => {
                if (!walletAddress) {
                  alert('Please connect your wallet first');
                  return;
                }
                setShowCreateJob(true);
              }}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Post Job</span>
            </Button>
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
              <Briefcase className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter(j => j.status === 'open' || j.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter(j => j.status === 'completed').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.reduce((sum, job) => sum + job.budget, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>        {/* Jobs List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Jobs</h2>
            <div className="flex space-x-1">
              <Button
                variant={selectedTab === 'active' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedTab('active')}
              >
                Active Jobs ({jobs.filter(job => job.status !== 'completed').length})
              </Button>
              <Button
                variant={selectedTab === 'completed' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedTab('completed')}
              >
                Completed Jobs ({jobs.filter(job => job.status === 'completed').length})
              </Button>
            </div>
          </div>
            {!walletAddress ? (
            <div className="text-center py-8">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-4">Connect your wallet to view and manage your jobs.</p>
              <p className="text-gray-600">Please use the wallet connection above.</p>
            </div>
          ) : isLoadingJobs ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Posted</h3>
              <p className="text-gray-600 mb-4">Start by posting your first job to find talented freelancers.</p>              <Button onClick={() => {
                if (!walletAddress) {
                  alert('Please connect your wallet first');
                  return;
                }
                setShowCreateJob(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Post Your First Job
              </Button>
            </div>          ) : (
            <div>
              {(() => {
                const filteredJobs = selectedTab === 'active' 
                  ? jobs.filter(job => job.status !== 'completed')
                  : jobs.filter(job => job.status === 'completed');
                
                if (filteredJobs.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No {selectedTab === 'active' ? 'Active' : 'Completed'} Jobs
                      </h3>
                      <p className="text-gray-600">
                        {selectedTab === 'active' 
                          ? 'Post a new job to get started' 
                          : 'No completed jobs yet'}
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusText(job.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{job.description}</p>                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Budget: {job.budget} {job.currency}</span>
                      <span>Applicants: {allApplications.filter(app => app.jobId === job.id).length}</span>
                      <span>Posted: {job.createdAt.toLocaleDateString()}</span>
                      {job.selectedFreelancer && (
                        <span>Freelancer: {job.selectedFreelancer.substring(0, 8)}...</span>
                      )}
                    </div>

                    {/* Escrow Status */}
                    {escrowData[job.id] && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            escrowData[job.id].status === 'locked' 
                              ? 'text-blue-600 bg-blue-100' 
                              : escrowData[job.id].status === 'released'
                              ? 'text-green-600 bg-green-100'
                              : 'text-gray-600 bg-gray-100'
                          }`}>
                            {escrowData[job.id].status === 'locked' && 'Funds Locked in Escrow'}
                            {escrowData[job.id].status === 'released' && 'Funds Released'}
                            {escrowData[job.id].status === 'cancelled' && 'Escrow Cancelled'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewJob(job)}
                    >
                      View
                    </Button>
                    {job.status === 'open' && (
                      <Button 
                        size="sm"
                        onClick={() => handleViewJob(job)}
                      >
                        Manage
                      </Button>
                    )}
                    {job.status === 'in_progress' && (
                      <Button 
                        size="sm"
                        onClick={() => handleCompleteJob(job.id)}
                      >
                        Complete
                      </Button>
                    )}
                  </div></div>
              </div>                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </Card>

        {/* Create Job Modal */}
        {showCreateJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Post New Job</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Website Development"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what you need..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                    <input
                      type="number"
                      value={newJob.budget}
                      onChange={(e) => setNewJob({ ...newJob, budget: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={newJob.currency}
                      onChange={(e) => setNewJob({ ...newJob, currency: e.target.value as 'XLM' | 'USDC' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USDC">USDC</option>
                      <option value="XLM">XLM</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirements (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newJob.requirements.join(', ')}
                    onChange={(e) => setNewJob({ 
                      ...newJob, 
                      requirements: e.target.value.split(',').map(req => req.trim()).filter(req => req) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="React, TypeScript, 3+ years experience"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newJob.tags.join(', ')}
                    onChange={(e) => setNewJob({ 
                      ...newJob, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="frontend, react, urgent"
                  />
                </div>
              </div>              <div className="flex space-x-3 mt-6">
                <Button 
                  onClick={handleCreateJob} 
                  className="flex-1"
                  disabled={isCreatingJob}
                >
                  {isCreatingJob ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Post Job'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateJob(false)}
                  className="flex-1"
                  disabled={isCreatingJob}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Job Details Modal */}
        {showJobDetails && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedJob.title}</h3>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedJob.status)}`}>
                        {getStatusText(selectedJob.status)}
                      </span>
                      <span className="text-sm text-gray-500">Budget: {selectedJob.budget} {selectedJob.currency}</span>
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
                      {selectedJob.requirements.map((req, index) => (
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
                      {selectedJob.tags.map((tag, index) => (
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

                {/* Job Status Actions */}
                {selectedJob.status === 'open' && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Actions</h4>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateJobStatus(selectedJob.id, 'cancelled')}
                      >
                        Cancel Job
                      </Button>
                    </div>
                  </div>
                )}

                {/* Applications Section */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Applications ({jobApplications.length})
                  </h4>
                  
                  {isLoadingApplications ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading applications...</p>
                    </div>
                  ) : jobApplications.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No applications yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {jobApplications.map((application) => (
                        <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h5 className="font-medium text-gray-900">
                                  {application.freelancerAddress.substring(0, 8)}...
                                </h5>                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  application.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                                  application.status === 'accepted' ? 'text-green-600 bg-green-100' :
                                  application.status === 'completed' ? 'text-blue-600 bg-blue-100' :
                                  application.status === 'approved' ? 'text-purple-600 bg-purple-100' :
                                  'text-red-600 bg-red-100'
                                }`}>
                                  {application.status}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-2">{application.proposal}</p>
                              
                              {/* Show completion details if completed */}
                              {application.status === 'completed' && application.completionData && (
                                <div className="bg-blue-50 p-3 rounded-md mb-2">
                                  <h6 className="font-medium text-blue-900 mb-1">Completion Details:</h6>
                                  <p className="text-blue-800 text-sm mb-1">{application.completionData.deliverables}</p>
                                  {application.completionData.notes && (
                                    <p className="text-blue-700 text-xs">Notes: {application.completionData.notes}</p>
                                  )}
                                  {application.completionData.fileUrls && application.completionData.fileUrls.length > 0 && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      Files attached: {application.completionData.fileUrls.length}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Quoted Price: {application.quotedPrice} {selectedJob.currency}</span>
                                <span>Duration: {application.estimatedDuration}</span>
                                <span>Applied: {new Date(application.appliedAt).toLocaleDateString()}</span>
                                {application.status === 'completed' && application.submittedAt && (
                                  <span>Completed: {new Date(application.submittedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex space-x-2 ml-4">
                              {selectedJob.status === 'open' && application.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcceptApplication(application.id, application.freelancerAddress)}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectApplication(application.id)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              
                              {application.status === 'completed' && (
                                <div className="flex flex-col space-y-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveCompletion(application.id, 5)}
                                  >
                                    Approve & Pay
                                  </Button>
                                  <p className="text-xs text-gray-500">This will transfer payment<br/>and mint reputation token</p>
                                </div>
                              )}
                              
                              {application.status === 'approved' && (
                                <div className="text-center">
                                  <div className="text-green-600 text-sm font-medium">✓ Completed</div>
                                  <div className="text-xs text-gray-500">Payment sent</div>
                                </div>                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
