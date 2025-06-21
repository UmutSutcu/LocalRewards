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
      case 'business':
        return <BusinessDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      case 'donor':
        return <DonationDashboard />;
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
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            StellarLocalRewards
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stellar blockchain-based local loyalty program and micro-donation platform. 
            Explore without wallet connection, connect only for transactions.
          </p>
        </div>

        {/* Wallet Status */}
        {isConnected && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">            <div className="flex items-center justify-center space-x-2">
              <Wallet className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Wallet Connected: {address?.substring(0, 8)}...{address?.substring(-8)}
              </span>
            </div>
          </div>
        )}

        {/* User Type Selection */}
        <div className="grid md:grid-cols-3 gap-6">
          <div 
            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-primary-500"
            onClick={() => handleUserTypeSelection('business')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>              <h3 className="text-xl font-semibold text-gray-900 mb-2">Business</h3>
              <p className="text-gray-600 mb-4">
                Create and manage customer loyalty programs. Distribute tokens, increase customer loyalty.
              </p>
              <div className="text-sm text-blue-600 font-medium">
                Loyalty programs, Token management, Customer analytics
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-primary-500"
            onClick={() => handleUserTypeSelection('customer')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer</h3>
              <p className="text-gray-600 mb-4">
                Earn tokens by shopping, discover and use rewards. Support local businesses.
              </p>
              <div className="text-sm text-green-600 font-medium">
                Token earning, Reward redemption, Local support
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-primary-500"
            onClick={() => handleUserTypeSelection('donor')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>              <h3 className="text-xl font-semibold text-gray-900 mb-2">Donor</h3>
              <p className="text-gray-600 mb-4">
                Make micro-donations to social responsibility projects. Transparent and secure donation system.
              </p>
              <div className="text-sm text-purple-600 font-medium">
                Micro-donations, Transparency, Social impact
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            🔗 Stellar Blockchain • 🔐 Passkey Auth • ⚡ Launchtube Paymaster • 💼 Smart Contracts
          </p>
        </div>

        {/* Back button for selected user type */}
        {selectedUserType && (
          <div className="mt-8 text-center">            <button
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
        onClose={() => setShowWalletModal(false)}        title="Wallet Connection Required"
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