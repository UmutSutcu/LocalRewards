import { useState } from 'react';
import { Wallet, Store, Heart } from 'lucide-react';

// Components
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import Notification from '@/components/Shared/Notification';
import { BusinessDashboard } from '@/components/BusinessPanel';
import { CustomerDashboard } from '@/components/CustomerPanel';
import { DonationDashboard } from '@/components/DonationPanel';

// Hooks
import { useWallet } from '@/hooks/useWallet';

// Types
import { NotificationState } from '@/types';

function App() {
  const { 
    isConnected, 
    address, 
    balance, 
    isLoading: walletLoading, 
    connectWithPasskey,
    disconnect,
    isPasskeySupported 
  } = useWallet();

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

  const handleConnect = async (selectedUserType: 'business' | 'customer' | 'donation') => {
    try {
      await connectWithPasskey();
      setUserType(selectedUserType);
      showNotification('Successfully connected with Passkey!', 'success');
    } catch (error) {
      showNotification('Failed to connect wallet', 'error');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setUserType(null);
    showNotification('Wallet disconnected', 'info');
  };

  // Loading state
  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  // Not connected - Landing page
  if (!isConnected || !userType) {
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

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Business Card */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">For Businesses</h3>
              <p className="text-gray-600 mb-6">
                Create and manage loyalty programs, reward customers with tokens, and build lasting relationships.
              </p>
              <Button 
                onClick={() => handleConnect('business')}
                className="w-full"
                disabled={!isPasskeySupported}
              >
                Connect as Business
              </Button>
            </Card>

            {/* Customer Card */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">For Customers</h3>
              <p className="text-gray-600 mb-6">
                Earn loyalty tokens, redeem rewards, and discover amazing local businesses in your area.
              </p>
              <Button 
                onClick={() => handleConnect('customer')}
                className="w-full"
                disabled={!isPasskeySupported}
              >
                Connect as Customer
              </Button>
            </Card>

            {/* Donation Card */}
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">For Donations</h3>
              <p className="text-gray-600 mb-6">
                Support meaningful causes and community projects with secure, transparent donations.
              </p>
              <Button 
                onClick={() => handleConnect('donation')}
                className="w-full"
                disabled={!isPasskeySupported}
              >
                Explore Donations
              </Button>
            </Card>
          </div>

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
                <p className="text-gray-600">Built on Stellar blockchain with Passkey authentication for maximum security.</p>
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

          {!isPasskeySupported && (
            <div className="mt-8 text-center">
              <p className="text-red-600">
                Your browser does not support Passkeys. Please use a modern browser like Chrome, Safari, or Edge.
              </p>
            </div>
          )}
        </div>

        <Notification
          {...notification}
          onClose={hideNotification}
        />
      </div>
    );
  }

  // Connected Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
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
}

export default App;
