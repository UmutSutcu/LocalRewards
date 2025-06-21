import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Users, 
  TrendingUp, 
  Plus, 
  BarChart3,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import WalletConnection from '@/components/Shared/WalletConnection';
import { useWalletRequired } from '@/hooks/useWalletRequired';
import { formatDate } from '@/utils';
import { StellarService } from '@/services/stellarService';

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
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'createToken' | null>(null);
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
        }
        // Clear pending actions
        console.log('Clearing pending actions');
        setPendingAction(null);
        setPendingActionData(null);
      }
    }
  }, [address, pendingAction, pendingActionData]);  // Load transaction history when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      loadTransactionHistory();
    }
  }, [walletAddress]);

  const loadTransactionHistory = async () => {
    if (!walletAddress) {
      console.log('No wallet connected, skipping transaction history load');
      return;
    }

    console.log('Loading transaction history for connected wallet:', walletAddress);
    setIsLoadingTransactions(true);
    try {
      const history = await StellarService.getTransactionHistory(walletAddress, 15);
      console.log('Transaction history received for wallet:', walletAddress, history);
      
      // Convert Stellar transactions to our Transaction format
      // For business: analyze transactions to determine if they're customer payments or business expenses
      const convertedTransactions: Transaction[] = history.map((tx: any, index: number) => {
        const isIncomingPayment = tx.type === 'received' || tx.type === 'payment_received';
        const isOutgoingPayment = tx.type === 'sent' || tx.type === 'payment_sent';
        
        let transactionType: 'issued' | 'redeemed' = 'issued';
        let customer = 'Unknown';
        let description = tx.memo || `${tx.asset || 'XLM'} transaction`;
        
        if (isIncomingPayment) {
          // Incoming payment = customer purchase = tokens issued
          transactionType = 'issued';
          customer = 'Customer Payment';
          description = tx.memo || `Payment received (${tx.amount} XLM)`;
        } else if (isOutgoingPayment) {
          // Outgoing payment = business expense or token redemption
          transactionType = 'redeemed';
          customer = 'Business Transaction';
          description = tx.memo || `Business payment (${tx.amount} XLM)`;
        }
        
        return {
          id: tx.id || `tx_${index}`,
          type: transactionType,
          amount: tx.amount || 0,
          customer: customer,
          customerAddress: isIncomingPayment ? tx.from : tx.to,
          timestamp: tx.timestamp || new Date(),
          description: description
        };
      });

      console.log('Converted transactions for wallet:', walletAddress, convertedTransactions);
      setTransactions(convertedTransactions);
    } catch (error) {
      console.error('Failed to load transaction history for wallet:', walletAddress, error);
      // Clear transactions on error
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Refresh transaction history
  const refreshTransactionHistory = async () => {
    if (!walletAddress) {
      console.log('No wallet connected, cannot refresh transaction history');
      return;
    }
    await loadTransactionHistory();  };

  const handleCreateToken = async () => {
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
    setShowCreateToken(true);  };
  
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Wallet Connection - CustomerDashboard Style */}
      <div className="mb-6">
        <WalletConnection 
          publicKey={walletAddress} 
          onConnect={setWalletAddress} 
        />
      </div>      {/* Business Wallet Info - Dynamic based on connected wallet */}
      {walletAddress ? (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-900">Connected Business Wallet</h4>
                <p className="text-sm text-green-700 font-mono">{walletAddress}</p>
                <p className="text-xs text-green-600">Viewing transactions for this connected wallet</p>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <a
                href={`https://testnet.steexp.com/account/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-center"
              >
                View on Explorer
              </a>
              <button
                onClick={refreshTransactionHistory}
                disabled={isLoadingTransactions}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                {isLoadingTransactions ? 'Refreshing...' : 'Refresh History'}
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-medium text-yellow-900">Connect Your Business Wallet</h4>
              <p className="text-sm text-yellow-700">Connect your wallet to view business transactions and manage tokens</p>
              <p className="text-xs text-yellow-600">Your transaction history will appear once connected</p>
            </div>
          </div>
        </Card>      )}

      {/* Recent Transactions */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            {walletAddress && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshTransactionHistory}
                disabled={isLoadingTransactions}
              >
                {isLoadingTransactions ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
          </div>
          
          {!walletAddress ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👛</div>
              <h3 className="font-medium mb-2">Connect Your Wallet</h3>
              <p className="text-sm">
                Connect your business wallet to view transaction history and manage your loyalty program.
              </p>
              <div className="mt-4">
                <Button onClick={async () => await requireWalletWithModal()}>
                  Connect Wallet
                </Button>
              </div>
            </div>
          ) : isLoadingTransactions ? (
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <h3 className="font-medium mb-2">No Transactions Yet</h3>
                  <p className="text-sm">
                    Transactions for your connected wallet will appear here.
                  </p>
                  <p className="text-xs mt-2 font-mono">
                    Connected Wallet: {walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 8)}
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
                      </div>
                      <div>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>      {/* Business Debug Panel */}
      <Card className="bg-gray-50 border-gray-200">
        <div className="p-4">
          <h4 className="font-medium text-gray-700 mb-3">🏢 Business Debug Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Connected Wallet:</span>
              <p className="font-mono text-xs text-gray-800 break-all">{walletAddress || 'Not Connected'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Connection Status:</span>
              <p className={`text-xs ${walletAddress ? 'text-green-600' : 'text-red-600'}`}>
                {walletAddress ? '✅ Connected & Active' : '❌ Not Connected'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Network:</span>
              <p className="text-gray-800">Stellar Testnet</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Transaction Count:</span>
              <p className="text-gray-800">
                {walletAddress ? `${transactions.length} transactions loaded` : 'Connect wallet to view'}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <span className="font-medium text-gray-600">Business Operations:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {walletAddress ? (
                <>
                  <a 
                    href={`https://testnet.steexp.com/account/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                  >
                    View Connected Wallet
                  </a>
                  <button
                    onClick={refreshTransactionHistory}
                    disabled={isLoadingTransactions}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                  >
                    Force Refresh History
                  </button>
                </>
              ) : (
                <button
                  onClick={async () => await requireWalletWithModal()}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                  Connect Wallet
                </button>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <p>💡 Tips: Transaction history is specific to your connected wallet.</p>
              <p>📊 Transaction Types: Received = Issued Tokens | Sent = Business Payments</p>
              {!walletAddress && <p>🔗 Connect your business wallet to view real-time transaction data.</p>}
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
        <Button onClick={handleCreateToken} disabled>
          <Plus className="w-4 h-4 mr-2" />
          Create New Token
        </Button>
      </div>

      <Card className="p-8 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Token Management</h3>
          <p className="text-gray-600 mb-6">
            Advanced token creation, distribution, and management features are coming soon...
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 text-left">
          <h4 className="font-medium text-gray-900 mb-3">🚀 Planned Features:</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Create custom loyalty tokens with unique properties
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Distribute tokens to customers automatically or manually
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Set up reward programs and redemption rules
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Monitor token supply, circulation, and redemption rates
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Configure earning rates and bonus multipliers
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500">
            💡 Meanwhile, you can track customer transactions and loyalty points in the 
            <span className="font-medium"> Overview</span> tab.
          </p>
        </div>
      </Card>
    </div>
  );
  const renderCustomers = () => {
    // Extract unique customer addresses from transactions
    const customerAddresses = transactions
      .filter(tx => tx.type === 'issued' && tx.customerAddress) // Only incoming payments (customer purchases)
      .reduce((acc, tx) => {
        const address = tx.customerAddress;
        if (!acc[address]) {
          acc[address] = {
            address,
            totalPurchases: 0,
            totalAmount: 0,
            lastPurchase: tx.timestamp,
            transactions: []
          };
        }
        acc[address].totalPurchases += 1;
        acc[address].totalAmount += tx.amount;
        acc[address].transactions.push(tx);
        // Keep the most recent purchase date
        if (tx.timestamp > acc[address].lastPurchase) {
          acc[address].lastPurchase = tx.timestamp;
        }
        return acc;
      }, {} as Record<string, {
        address: string;
        totalPurchases: number;
        totalAmount: number;
        lastPurchase: Date;
        transactions: Transaction[];
      }>);

    const customerList = Object.values(customerAddresses).sort((a, b) => 
      b.lastPurchase.getTime() - a.lastPurchase.getTime()
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Customer Management</h2>
          <div className="text-sm text-gray-600">
            {walletAddress ? `${customerList.length} customers found` : 'Connect wallet to view customers'}
          </div>
        </div>

        {!walletAddress ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-2">👥</div>
            <h3 className="font-medium mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Connect your business wallet to view customer information and purchase history.
            </p>
            <Button onClick={async () => await requireWalletWithModal()}>
              Connect Wallet
            </Button>
          </Card>
        ) : customerList.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="font-medium mb-2">No Customers Yet</h3>
            <p className="text-sm text-gray-600">
              Customer purchases will appear here once they make payments to your connected wallet.
            </p>
            <p className="text-xs mt-2 font-mono text-gray-500">
              Connected Wallet: {walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 8)}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Customer Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Customers</p>
                    <p className="text-2xl font-bold text-blue-600">{customerList.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Purchases</p>
                    <p className="text-2xl font-bold text-green-600">
                      {customerList.reduce((sum, customer) => sum + customer.totalPurchases, 0)}
                    </p>
                  </div>
                  <ArrowUpRight className="w-8 h-8 text-green-600" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {customerList.reduce((sum, customer) => sum + customer.totalAmount, 0).toFixed(2)} XLM
                    </p>
                  </div>
                  <Coins className="w-8 h-8 text-purple-600" />
                </div>
              </Card>
            </div>

            {/* Customer List */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Customer List</h3>
                <div className="space-y-4">
                  {customerList.map((customer, index) => (
                    <div key={customer.address} className="flex items-center justify-between py-4 border-b last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-mono text-sm font-medium">
                            {customer.address.substring(0, 12)}...{customer.address.substring(customer.address.length - 12)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Customer ID: {customer.address.substring(0, 8)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Last purchase: {formatDate(customer.lastPurchase)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {customer.totalAmount.toFixed(2)} XLM
                        </div>
                        <div className="text-sm text-gray-600">
                          {customer.totalPurchases} purchase{customer.totalPurchases !== 1 ? 's' : ''}
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <a
                            href={`https://testnet.steexp.com/account/${customer.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            View Wallet
                          </a>
                          <button
                            onClick={() => {
                              console.log('Customer transactions:', customer.transactions);
                              alert(`Customer: ${customer.address}\nTotal Purchases: ${customer.totalPurchases}\nTotal Amount: ${customer.totalAmount.toFixed(2)} XLM`);
                            }}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Refresh Button */}
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={refreshTransactionHistory}
                disabled={isLoadingTransactions}
                className="px-6"
              >
                {isLoadingTransactions ? 'Refreshing...' : 'Refresh Customer Data'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

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
          </div>        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;
