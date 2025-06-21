import { useState, useEffect } from 'react';
import { useWalletRequired } from '../../hooks/useWalletRequired';
import freelanceService from '../../services/freelanceService';
import jobService from '../../services/jobService';
import { ReputationToken } from '../../types/freelance';
import Button from '../Shared/Button';
import Card from '../Shared/Card';
import { Star, Search, DollarSign, Clock, Award } from 'lucide-react';

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
  const { requireWalletWithModal, address } = useWalletRequired();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reputationTokens, setReputationTokens] = useState<ReputationToken[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingReputation, setIsLoadingReputation] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'browse' | 'applied' | 'reputation'>('browse');

  // Load jobs from blockchain/backend
  useEffect(() => {
    loadJobs();
  }, []);

  // Load reputation tokens when wallet is connected
  useEffect(() => {
    if (address) {
      loadReputationTokens();
    }
  }, [address]);

  const loadJobs = async () => {
    try {
      setIsLoadingJobs(true);
      const response = await jobService.getJobs();
      if (response.success && response.data) {
        // Convert blockchain jobs to local interface format
        const convertedJobs: Job[] = response.data.map(job => ({
          id: job.id,
          title: job.title,
          description: job.description,
          budget: job.budget,
          currency: job.currency,
          employerAddress: job.employerAddress,
          applicantCount: job.applicants?.length || 0,
          postedAt: job.createdAt,
          isApplied: false, // TODO: Check if user has applied to this job
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

  const loadReputationTokens = async () => {
    if (!address) return;
    
    try {
      setIsLoadingReputation(true);
      const tokens = await freelanceService.getReputationTokens(address);
      setReputationTokens(tokens);
    } catch (error) {
      console.error('Error loading reputation tokens:', error);
    } finally {
      setIsLoadingReputation(false);
    }
  };

  const handleApplyJob = async (jobId: string) => {
    const isWalletConnected = await requireWalletWithModal();
    if (!isWalletConnected) return;
    
    try {
      const result = await jobService.applyToJob(
        jobId,
        'I am interested in this job and would like to apply.',
        0, // Quote same as job budget for now
        '1 week'
      );

      if (result.status === 'success') {
        // Update local state
        setJobs(jobs.map(job => 
          job.id === jobId 
            ? { ...job, isApplied: true, applicantCount: job.applicantCount + 1 }
            : job
        ));
        alert('Successfully applied to job!');
      } else {
        alert('Failed to apply to job: ' + result.message);
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to apply to job. Please try again.');
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const appliedJobs = jobs.filter(job => job.isApplied);
  const totalReputation = reputationTokens.reduce((sum, token) => sum + token.rating, 0);
  const averageRating = reputationTokens.length > 0 ? totalReputation / reputationTokens.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Freelancer Dashboard</h1>
            <p className="text-gray-600 mt-2">Find opportunities and build your reputation</p>
          </div>
          <div className="text-sm text-gray-500">
            {address ? `${address.substring(0, 8)}...${address.substring(-8)}` : 'Not connected'}
          </div>
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
                <p className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
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
                        </div>
                        <p className="text-gray-600 mb-3">{job.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{job.budget} {job.currency}</span>
                          </div>
                          <span>{job.applicantCount} applicants</span>
                          <span>Posted: {job.postedAt.toLocaleDateString()}</span>
                          <span>Employer: {job.employerAddress.substring(0, 8)}...</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {job.isApplied ? (
                          <Button variant="outline" disabled>Applied</Button>
                        ) : (
                          <Button onClick={() => handleApplyJob(job.id)}>
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
        )}

        {selectedTab === 'applied' && (
          <div className="space-y-4">
            {appliedJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applied Jobs</h3>
                <p className="text-gray-600">Start applying to jobs to see them here.</p>
              </Card>
            ) : (
              appliedJobs.map((job) => (
                <Card key={job.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{job.title}</h3>
                      <p className="text-gray-600 mb-3">{job.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{job.budget} {job.currency}</span>
                        </div>
                        <span>Applied: {job.postedAt.toLocaleDateString()}</span>
                        <span>Status: Pending Review</span>
                      </div>
                    </div>
                    <Button variant="outline">View Details</Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {selectedTab === 'reputation' && (
          <div>
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
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{token.jobTitle}</h3>
                          <div className="flex items-center space-x-2 mt-1">
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
                            <span className="text-sm text-gray-500">
                              {token.rating}/5 stars
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Completed: {token.mintedAt.toLocaleDateString()} • 
                            Employer: {token.employerAddress.substring(0, 8)}...
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Award className="w-8 h-8 text-purple-600" />
                          <span className="text-sm font-medium text-purple-600">SBT</span>
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
  );
}
