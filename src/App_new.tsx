import { useState } from 'react';
import { WalletProvider, useWalletContext } from './contexts/WalletContext';
import EmployerDashboard from './components/EmployerPanel/EmployerDashboard';
import FreelancerDashboard from './components/FreelancerPanel/FreelancerDashboard';
import WalletModal from './components/Shared/WalletModal';
import { Wallet, User, Briefcase, Star } from 'lucide-react';

type UserType = 'employer' | 'freelancer' | null;

function AppContent() {
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
  const { showWalletModal, setShowWalletModal, isConnected, address } = useWalletContext();

  const handleUserTypeSelection = (type: UserType) => {
    setSelectedUserType(type);
  };

  const renderSelectedPanel = () => {
    switch (selectedUserType) {
      case 'employer':
        return <EmployerDashboard />;
      case 'freelancer':
        return <FreelancerDashboard />;
      default:
        return renderLandingPage();
    }
  };

  const renderLandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            StellarFreelance
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stellar blockchain-based P2P freelance marketplace with escrow & reputation system. 
            Secure payments, transparent reputation tokens, and decentralized job matching.
          </p>
        </div>

        {/* Wallet Status */}
        {isConnected && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center space-x-2">
              <Wallet className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Wallet Connected: {address?.substring(0, 8)}...{address?.substring(-8)}
              </span>
            </div>
          </div>
        )}

        {/* User Type Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div 
            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-primary-500"
            onClick={() => handleUserTypeSelection('employer')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Employer</h3>
              <p className="text-gray-600 mb-4">
                Post jobs, hire talented freelancers, and manage projects with secure escrow payments.
              </p>
              <div className="text-sm text-blue-600 font-medium">
                Job posting • Escrow management • Talent hiring
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-primary-500"
            onClick={() => handleUserTypeSelection('freelancer')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Freelancer</h3>
              <p className="text-gray-600 mb-4">
                Find great projects, build your reputation with SBT tokens, and get paid securely.
              </p>
              <div className="text-sm text-green-600 font-medium">
                Job browsing • Reputation building • Secure payments
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            🔗 Stellar Blockchain • 🔐 Smart Contract Escrow • ⭐ Soulbound Reputation Tokens • 💼 P2P Marketplace
          </p>
        </div>

        {/* Back button for selected user type */}
        {selectedUserType && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setSelectedUserType(null)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderSelectedPanel()}
      
      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        title="Wallet Connection Required"
        description="You need to connect your wallet to perform this transaction."
      />
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;
