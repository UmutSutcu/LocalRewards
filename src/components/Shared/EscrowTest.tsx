import React, { useState, useEffect } from 'react';
import sorobanEscrowService from '../../services/sorobanEscrowService';
import Button from '../Shared/Button';
import Card from '../Shared/Card';

interface EscrowTestState {
  isLoading: boolean;
  message: string;
  jobId: string;
  employerAddress: string;
  freelancerAddress: string;
  amount: number;
  jobData: any;
  escrowStats: {
    totalReserved: number;
    totalPaid: number;
    activeEscrows: number;
    completedPayments: number;
  } | null;
}

export const EscrowTest: React.FC = () => {  const [state, setState] = useState<EscrowTestState>({
    isLoading: false,
    message: '',
    jobId: '',
    employerAddress: '',
    freelancerAddress: '',
    amount: 0,
    jobData: null,
    escrowStats: null
  });  const updateState = (updates: Partial<EscrowTestState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Auto-refresh stats when employer address changes
  useEffect(() => {
    if (state.employerAddress) {
      loadEscrowStats();
    }
  }, [state.employerAddress]);

  const loadEscrowStats = async () => {
    try {
      if (state.employerAddress) {
        const stats = await sorobanEscrowService.getEscrowStats(state.employerAddress);
        updateState({ escrowStats: stats });
      }
    } catch (error) {
      console.error('Error loading escrow stats:', error);
    }
  };

  const handleCreateJob = async () => {
    if (!state.jobId || !state.employerAddress || !state.freelancerAddress || state.amount <= 0) {
      updateState({ message: 'Please fill all fields with valid values' });
      return;
    }

    updateState({ isLoading: true, message: 'Creating job with escrow...' });

    try {
      const result = await sorobanEscrowService.createJob(
        state.jobId,
        state.employerAddress,
        state.freelancerAddress,
        state.amount
      );      if (result.status === 'success') {
        updateState({
          message: `✅ Job created successfully! ${result.message}`,
          isLoading: false
        });
        // Refresh stats after creating a job
        await loadEscrowStats();
      } else {
        updateState({
          message: `❌ Failed to create job: ${result.message}`,
          isLoading: false
        });
      }
    } catch (error: any) {
      updateState({
        message: `❌ Error: ${error.message}`,
        isLoading: false
      });
    }
  };

  const handleReleasePayment = async () => {
    if (!state.jobId) {
      updateState({ message: 'Please enter a job ID' });
      return;
    }

    updateState({ isLoading: true, message: 'Releasing payment...' });

    try {
      const result = await sorobanEscrowService.releasePayment(state.jobId);      if (result.status === 'success') {
        updateState({
          message: `✅ Payment released! ${result.message}`,
          isLoading: false
        });
        // Refresh stats after releasing payment
        await loadEscrowStats();
      } else {
        updateState({
          message: `❌ Failed to release payment: ${result.message}`,
          isLoading: false
        });
      }
    } catch (error: any) {
      updateState({
        message: `❌ Error: ${error.message}`,
        isLoading: false
      });
    }
  };

  const handleGetJob = async () => {
    if (!state.jobId) {
      updateState({ message: 'Please enter a job ID' });
      return;
    }

    updateState({ isLoading: true, message: 'Getting job data...' });

    try {
      const jobData = await sorobanEscrowService.getJob(state.jobId);

      if (jobData) {
        updateState({
          jobData,
          message: '✅ Job data retrieved successfully',
          isLoading: false
        });
      } else {
        updateState({
          jobData: null,
          message: '❌ Job not found',
          isLoading: false
        });
      }
    } catch (error: any) {
      updateState({
        message: `❌ Error: ${error.message}`,
        isLoading: false
      });
    }
  };

  const handleCancelJob = async () => {
    if (!state.jobId) {
      updateState({ message: 'Please enter a job ID' });
      return;
    }

    updateState({ isLoading: true, message: 'Cancelling job...' });

    try {
      const result = await sorobanEscrowService.cancelJob(state.jobId);      if (result.status === 'success') {
        updateState({
          message: `✅ Job cancelled! ${result.message}`,
          isLoading: false,
          jobData: null
        });
        // Refresh stats after cancelling job
        await loadEscrowStats();
      } else {
        updateState({
          message: `❌ Failed to cancel job: ${result.message}`,
          isLoading: false
        });
      }
    } catch (error: any) {
      updateState({
        message: `❌ Error: ${error.message}`,
        isLoading: false
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">
            🧪 Soroban Escrow Service Test
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Job Parameters</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Job ID</label>
                <input
                  type="text"
                  value={state.jobId}
                  onChange={(e) => updateState({ jobId: e.target.value })}
                  placeholder="e.g., job_001"
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Employer Address</label>
                <input
                  type="text"
                  value={state.employerAddress}
                  onChange={(e) => updateState({ employerAddress: e.target.value })}
                  placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full p-2 border rounded-md font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Freelancer Address</label>
                <input
                  type="text"
                  value={state.freelancerAddress}
                  onChange={(e) => updateState({ freelancerAddress: e.target.value })}
                  placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full p-2 border rounded-md font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount (XLM)</label>
                <input
                  type="number"
                  value={state.amount}
                  onChange={(e) => updateState({ amount: parseFloat(e.target.value) || 0 })}
                  placeholder="100"
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Actions</h3>
                <div className="space-y-3">
                <Button
                  onClick={handleCreateJob}
                  disabled={state.isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  📝 Create Job with Escrow
                </Button>

                <Button
                  onClick={handleGetJob}
                  disabled={state.isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  🔍 Get Job Data
                </Button>

                <Button
                  onClick={handleReleasePayment}
                  disabled={state.isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  💰 Release Payment
                </Button>

                <Button
                  onClick={handleCancelJob}
                  disabled={state.isLoading}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  ❌ Cancel Job
                </Button>

                <Button
                  onClick={loadEscrowStats}
                  disabled={state.isLoading || !state.employerAddress}
                  className="w-full bg-gray-600 hover:bg-gray-700"
                >
                  📊 Refresh Escrow Stats
                </Button>
              </div>
            </div>
          </div>          {/* Status Message */}
          {state.message && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <p className="text-sm font-medium">{state.message}</p>
            </div>
          )}

          {/* Escrow Statistics */}
          {state.escrowStats && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h4 className="font-semibold mb-3">📊 Escrow Statistics:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <div className="text-blue-600 font-medium">Reserved (XLM)</div>
                  <div className="text-2xl font-bold">{state.escrowStats.totalReserved.toFixed(2)}</div>
                  <div className="text-gray-500">{state.escrowStats.activeEscrows} active escrows</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-green-600 font-medium">Total Paid (XLM)</div>
                  <div className="text-2xl font-bold">{state.escrowStats.totalPaid.toFixed(2)}</div>
                  <div className="text-gray-500">{state.escrowStats.completedPayments} payments</div>
                </div>
              </div>
            </div>
          )}

          {/* Job Data Display */}
          {state.jobData && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h4 className="font-semibold mb-2">Job Data:</h4>
              <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                {JSON.stringify(state.jobData, null, 2)}
              </pre>
            </div>
          )}

          {/* Loading Indicator */}
          {state.isLoading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Processing...</p>
            </div>
          )}
        </div>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">📋 Usage Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Fill in the job parameters (Job ID, employer address, freelancer address, amount)</li>
            <li>Click "Create Job with Escrow" to create a new job with escrow protection</li>
            <li>Use "Get Job Data" to view the current job status</li>
            <li>Click "Release Payment" to transfer funds from employer to freelancer (requires wallet authorization)</li>
            <li>Use "Cancel Job" to cancel the job if payment hasn't been released yet</li>
          </ol>
            <div className="mt-4 p-3 bg-yellow-50 rounded-md">
            <p className="text-sm">
              <strong>Note:</strong> This is a simulation of the Soroban smart contract. 
              In production, these operations would interact directly with the deployed contract on Stellar.
            </p>
            <p className="text-sm mt-2">
              <strong>Fixed:</strong> Duplicate escrow entries are now automatically cleaned up to prevent 
              double-counting of reserved XLM amounts during transactions.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EscrowTest;
