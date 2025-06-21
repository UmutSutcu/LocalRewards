import { useState } from 'react';
import { Wallet, Store, Heart, ArrowLeft } from 'lucide-react';

// Components
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import Notification from '@/components/Shared/Notification';
import { BusinessDashboard } from '@/components/BusinessPanel';
import { CustomerDashboard } from '@/components/CustomerPanel';
import { DonationDashboard } from '@/components/DonationPanel';

// Context
import { WalletProvider, useWalletContext } from '@/contexts/WalletContext';

// Types
import { NotificationState } from '@/types';

// Main App Component wrapped in WalletProvider
const App = () => {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
};

// App Content Component
const AppContent = () => {
  const { 
    isConnected, 
    address, 
    balance, 
    isLoading, 
    connectWallet,
    disconnect,
    isFreighterInstalled
  } = useWalletContext();

  const [userType, setUserType] = useState<'business' | 'customer' | 'donation' | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showNotification = (message: string, type: NotificationState['type']) => {
    setNotification({
      message,
      type,
      isVisible: true,
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handleConnect = async () => {
    try {
      if (!isFreighterInstalled) {
        showNotification('Freighter wallet is not installed. Please install it first.', 'error');
        return;
      }
      
      await connectWallet();
      showNotification('Successfully connected with Freighter!', 'success');
    } catch (error) {
      showNotification('Failed to connect wallet', 'error');
    }
  };

  const handleSelectUserType = (selectedUserType: 'business' | 'customer' | 'donation') => {
    setUserType(selectedUserType);
  };

  const handleDisconnect = () => {
    disconnect();
    setUserType(null);
    showNotification('Wallet disconnected', 'info');
  };

  const handleBackToPanelSelection = () => {
    setUserType(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  // Not connected - Connect Wallet First
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Stellar Local Rewards
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Modern token-based loyalty program and micro-donation platform built on Stellar blockchain.
              Earn rewards, support local businesses, and make a positive impact in your community.
            </p>
          </div>

          {/* Connect Wallet Section */}
          <div className="max-w-md mx-auto mb-16">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-6">
                To get started, please connect your Freighter wallet. This will allow you to securely interact with the Stellar blockchain.
              </p>
              <Button 
                onClick={handleConnect}
                className="w-full"
                disabled={!isFreighterInstalled}
              >
                {isFreighterInstalled ? 'Connect Freighter Wallet' : 'Freighter Not Installed'}
              </Button>
            </Card>
          </div>

          {/* Wallet Installation Warning */}
          {!isFreighterInstalled && (
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-800 mb-2">
                  <strong>Freighter Wallet not detected!</strong>
                </p>
                <p className="text-blue-600 text-sm mb-3">
                  Freighter is recommended for the best Stellar experience. Install it to connect your wallet.
                </p>
                <Button 
                  onClick={() => window.open('https://www.freighter.app/', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  Install Freighter
                </Button>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Why Choose Stellar Local Rewards?</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Secure & Transparent</h3>
                <p className="text-gray-600">Built on Stellar blockchain with Freighter authentication for maximum security.</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
                <p className="text-gray-600">Instant transactions with near-zero fees thanks to Stellar network.</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Community Focused</h3>
                <p className="text-gray-600">Support local businesses and community projects while earning rewards.</p>
              </div>
            </div>
          </div>
        </div>

        <Notification
          {...notification}
          onClose={hideNotification}
        />
      </div>
    );
  }

  // Connected but no panel selected - Panel Selection
  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Connected Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Stellar Local Rewards
                </h1>
                <span className="text-sm text-gray-500">Choose Your Panel</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Wallet Balance</div>
                  <div className="font-semibold">{balance} XLM</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="font-mono text-sm">{address?.slice(0, 8)}...{address?.slice(-4)}</div>
                </div>
                <Button onClick={handleDisconnect} variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Welcome! Choose Your Panel
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Select the panel that best describes how you want to use Stellar Local Rewards.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Business Panel */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSelectUserType('business')}>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">For Businesses</h3>
              <p className="text-gray-600 mb-6">
                Create and manage loyalty programs, reward customers with tokens, and build lasting relationships.
              </p>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectUserType('business');
                }}
                className="w-full"
              >
                Enter Business Panel
              </Button>
            </Card>

            {/* Customer Panel */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSelectUserType('customer')}>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">For Customers</h3>
              <p className="text-gray-600 mb-6">
                Earn loyalty tokens, redeem rewards, and discover amazing local businesses in your area.
              </p>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectUserType('customer');
                }}
                className="w-full"
              >
                Enter Customer Panel
              </Button>
            </Card>

            {/* Donation Panel */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSelectUserType('donation')}>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">For Donations</h3>
              <p className="text-gray-600 mb-6">
                Support meaningful causes and community projects with secure, transparent donations.
              </p>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectUserType('donation');
                }}
                className="w-full"
              >
                Enter Donation Panel
              </Button>
            </Card>
          </div>
        </div>

        <Notification
          {...notification}
          onClose={hideNotification}
        />
      </div>
    );
  }

  // Connected and panel selected - Show Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleBackToPanelSelection}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Stellar Local Rewards
              </h1>
              <span className="text-sm text-gray-500">
                {userType === 'business' ? 'Business Dashboard' : 
                 userType === 'customer' ? 'Customer Dashboard' : 
                 userType === 'donation' ? 'Donation Portal' : 'Dashboard'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Wallet Balance</div>
                <div className="font-semibold">{balance} XLM</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Address</div>
                <div className="font-mono text-sm">{address?.slice(0, 8)}...{address?.slice(-4)}</div>
              </div>
              <Button onClick={handleDisconnect} variant="outline" size="sm">
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Dashboard Content */}
        {userType === 'business' && <BusinessDashboard />}
        {userType === 'customer' && <CustomerDashboard />}
        {userType === 'donation' && <DonationDashboard />}
      </main>

      <Notification
        {...notification}
        onClose={hideNotification}
      />
    </div>
  );
};

export default App;
