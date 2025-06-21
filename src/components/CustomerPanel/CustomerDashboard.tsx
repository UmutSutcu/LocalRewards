import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Gift, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  QrCode, 
  MapPin,
  Search,
  ArrowUpRight,
  Trophy,
  Zap
} from 'lucide-react';
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import WalletConnection from '@/components/Shared/WalletConnection';
import { formatNumber, formatDate } from '@/utils';
import { useWalletRequired } from '@/hooks/useWalletRequired';

interface TokenBalance {
  tokenSymbol: string;
  tokenName: string;
  balance: number;
  businessName: string;
  businessLogo?: string;
  earnRate: number;
  businessLocation?: string;
}

interface RewardOption {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: string;
  businessName: string;
  isAvailable: boolean;
  discount?: number;
  originalPrice?: number;
  image?: string;
}

interface Transaction {
  id: string;
  type: 'earn' | 'redeem' | 'transfer';
  amount: number;
  tokenSymbol: string;
  businessName: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending';
}

const CustomerDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tokens' | 'rewards' | 'history'>('overview');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pendingAction, setPendingAction] = useState<'earnTokens' | 'redeemReward' | 'scanQR' | null>(null);
  const [pendingActionData, setPendingActionData] = useState<string | null>(null);
  const { requireWalletWithModal, address } = useWalletRequired();  // Auto-update wallet address and handle pending actions
  useEffect(() => {
    console.log('useEffect triggered - address:', address, 'pendingAction:', pendingAction);
    
    if (address) {
      setWalletAddress(address);
      console.log('Wallet address updated:', address);
      
      // Execute pending action if any
      if (pendingAction) {
        console.log('Executing pending action:', pendingAction, 'with data:', pendingActionData);
        
        switch (pendingAction) {
          case 'earnTokens':
            if (pendingActionData) {
              console.log('Executing pending token earning for:', pendingActionData);
              // Execute earn tokens logic here
            }
            break;
          case 'redeemReward':
            if (pendingActionData) {
              console.log('Executing pending reward redemption for:', pendingActionData);
              // Execute redeem logic here
            }
            break;
          case 'scanQR':
            console.log('Executing pending QR scan');
            setShowQRScanner(true);
            break;
        }
        // Clear pending actions
        console.log('Clearing pending actions');
        setPendingAction(null);
        setPendingActionData(null);
      }
    }
  }, [address, pendingAction, pendingActionData]);
  // Mock data - will come from API in real application
  const tokenBalances: TokenBalance[] = [
    {
      tokenSymbol: 'COFFEE',
      tokenName: 'Coffee Shop Rewards',
      balance: 250,
      businessName: 'Stellar Coffee Co.',
      earnRate: 1,
      businessLocation: 'Istanbul, Besiktas'
    },
    {
      tokenSymbol: 'BOOKS',
      tokenName: 'Book Store Points',
      balance: 180,
      businessName: 'Galaxy Books',
      earnRate: 2,
      businessLocation: 'Istanbul, Kadikoy'
    },
    {
      tokenSymbol: 'PIZZA',
      tokenName: 'Pizza Palace Tokens',
      balance: 75,
      businessName: 'Cosmic Pizza',
      earnRate: 1.5,
      businessLocation: 'Istanbul, Sisli'
    },
  ];

  const rewardOptions: RewardOption[] = [
    {
      id: '1',
      title: 'Free Coffee',
      description: 'Free medium coffee of your choice',
      cost: 100,
      category: 'Beverage',
      businessName: 'Stellar Coffee Co.',
      isAvailable: true,
      originalPrice: 25,
      image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=400'
    },
    {
      id: '2',
      title: '10% Discount',
      description: '10% discount on your next book purchase',
      cost: 50,
      category: 'Discount',
      businessName: 'Galaxy Books',
      isAvailable: true,
      discount: 10,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    },
    {
      id: '3',
      title: 'Free Pizza Slice',
      description: 'Free slice with any pizza order',
      cost: 25,
      category: 'Food',
      businessName: 'Cosmic Pizza',
      isAvailable: true,
      originalPrice: 15,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'
    },
    {
      id: '4',
      title: 'Premium Coffee Experience',
      description: 'Special coffee varieties and latte art',
      cost: 200,
      category: 'Premium',
      businessName: 'Stellar Coffee Co.',
      isAvailable: true,
      originalPrice: 50,
      image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400'
    },
  ];

  const recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'earn',
      amount: 50,
      tokenSymbol: 'COFFEE',
      businessName: 'Stellar Coffee Co.',
      description: 'Coffee purchase',
      timestamp: new Date(),
      status: 'completed'
    },
    {
      id: '2',
      type: 'redeem',
      amount: 100,
      tokenSymbol: 'COFFEE',
      businessName: 'Stellar Coffee Co.',
      description: 'Free coffee reward',
      timestamp: new Date(Date.now() - 3600000),
      status: 'completed'
    },
    {
      id: '3',
      type: 'earn',
      amount: 30,
      tokenSymbol: 'BOOKS',
      businessName: 'Galaxy Books',
      description: 'Book purchase',
      timestamp: new Date(Date.now() - 7200000),
      status: 'completed'
    },
  ];

  const categories = ['all', 'Beverage', 'Food', 'Discount', 'Premium'];  const handleEarnTokens = async (businessId: string) => {
    console.log('handleEarnTokens called, current walletAddress:', walletAddress, 'isConnected:', walletAddress ? 'yes' : 'no');
    
    // If wallet is already connected, proceed immediately
    if (walletAddress) {
      console.log('Wallet already connected, proceeding with token earning');
      try {
        console.log('Earning tokens from:', businessId);
        // QR code scanning or manual token earning logic
      } catch (error) {
        console.error('Token earning failed:', error);
      }
      return;
    }

    // Check wallet connection first
    console.log('Wallet not connected, showing modal');
    const isWalletConnected = await requireWalletWithModal();
    if (!isWalletConnected) {
      // Modal was shown, set pending action to execute after wallet connects
      console.log('Modal shown, setting pending action');
      setPendingAction('earnTokens');
      setPendingActionData(businessId);
      return;
    }

    // This shouldn't happen with current logic, but just in case
    try {
      console.log('Earning tokens from:', businessId);
      // QR code scanning or manual token earning logic
    } catch (error) {
      console.error('Token earning failed:', error);
    }
  };  const handleRedeemReward = async (rewardId: string) => {
    console.log('handleRedeemReward called, current walletAddress:', walletAddress, 'isConnected:', walletAddress ? 'yes' : 'no');
    
    // If wallet is already connected, proceed immediately
    if (walletAddress) {
      console.log('Wallet already connected, proceeding with reward redemption');
      try {
        console.log('Redeeming reward:', rewardId);
        // Reward redemption logic
      } catch (error) {
        console.error('Reward redemption failed:', error);
      }
      return;
    }

    // Check wallet connection first
    console.log('Wallet not connected, showing modal');
    const isWalletConnected = await requireWalletWithModal();
    if (!isWalletConnected) {
      // Modal was shown, set pending action to execute after wallet connects
      console.log('Modal shown, setting pending action');
      setPendingAction('redeemReward');
      setPendingActionData(rewardId);
      return;
    }

    // This shouldn't happen with current logic, but just in case
    try {
      console.log('Redeeming reward:', rewardId);
      // Reward redemption logic
    } catch (error) {
      console.error('Reward redemption failed:', error);
    }
  };

  const filteredRewards = rewardOptions.filter(reward => {
    const matchesSearch = reward.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reward.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalTokenValue = tokenBalances.reduce((sum, token) => sum + token.balance, 0);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="mb-6">
        <WalletConnection 
          publicKey={walletAddress} 
          onConnect={setWalletAddress} 
        />
      </div>

      {/* Token Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">            <div>
              <p className="text-blue-100">Total Tokens</p>
              <p className="text-3xl font-bold">{formatNumber(totalTokenValue)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">            <div>
              <p className="text-green-100">Available Rewards</p>
              <p className="text-3xl font-bold">{rewardOptions.filter(r => r.isAvailable).length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="flex items-center justify-between">            <div>
              <p className="text-orange-100">Active Businesses</p>
              <p className="text-3xl font-bold">{tokenBalances.length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">        <Button 
          onClick={async () => {
            console.log('QR Scanner clicked, current walletAddress:', walletAddress);
            
            // If wallet is already connected, open QR scanner immediately
            if (walletAddress) {
              console.log('Wallet already connected, opening QR scanner');
              setShowQRScanner(true);
              return;
            }
            
            // Check wallet connection first
            console.log('Wallet not connected, showing modal');
            const isWalletConnected = await requireWalletWithModal();
            if (!isWalletConnected) {
              // Modal was shown, set pending action to execute after wallet connects
              console.log('Modal shown, setting pending QR action');
              setPendingAction('scanQR');
              return;
            }
            
            // This shouldn't happen with current logic, but just in case
            setShowQRScanner(true);
          }}
          className="p-4 h-auto flex-col items-start text-left justify-start bg-gradient-to-r from-purple-600 to-blue-600"
        >
          <QrCode className="w-6 h-6 mb-2" />
          <div className="font-semibold">Scan QR Code</div>
          <div className="text-sm opacity-90 font-normal">Earn tokens by shopping</div>
        </Button>

        <Button 
          variant="outline"
          onClick={() => setSelectedTab('rewards')}
          className="p-4 h-auto flex-col items-start text-left justify-start"
        >
          <Gift className="w-6 h-6 mb-2" />
          <div className="font-semibold">View Rewards</div>
          <div className="text-sm opacity-90 font-normal">Use your tokens</div>
        </Button>

        <Button 
          variant="outline"
          onClick={() => setSelectedTab('tokens')}
          className="p-4 h-auto flex-col items-start text-left justify-start"
        >
          <Coins className="w-6 h-6 mb-2" />          <div className="font-semibold">Token Management</div>
          <div className="text-sm opacity-90 font-normal">View all your tokens</div>
        </Button>
      </div>

      {/* Featured Rewards */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Featured Rewards</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewardOptions.slice(0, 3).map((reward) => (
              <div key={reward.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                {reward.image && (
                  <img 
                    src={reward.image} 
                    alt={reward.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h4 className="font-semibold">{reward.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{reward.businessName}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary-600">{reward.cost} tokens</span>                  <Button size="sm" onClick={() => handleRedeemReward(reward.id)}>
                    Use
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {recentTransactions.slice(0, 3).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'earn' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {transaction.type === 'earn' ? 
                      <ArrowUpRight className="w-4 h-4 text-green-600" /> :
                      <Gift className="w-4 h-4 text-blue-600" />
                    }
                  </div>
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-gray-500">{transaction.businessName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    transaction.type === 'earn' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {transaction.type === 'earn' ? '+' : '-'}{transaction.amount} {transaction.tokenSymbol}
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(transaction.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>          <Button variant="outline" className="w-full mt-4" onClick={() => setSelectedTab('history')}>
            View All Transactions
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderTokens = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">My Token Balances</h2>
      <div className="grid gap-6">
        {tokenBalances.map((token, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">{token.tokenName}</h3>
                  <p className="text-gray-600 font-medium">{token.businessName}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-sm text-gray-500">Earn Rate: {token.earnRate}x per $1</p>
                    {token.businessLocation && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-500">{token.businessLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">
                  {formatNumber(token.balance)}
                </div>
                <div className="text-sm text-gray-500">{token.tokenSymbol}</div>
                <div className="mt-2">                  <Button size="sm" onClick={() => handleEarnTokens(token.tokenSymbol)}>
                    <Zap className="w-3 h-3 mr-1" />
                    Earn Tokens
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderRewards = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Available Rewards</h2>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"              placeholder="Search rewards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRewards.map((reward) => (
          <Card key={reward.id} className="overflow-hidden">
            {reward.image && (
              <img 
                src={reward.image} 
                alt={reward.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{reward.title}</h3>
                  {reward.discount && (                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                      {reward.discount}% Discount
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{reward.description}</p>
                <p className="text-sm text-primary-600 font-medium mt-1">{reward.businessName}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                    {reward.category}
                  </span>                  {reward.isAvailable && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      Available
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {reward.originalPrice && (
                    <div className="text-xs text-gray-500 line-through">
                      ₺{reward.originalPrice}
                    </div>
                  )}
                  <div className="font-bold text-primary-600">
                    {reward.cost} tokens
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => handleRedeemReward(reward.id)}
                disabled={!reward.isAvailable}
                className="w-full"              >
                {reward.isAvailable ? 'Use Now' : 'Not Available'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredRewards.length === 0 && (
        <Card className="p-8 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />          <h3 className="text-lg font-medium text-gray-600 mb-2">No Rewards Found</h3>
          <p className="text-gray-500">No rewards match your search criteria.</p>
        </Card>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Transaction History</h2>
      <Card>
        <div className="p-6">
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-4 border-b last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    transaction.type === 'earn' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {transaction.type === 'earn' ? 
                      <ArrowUpRight className="w-6 h-6 text-green-600" /> :
                      <Gift className="w-6 h-6 text-blue-600" />
                    }
                  </div>
                  <div>
                    <div className="font-medium text-lg">{transaction.description}</div>
                    <div className="text-sm text-gray-500">{transaction.businessName}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{formatDate(transaction.timestamp)}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-xl ${
                    transaction.type === 'earn' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                  </div>
                  <div className="text-sm text-gray-500">{transaction.tokenSymbol}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Panel</h1>
          <p className="text-gray-600">Manage your tokens, discover rewards and support local businesses</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'tokens', label: 'My Tokens', icon: Coins },
              { id: 'rewards', label: 'Rewards', icon: Gift },
              { id: 'history', label: 'History', icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as 'overview' | 'tokens' | 'rewards' | 'history')}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'tokens' && renderTokens()}
        {selectedTab === 'rewards' && renderRewards()}
        {selectedTab === 'history' && renderHistory()}

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 p-6">              <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
              <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center text-gray-500">
                  <QrCode className="w-16 h-16 mx-auto mb-2" />
                  <p>Camera view will be here</p>
                  <p className="text-sm">Point the camera at the business QR code</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowQRScanner(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setShowQRScanner(false)} className="flex-1">
                  Complete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
