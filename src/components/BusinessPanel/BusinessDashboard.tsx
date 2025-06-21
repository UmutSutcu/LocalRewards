import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Users, 
  TrendingUp, 
  Gift, 
  Plus, 
  Eye,
  Settings,
  BarChart3,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import WalletConnection from '@/components/Shared/WalletConnection';
import { useWalletRequired } from '@/hooks/useWalletRequired';
import { formatNumber, formatDate } from '@/utils';
import { StellarService } from '@/services/stellarService';

interface BusinessStats {
  totalTokensIssued: number;
  activeCustomers: number;
  tokensRedeemed: number;
  totalRevenue: number;
  conversionRate: number;
}

interface TokenData {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number;
  issued: number;
  redeemed: number;
  rate: number;
  description: string;
}

interface Transaction {
  id: string;
  type: 'issued' | 'redeemed';
  amount: number;
  customer: string;
  customerAddress: string;
  timestamp: Date;
  description: string;
}

const BusinessDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tokens' | 'customers' | 'analytics'>('overview');
  const [showCreateToken, setShowCreateToken] = useState(false);
  const [showDistributeTokens, setShowDistributeTokens] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'createToken' | 'distributeTokens' | null>(null);
  const [pendingActionData, setPendingActionData] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const { requireWalletWithModal, address } = useWalletRequired();

  // Auto-update wallet address and handle pending actions
  useEffect(() => {
    console.log('useEffect triggered - address:', address, 'pendingAction:', pendingAction);
    
    if (address) {
      setWalletAddress(address);
      console.log('Wallet address updated:', address);
      
      // Execute pending action if any
      if (pendingAction) {
        console.log('Executing pending action:', pendingAction, 'with data:', pendingActionData);
        
        switch (pendingAction) {
          case 'createToken':
            console.log('Executing pending token creation');
            setShowCreateToken(true);
            break;
          case 'distributeTokens':
            console.log('Executing pending token distribution');
            setShowDistributeTokens(true);
            break;
        }
        // Clear pending actions
        console.log('Clearing pending actions');
        setPendingAction(null);
        setPendingActionData(null);
      }
    }
  }, [address, pendingAction, pendingActionData]);  // Load transaction history when wallet is connected or on component mount
  useEffect(() => {
    const loadTransactionHistory = async () => {
      // Always show business wallet transactions, regardless of connected wallet
      const businessWalletAddress = 'GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK';
      
      console.log('Loading business transaction history for business wallet:', businessWalletAddress);
      setIsLoadingTransactions(true);
      try {
        const history = await StellarService.getTransactionHistory(businessWalletAddress, 15);
        console.log('Business transaction history received:', history);
        
        // Convert Stellar transactions to our Transaction format
        // For business wallet: 'received' = customer payment (issued tokens), 'sent' = business expense
        const convertedTransactions: Transaction[] = history.map((tx: any, index: number) => {
          const isPaymentReceived = tx.type === 'received';
          return {
            id: tx.id || `tx_${index}`,
            type: isPaymentReceived ? 'issued' : 'redeemed', 
            amount: tx.amount || 0,
            customer: isPaymentReceived ? 'Customer Payment' : 'Business Expense',
            customerAddress: isPaymentReceived ? tx.from : tx.to,
            timestamp: tx.timestamp || new Date(),
            description: tx.memo || `${tx.asset || 'XLM'} ${isPaymentReceived ? 'payment received' : 'transaction'}`
          };
        });

        console.log('Converted business transactions:', convertedTransactions);
        setTransactions(convertedTransactions);
      } catch (error) {
        console.error('Failed to load business transaction history:', error);
        // Fallback to mock data if real data fails
        setTransactions(recentTransactions);
      } finally {
        setIsLoadingTransactions(false);
      }
    };    // Load transactions on component mount
    loadTransactionHistory();
  }, []); // Removed walletAddress dependency to always load business wallet transactions

  // Refresh transaction history
  const refreshTransactionHistory = async () => {
    // Always refresh business wallet transactions
    const businessWalletAddress = 'GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK';
    
    console.log('Refreshing business transaction history for business wallet:', businessWalletAddress);
    setIsLoadingTransactions(true);
    try {
      const history = await StellarService.getTransactionHistory(businessWalletAddress, 15);
      console.log('Refreshed business transaction history:', history);
      
      // Convert Stellar transactions to our Transaction format
      // For business wallet: 'received' = customer payment (issued tokens), 'sent' = business expense
      const convertedTransactions: Transaction[] = history.map((tx: any, index: number) => {
        const isPaymentReceived = tx.type === 'received';
        return {
          id: tx.id || `tx_${index}`,
          type: isPaymentReceived ? 'issued' : 'redeemed', 
          amount: tx.amount || 0,
          customer: isPaymentReceived ? 'Customer Payment' : 'Business Expense',
          customerAddress: isPaymentReceived ? tx.from : tx.to,
          timestamp: tx.timestamp || new Date(),
          description: tx.memo || `${tx.asset || 'XLM'} ${isPaymentReceived ? 'payment received' : 'transaction'}`
        };
      });

      console.log('Updated business transactions:', convertedTransactions);
      setTransactions(convertedTransactions);
    } catch (error) {
      console.error('Failed to refresh business transaction history:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Mock data
  const businessStats: BusinessStats = {
    totalTokensIssued: 50000,
    activeCustomers: 1250,
    tokensRedeemed: 12500,
    totalRevenue: 75000,
    conversionRate: 3.2
  };

  const recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'issued',
      amount: 100,
      customer: 'John Doe',
      customerAddress: 'GDXXX...XXXX',
      timestamp: new Date(),
      description: 'Coffee purchase'
    },
    {
      id: '2', 
      type: 'redeemed',
      amount: 50,
      customer: 'Jane Smith',
      customerAddress: 'GCYYY...YYYY',
      timestamp: new Date(Date.now() - 3600000),
      description: 'Free coffee reward'
    }
  ];

  const tokens: TokenData[] = [
    {
      id: '1',
      name: 'Coffee Shop Rewards',
      symbol: 'COFFEE',
      totalSupply: 1000000,
      issued: 50000,
      redeemed: 12500,
      rate: 1,
      description: 'Coffee shop reward tokens'
    }
  ];  const handleCreateToken = async () => {
    console.log('handleCreateToken called, current walletAddress:', walletAddress, 'isConnected:', walletAddress ? 'yes' : 'no');
    
    // If wallet is already connected, proceed immediately
    if (walletAddress) {
      console.log('Wallet already connected, opening token creation dialog');
      setShowCreateToken(true);
      return;
    }
    
    // Check wallet connection first
    console.log('Wallet not connected, showing modal');
    const isWalletConnected = await requireWalletWithModal();
    if (!isWalletConnected) {
      // Modal was shown, set pending action to execute after wallet connects
      console.log('Modal shown, setting pending action');
      setPendingAction('createToken');
      return;
    }
    
    // This shouldn't happen with current logic, but just in case
    setShowCreateToken(true);
  };  const handleDistributeTokens = async (tokenIdOrEvent?: string | React.MouseEvent) => {
    const tokenId = typeof tokenIdOrEvent === 'string' ? tokenIdOrEvent : undefined;
    console.log('handleDistributeTokens called, current walletAddress:', walletAddress, 'isConnected:', walletAddress ? 'yes' : 'no');
    
    // If wallet is already connected, proceed immediately
    if (walletAddress) {
      console.log('Wallet already connected, opening token distribution dialog');
      setShowDistributeTokens(true);
      return;
    }
    
    // Check wallet connection first
    console.log('Wallet not connected, showing modal');
    const isWalletConnected = await requireWalletWithModal();
    if (!isWalletConnected) {
      // Modal was shown, set pending action to execute after wallet connects
      console.log('Modal shown, setting pending action');
      setPendingAction('distributeTokens');
      setPendingActionData(tokenId || null);
      return;
    }
    
    // This shouldn't happen with current logic, but just in case
    setShowDistributeTokens(true);
  };
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Wallet Connection - CustomerDashboard Style */}
      <div className="mb-6">
        <WalletConnection 
          publicKey={walletAddress} 
          onConnect={setWalletAddress} 
        />
      </div>      {/* Business Wallet Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Business Wallet (Receiving Payments)</h4>
              <p className="text-sm text-blue-700 font-mono">GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK</p>
              <p className="text-xs text-blue-600">Customer coffee purchases will be sent to this address</p>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <a
              href="https://testnet.steexp.com/account/GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-center"
            >
              View on Explorer
            </a>
            <button
              onClick={refreshTransactionHistory}
              disabled={isLoadingTransactions}
              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              {isLoadingTransactions ? 'Refreshing...' : 'Refresh History'}
            </button>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tokens</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(businessStats.totalTokensIssued)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Coins className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+12.5%</span>
            <span className="text-sm text-gray-500 ml-1">this month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(businessStats.activeCustomers)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+8.2%</span>
            <span className="text-sm text-gray-500 ml-1">this month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Redeemed Tokens</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(businessStats.tokensRedeemed)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+15.3%</span>
            <span className="text-sm text-gray-500 ml-1">this month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{businessStats.conversionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+2.1%</span>
            <span className="text-sm text-gray-500 ml-1">this month</span>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={handleCreateToken}
          className="p-4 h-auto flex-col items-start text-left justify-start"
        >
          <Plus className="w-6 h-6 mb-2" />
          <div className="font-semibold">Create New Token</div>
          <div className="text-sm opacity-90 font-normal">Create loyalty program tokens</div>
        </Button>

        <Button 
          variant="outline"
          onClick={handleDistributeTokens}
          className="p-4 h-auto flex-col items-start text-left justify-start"
        >
          <CreditCard className="w-6 h-6 mb-2" />
          <div className="font-semibold">Distribute Tokens</div>
          <div className="text-sm opacity-90 font-normal">Send tokens to customers</div>
        </Button>

        <Button 
          variant="outline"
          onClick={() => setSelectedTab('analytics')}
          className="p-4 h-auto flex-col items-start text-left justify-start"
        >
          <BarChart3 className="w-6 h-6 mb-2" />
          <div className="font-semibold">View Analytics</div>
          <div className="text-sm opacity-90 font-normal">Review detailed reports</div>
        </Button>
      </div>      {/* Recent Transactions */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshTransactionHistory}
              disabled={isLoadingTransactions}
            >
              {isLoadingTransactions ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          {isLoadingTransactions ? (
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>          ) : (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <h3 className="font-medium mb-2">No Transactions Yet</h3>
                  <p className="text-sm">
                    Customer payments to your business wallet will appear here.
                  </p>
                  <p className="text-xs mt-2">
                    Business Wallet: GBFHNS7...HMPDRLK
                  </p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'issued' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {transaction.type === 'issued' ? 
                        <ArrowUpRight className="w-5 h-5 text-green-600" /> :
                        <ArrowDownRight className="w-5 h-5 text-blue-600" />
                      }
                    </div>                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-gray-500">{transaction.customer}</div>
                      {transaction.customerAddress && (
                        <div className="text-xs text-gray-400 font-mono">
                          {transaction.customerAddress.substring(0, 8)}...{transaction.customerAddress.substring(transaction.customerAddress.length - 8)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      transaction.type === 'issued' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'issued' ? '💰 +' : '📤 -'}{transaction.amount} XLM
                    </div>
                    <div className="text-xs text-gray-500">
                      {transaction.type === 'issued' ? 'Payment Received' : 'Business Transaction'}
                    </div>
                    <div className="text-sm text-gray-500">{formatDate(transaction.timestamp)}</div>
                  </div>                </div>
              ))
              )}
            </div>)}
        </div>
      </Card>

      {/* Business Debug Panel */}
      <Card className="bg-gray-50 border-gray-200">
        <div className="p-4">
          <h4 className="font-medium text-gray-700 mb-3">🏢 Business Debug Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Connected Wallet:</span>
              <p className="font-mono text-xs text-gray-800 break-all">{walletAddress || 'Not Connected'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Business Receiving Wallet:</span>
              <p className="font-mono text-xs text-gray-800">GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Network:</span>
              <p className="text-gray-800">Stellar Testnet</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Transaction Count:</span>
              <p className="text-gray-800">{transactions.length} transactions loaded</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <span className="font-medium text-gray-600">Business Operations:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <a 
                href="https://testnet.steexp.com/account/GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              >
                View Business Account
              </a>
              {walletAddress && (
                <a 
                  href={`https://testnet.steexp.com/account/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                >
                  View Connected Wallet
                </a>
              )}
              <button
                onClick={refreshTransactionHistory}
                disabled={isLoadingTransactions}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
              >
                Force Refresh History
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <p>💡 Tips: Customer payments to the business wallet will show as "issued" transactions.</p>
              <p>📊 Transaction Type Mapping: Received = Issued Tokens | Sent = Redeemed/Business Expense</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTokens = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Token Management</h2>
        <Button onClick={handleCreateToken}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Token
        </Button>
      </div>

      <div className="grid gap-6">
        {tokens.map((token) => (
          <Card key={token.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{token.name}</h3>
                  <p className="text-gray-600">{token.symbol}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{token.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Supply</p>
                <p className="font-semibold">{formatNumber(token.totalSupply)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Issued</p>
                <p className="font-semibold">{formatNumber(token.issued)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Redeemed</p>
                <p className="font-semibold">{formatNumber(token.redeemed)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Earning Rate</p>
                <p className="font-semibold">{token.rate}x per $1</p>
              </div>
            </div>            <div className="mt-4 flex space-x-3">
              <Button onClick={() => handleDistributeTokens(token.id)} className="flex-1">
                Distribute Tokens
              </Button>
              <Button variant="outline" className="flex-1">
                Create Reward
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Customer Management</h2>
      <Card className="p-6">
        <p className="text-center text-gray-500">Customer management coming soon...</p>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Analytics</h2>
      <Card className="p-6">
        <p className="text-center text-gray-500">Detailed analytics coming soon...</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
          <p className="text-gray-600">Manage your loyalty program and track customer interactions</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'tokens', label: 'Token Management', icon: Coins },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as 'overview' | 'tokens' | 'customers' | 'analytics')}
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
        {selectedTab === 'customers' && renderCustomers()}
        {selectedTab === 'analytics' && renderAnalytics()}

        {/* Modals */}
        {showCreateToken && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Token</h3>
              <p className="text-gray-600 mb-4">Token creation form coming soon...</p>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowCreateToken(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateToken(false)} className="flex-1">
                  Create
                </Button>
              </div>
            </Card>
          </div>
        )}

        {showDistributeTokens && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold mb-4">Distribute Tokens</h3>
              <p className="text-gray-600 mb-4">Token distribution form coming soon...</p>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowDistributeTokens(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setShowDistributeTokens(false)} className="flex-1">
                  Send
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;
