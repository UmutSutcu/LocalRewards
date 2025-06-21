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
  Zap,
  Coffee,
  ShoppingCart
} from 'lucide-react';
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import WalletConnection from '@/components/Shared/WalletConnection';
import { formatNumber, formatDate } from '@/utils';
import { useWalletRequired } from '@/hooks/useWalletRequired';
import { StellarService } from '@/services/stellarService';

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

interface CoffeeItem {
  id: string;
  name: string;
  price: number;
  loyaltyPoints: number;
  description: string;
  image?: string;
}

const CustomerDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tokens' | 'rewards' | 'history' | 'shop'>('overview');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pendingAction, setPendingAction] = useState<'earnTokens' | 'redeemReward' | 'scanQR' | 'buyCoffee' | null>(null);
  const [pendingActionData, setPendingActionData] = useState<string | null>(null);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [tokenBalanceState, setTokenBalanceState] = useState<TokenBalance[]>([]);
  const [businessWalletStatus, setBusinessWalletStatus] = useState<{
    address: string;
    exists: boolean;
    balance: string;
    error?: string;
  } | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
  const [isLoadingCustomerTransactions, setIsLoadingCustomerTransactions] = useState(false);
  const { requireWalletWithModal, address } = useWalletRequired();// Auto-update wallet address and handle pending actions
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
          case 'buyCoffee':
            if (pendingActionData) {
              console.log('Executing pending coffee purchase for:', pendingActionData);
              const coffeeItem = coffeeItems.find(item => item.id === pendingActionData);
              if (coffeeItem) {
                handleCoffeePurchase(coffeeItem);
              }
            }
            break;
        }
        // Clear pending actions
        console.log('Clearing pending actions');
        setPendingAction(null);
        setPendingActionData(null);
      }
    }  }, [address, pendingAction, pendingActionData]);
  // Auto-clear notifications after 10 seconds for success, 15 seconds for errors
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, notification.type === 'error' ? 15000 : 10000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Check business wallet status on component mount
  useEffect(() => {
    const checkBusinessWallet = async () => {
      try {
        const status = await StellarService.testBusinessWallet();
        setBusinessWalletStatus(status);
      } catch (error) {
        console.error('Failed to check business wallet:', error);
      }
    };

    checkBusinessWallet();
  }, []);

  // Refresh business wallet status
  const refreshBusinessWallet = async () => {
    try {
      const status = await StellarService.testBusinessWallet();
      setBusinessWalletStatus(status);
      
      setNotification({
        type: 'info',
        message: `Business wallet refreshed. Status: ${status.exists ? 'Active' : 'Not Found'}`
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to refresh business wallet status'
      });
    }
  };

  // Fund business wallet
  const fundBusinessWallet = async () => {
    try {
      const result = await StellarService.fundBusinessWalletIfNeeded();
      
      setNotification({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      // Refresh status after funding attempt
      if (result.success) {
        setTimeout(() => {
          refreshBusinessWallet();        }, 2000);
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to fund business wallet'
      });
    }
  };

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

  const coffeeItems: CoffeeItem[] = [
    {
      id: '1',
      name: 'Espresso',
      price: 15,
      loyaltyPoints: 10,
      description: 'Strong and rich espresso shot',
      image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400'
    },
    {
      id: '2',
      name: 'Cappuccino',
      price: 25,
      loyaltyPoints: 20,
      description: 'Creamy cappuccino with steamed milk',
      image: 'https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=400'
    },
    {
      id: '3',
      name: 'Latte',
      price: 30,
      loyaltyPoints: 25,
      description: 'Smooth latte with milk foam art',
      image: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400'
    },
    {
      id: '4',
      name: 'Americano',
      price: 20,
      loyaltyPoints: 15,
      description: 'Bold americano with hot water',
      image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=400'
    }
  ];

  const categories = ['all', 'Beverage', 'Food', 'Discount', 'Premium'];  const handleEarnTokens = async (businessId: string) => {
    console.log('handleEarnTokens called, current walletAddress:', walletAddress, 'isConnected:', walletAddress ? 'yes' : 'no');
    
    // If wallet is already connected, proceed immediately
    if (walletAddress) {
      console.log('Wallet already connected, proceeding with token earning');
      try {
        console.log('Earning tokens from:', businessId);
        // Execute earn tokens logic here
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
      // Execute earn tokens logic here
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

  // Initialize token balances
  useEffect(() => {
    setTokenBalanceState(tokenBalances);
  }, []);  // Coffee purchase handler
  const handleCoffeePurchase = async (coffeeItem: CoffeeItem) => {
    console.log('=== STARTING COFFEE PURCHASE PROCESS ===');
    console.log('handleCoffeePurchase called, current walletAddress:', walletAddress);
    console.log('Coffee item:', coffeeItem);
    
    if (!walletAddress) {
      console.log('Wallet not connected, showing modal');
      setPendingAction('buyCoffee');
      setPendingActionData(coffeeItem.id);
      await requireWalletWithModal();
      return;    }

    // Check if Freighter wallet is available
    const freighterInfo = await StellarService.getFreighterInfo();
    console.log('Freighter info:', freighterInfo);
    
    if (!freighterInfo.isAvailable) {
      setNotification({
        type: 'error',
        message: freighterInfo.message
      });
      return;
    }setIsProcessingPurchase(true);
    
    try {
      console.log('=== STEP 1: Getting business wallet ===');
      console.log('About to call StellarService.getBusinessWalletAddress()...');
      
      // Get a valid business wallet address
      let businessWallet;
      try {
        businessWallet = await StellarService.getBusinessWalletAddress();
        console.log('✓ Business wallet obtained successfully:', businessWallet);
      } catch (businessWalletError) {
        console.error('❌ Business wallet error:', businessWalletError);
        throw new Error(`Business wallet error: ${(businessWalletError as Error).message}`);
      }
      
      console.log('Customer wallet:', walletAddress);
      console.log('Business wallet:', businessWallet);
      
      // Show initial processing notification
      setNotification({
        type: 'info',
        message: 'Creating transaction... Please wait.'
      });
      
      console.log('=== STEP 2: Creating transaction ===');
      console.log('About to call purchaseCoffeeAndEarnTokens with:');
      console.log('- Customer:', walletAddress);
      console.log('- Business:', businessWallet);
      console.log('- Price:', coffeeItem.price);
      console.log('- Points:', coffeeItem.loyaltyPoints);
        // Create the transaction
      let result;
      try {
        console.log('⏱️ Setting 30-second timeout for transaction creation...');
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Transaction creation timed out after 30 seconds'));
          }, 30000);
        });
        
        // Race between transaction creation and timeout
        result = await Promise.race([
          StellarService.purchaseCoffeeAndEarnTokens(
            walletAddress,
            businessWallet,
            coffeeItem.price,
            coffeeItem.loyaltyPoints
          ),
          timeoutPromise
        ]) as any;
        
        console.log('✓ Transaction creation completed. Result:', result);
      } catch (transactionError) {
        console.error('❌ Transaction creation error:', transactionError);
        throw new Error(`Transaction creation failed: ${(transactionError as Error).message}`);
      }

      if (!result.success) {
        throw new Error(result.message);
      }

      if (!result.transaction) {
        throw new Error('No transaction object returned');
      }

      console.log('=== STEP 3: Signing and submitting transaction ===');
      
      // Update notification for signing
      setNotification({
        type: 'info',
        message: 'Transaction created. Please sign with your Freighter wallet...'
      });
      
      // Sign and submit the transaction
      console.log('About to call signAndSubmitTransaction with:');
      console.log('- Transaction:', result.transaction);
      console.log('- Wallet address:', walletAddress);
      
      const submitResult = await StellarService.signAndSubmitTransaction(
        result.transaction,
        walletAddress
      );
      
      console.log('=== STEP 4: Processing submission result ===');
      console.log('Transaction submission result:', submitResult);

      if (submitResult.success) {
        console.log('=== SUCCESS: Transaction completed ===');
        
        // Update local token balance immediately for better UX
        setTokenBalanceState(prev => 
          prev.map(token => 
            token.tokenSymbol === 'COFFEE' 
              ? { ...token, balance: token.balance + coffeeItem.loyaltyPoints }
              : token
          )
        );

        // Show success notification with transaction link
        setNotification({
          type: 'success',
          message: `Coffee purchased successfully! Earned ${coffeeItem.loyaltyPoints} COFFEE tokens. Transaction hash: ${submitResult.transactionHash}`
        });
            
        console.log('Transaction submitted successfully. Hash:', submitResult.transactionHash);
        console.log('Waiting for transaction to be processed on the network...');
        
        // Refresh transaction history with improved retry mechanism
        const refreshWithRetry = async (attempt = 1, maxAttempts = 5) => {
          console.log(`Attempting to refresh transaction history (attempt ${attempt}/${maxAttempts})`);
          
          try {
            await refreshCustomerTransactionHistory();
            
            // Give some time for the transaction to propagate
            setTimeout(() => {
              console.log('Transaction should now be visible in blockchain explorers');
              setNotification({
                type: 'success',
                message: `Transaction confirmed! View on explorer: https://testnet.steexp.com/tx/${submitResult.transactionHash}`
              });
            }, 3000);
            
          } catch (refreshError) {
            console.error('Failed to refresh transaction history:', refreshError);
            
            if (attempt < maxAttempts) {
              console.log(`Retrying transaction history refresh in ${5 * attempt} seconds...`);
              setTimeout(() => refreshWithRetry(attempt + 1, maxAttempts), 5000 * attempt);
            } else {
              console.log('Maximum retry attempts reached for transaction history refresh');
            }
          }
        };
        
        // Start the retry mechanism after 5 seconds
        setTimeout(() => refreshWithRetry(), 5000);
        
      } else {
        console.error('=== ERROR: Transaction submission failed ===');
        console.error('Error message:', submitResult.message);
        setNotification({
          type: 'error',
          message: `Transaction failed: ${submitResult.message}`
        });
      }
      
    } catch (error) {
      console.error('=== ERROR: Coffee purchase failed ===');
      console.error('Error details:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error message:', errorMessage);
      
      setNotification({
        type: 'error',
        message: `Coffee purchase failed: ${errorMessage}`
      });
    } finally {
      console.log('=== COFFEE PURCHASE PROCESS COMPLETED ===');
      setIsProcessingPurchase(false);
    }
  };
  // Refresh customer transaction history
  const refreshCustomerTransactionHistory = async () => {
    if (walletAddress) {
      console.log('Starting transaction history refresh for wallet:', walletAddress);
      setIsLoadingCustomerTransactions(true);
      try {
        const history = await StellarService.getTransactionHistory(walletAddress, 15);
        console.log('Received transaction history:', history);
        
        // Convert Stellar transactions to our Transaction format
        const convertedTransactions: Transaction[] = history.map((tx: any, index: number) => ({
          id: tx.id || `tx_${index}`,
          type: tx.type === 'sent' ? 'earn' : 'transfer',
          amount: tx.amount || 0,
          tokenSymbol: tx.asset || 'XLM',
          businessName: tx.type === 'sent' ? 'Stellar Coffee Co.' : 'External',
          description: tx.memo || `${tx.asset || 'XLM'} transaction`,
          timestamp: tx.timestamp || new Date(),
          status: 'completed' as const
        }));

        console.log('Converted transactions:', convertedTransactions);
        setCustomerTransactions(convertedTransactions);
        
        setNotification({
          type: 'info',
          message: `Transaction history updated. Found ${convertedTransactions.length} transactions.`
        });
      } catch (error) {
        console.error('Failed to refresh transaction history:', error);
        setNotification({
          type: 'error',
          message: 'Failed to refresh transaction history. Using fallback data.'
        });
        // Fallback to existing mock data
        setCustomerTransactions(recentTransactions);
      } finally {
        setIsLoadingCustomerTransactions(false);
      }
    } else {
      console.log('No wallet address available for transaction history refresh');
    }
  };

  // Load transaction history when wallet connects
  useEffect(() => {
    if (walletAddress) {
      refreshCustomerTransactionHistory();
    }
  }, [walletAddress]);

  const filteredRewards = rewardOptions.filter(reward => {
    const matchesSearch = reward.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reward.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalTokenValue = tokenBalanceState.reduce((sum, token) => sum + token.balance, 0);

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
              <p className="text-3xl font-bold">{tokenBalanceState.length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={() => setSelectedTab('shop')}
          className="p-4 h-auto flex-col items-start text-left justify-start bg-gradient-to-r from-amber-500 to-orange-600"
        >
          <Coffee className="w-6 h-6 mb-2" />
          <div className="font-semibold">Coffee Shop</div>
          <div className="text-sm opacity-90 font-normal">Buy coffee, earn tokens</div>
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
        {tokenBalanceState.map((token, index) => (
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Transaction History</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshCustomerTransactionHistory}
          disabled={isLoadingCustomerTransactions}
        >
          {isLoadingCustomerTransactions ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      <Card>
        <div className="p-6">
          {isLoadingCustomerTransactions ? (
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {customerTransactions.map((transaction) => (
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
                  }`}>                    {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                  </div>
                  <div className="text-sm text-gray-500">{transaction.tokenSymbol}</div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderCoffeeShop = () => (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="mb-6">
        <WalletConnection 
          publicKey={walletAddress} 
          onConnect={setWalletAddress} 
        />
      </div>      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">☕ Coffee Shop</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Earn <span className="font-semibold text-amber-600">COFFEE tokens</span> with every purchase!
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshCustomerTransactionHistory}
            disabled={isLoadingCustomerTransactions}
          >
            {isLoadingCustomerTransactions ? 'Refreshing...' : 'Refresh History'}
          </Button>
        </div>
      </div>

      {/* Freighter Wallet Status */}
      {!StellarService.isFreighterInstalled() && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600">⚠️</span>
            </div>
            <div>
              <h4 className="font-medium text-yellow-800">Freighter Wallet Required</h4>
              <p className="text-sm text-yellow-700">
                To make purchases, please install the Freighter browser extension from{' '}
                <a 
                  href="https://freighter.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  freighter.app
                </a>
              </p>
            </div>
          </div>        </Card>
      )}

      {/* Business Wallet Status */}
      {businessWalletStatus && (
        <Card className={`p-4 ${
          businessWalletStatus.exists 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              businessWalletStatus.exists 
                ? 'bg-green-100' 
                : 'bg-red-100'
            }`}>
              <span className={businessWalletStatus.exists ? 'text-green-600' : 'text-red-600'}>
                {businessWalletStatus.exists ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex-1">
              <h4 className={`font-medium ${
                businessWalletStatus.exists ? 'text-green-800' : 'text-red-800'
              }`}>
                Business Wallet Status
              </h4>
              <p className={`text-sm font-mono ${
                businessWalletStatus.exists ? 'text-green-700' : 'text-red-700'
              }`}>
                {businessWalletStatus.address}
              </p>
              {businessWalletStatus.exists ? (
                <p className="text-sm text-green-600">
                  Balance: {parseFloat(businessWalletStatus.balance).toFixed(2)} XLM
                </p>
              ) : (
                <p className="text-sm text-red-600">
                  {businessWalletStatus.error || 'Wallet not found or not funded'}
                </p>
              )}            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={refreshBusinessWallet}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Refresh
              </button>
              {!businessWalletStatus.exists && (
                <button
                  onClick={fundBusinessWallet}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Fund Wallet
                </button>
              )}
              <a
                href={`https://friendbot.stellar.org/?addr=${businessWalletStatus.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-center"
              >
                Manual Fund
              </a>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {coffeeItems.map((coffee) => (
          <Card key={coffee.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {coffee.image && (
              <img 
                src={coffee.image} 
                alt={coffee.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">{coffee.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{coffee.description}</p>
              
              <div className="flex justify-between items-center mb-4">
                <div className="text-2xl font-bold text-gray-900">{coffee.price} XLM</div>
                <div className="flex items-center text-amber-600">
                  <Trophy className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">+{coffee.loyaltyPoints} COFFEE</span>
                </div>
              </div>

              <Button 
                onClick={() => handleCoffeePurchase(coffee)}
                disabled={isProcessingPurchase}
                className="w-full"
              >
                {isProcessingPurchase ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Now
                  </div>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Coffee Shop Info */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Coffee className="w-8 h-8 text-amber-600 mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-amber-900">Stellar Coffee Co.</h3>
              <p className="text-amber-700">Premium coffee experience on the blockchain</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-amber-800">
              <MapPin className="w-4 h-4 mr-2" />
              Istanbul, Besiktas
            </div>
            <div className="flex items-center text-amber-800">
              <Zap className="w-4 h-4 mr-2" />
              Instant loyalty rewards
            </div>
            <div className="flex items-center text-amber-800">
              <Trophy className="w-4 h-4 mr-2" />
              1 XLM = 1 COFFEE token
            </div>          </div>
        </div>
      </Card>      {/* Debug Panel - Development Only */}
      {walletAddress && (
        <Card className="bg-gray-50 border-gray-200">
          <div className="p-4">
            <h4 className="font-medium text-gray-700 mb-3">🔧 Debug Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Customer Wallet:</span>
                <p className="font-mono text-xs text-gray-800 break-all">{walletAddress}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Business Wallet:</span>
                <p className="font-mono text-xs text-gray-800">GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Network:</span>
                <p className="text-gray-800">Stellar Testnet</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Freighter Status:</span>                <p className={`font-medium ${StellarService.isFreighterInstalled() ? 'text-green-600' : 'text-red-600'}`}>
                  {StellarService.isFreighterInstalled() ? 'Available' : 'Not Available'}
                </p>
              </div>
            </div>
            
            {/* Debug Actions */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 mb-3">                <button 
                  onClick={async () => {
                    try {
                      setNotification({ type: 'info', message: 'Testing detailed Freighter connection...' });
                      
                      console.log('=== DETAILED FREIGHTER TEST ===');
                      
                      // Step 1: Check if Freighter API exists
                      console.log('Step 1: Checking Freighter API...');
                      if (!(window as any).freighterApi) {
                        throw new Error('Freighter API not found');
                      }
                      console.log('✓ Freighter API exists');
                      
                      // Step 2: Test getPublicKey
                      console.log('Step 2: Getting public key...');
                      const connectedKey = await (window as any).freighterApi.getPublicKey();
                      console.log('✓ Connected key:', connectedKey);
                      
                      // Step 3: Test network details
                      console.log('Step 3: Getting network details...');
                      const networkDetails = await (window as any).freighterApi.getNetworkDetails();
                      console.log('✓ Network details:', networkDetails);
                        // Step 4: Test if we can create a simple transaction
                      console.log('Step 4: Testing account loading...');
                      const accountExists = await StellarService.checkAccountExists(connectedKey);
                      console.log('✓ Account exists:', accountExists);
                      
                      setNotification({ 
                        type: 'success', 
                        message: `Freighter test successful! Connected: ${connectedKey}, Network: ${networkDetails.network}` 
                      });
                      
                    } catch (error) {
                      console.error('=== FREIGHTER TEST FAILED ===');
                      console.error('Error:', error);
                      setNotification({ 
                        type: 'error', 
                        message: `Freighter test failed: ${(error as Error).message}` 
                      });
                    }
                  }}
                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                >
                  Detailed Freighter Test
                </button>
                
                <button 
                  onClick={async () => {
                    try {
                      setNotification({ type: 'info', message: 'Testing connection to Freighter...' });
                      const connectedKey = await (window as any).freighterApi.getPublicKey();
                      setNotification({ 
                        type: 'success', 
                        message: `Freighter connected: ${connectedKey}` 
                      });
                    } catch (error) {
                      setNotification({ 
                        type: 'error', 
                        message: `Freighter test failed: ${(error as Error).message}` 
                      });
                    }
                  }}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                  Test Freighter
                </button>
                
                <button 
                  onClick={async () => {
                    try {
                      setNotification({ type: 'info', message: 'Checking account balances...' });
                      const balance = await StellarService.getAccountBalance(walletAddress);
                      const businessBalance = await StellarService.getAccountBalance('GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK');
                      setNotification({ 
                        type: 'success', 
                        message: `Customer: ${balance} XLM, Business: ${businessBalance} XLM` 
                      });
                    } catch (error) {
                      setNotification({ 
                        type: 'error', 
                        message: `Balance check failed: ${(error as Error).message}` 
                      });
                    }
                  }}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                >
                  Check Balances
                </button>
                
                <button 
                  onClick={async () => {
                    try {
                      setNotification({ type: 'info', message: 'Testing transaction creation...' });
                      const result = await StellarService.purchaseCoffeeAndEarnTokens(
                        walletAddress,
                        'GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK',
                        1, // 1 XLM test transaction
                        5  // 5 loyalty points
                      );
                      setNotification({ 
                        type: result.success ? 'success' : 'error', 
                        message: `Transaction test: ${result.message}` 
                      });
                    } catch (error) {
                      setNotification({ 
                        type: 'error', 
                        message: `Transaction test failed: ${(error as Error).message}` 
                      });
                    }
                  }}
                  className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
                >
                  Test Transaction
                </button>
              </div>                <button 
                  onClick={async () => {
                    try {
                      setNotification({ type: 'info', message: 'Running comprehensive Freighter test...' });
                      
                      // Run the new debug method
                      await StellarService.debugFreighterState();
                      
                      // Also get user-friendly status
                      const freighterInfo = await StellarService.getFreighterInfo();
                      console.log('Freighter Info:', freighterInfo);
                      
                      setNotification({ 
                        type: freighterInfo.isAvailable ? 'success' : 'error', 
                        message: freighterInfo.message 
                      });
                    } catch (error) {
                      console.error('Freighter test failed:', error);
                      setNotification({ type: 'error', message: 'Test failed: ' + (error as Error).message });
                    }
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  🔍 Test Freighter
                </button>
              
              <span className="font-medium text-gray-600">Quick Links:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <a 
                  href={`https://testnet.steexp.com/account/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                  View Customer Account
                </a>
                <a 
                  href="https://testnet.steexp.com/account/GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                >
                  View Business Account
                </a>
                <a 
                  href={`https://friendbot.stellar.org/?addr=${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
                >
                  Fund Customer Wallet
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Panel</h1>
          <p className="text-gray-600">Manage your tokens, discover rewards and support local businesses</p>
        </div>        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-400 text-green-700' 
              : notification.type === 'error'
              ? 'bg-red-50 border-red-400 text-red-700'
              : 'bg-blue-50 border-blue-400 text-blue-700'
          }`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  {notification.type === 'success' && <span className="mr-2">✅</span>}
                  {notification.type === 'error' && <span className="mr-2">❌</span>}
                  {notification.type === 'info' && <span className="mr-2">ℹ️</span>}
                  <span className="font-medium">
                    {notification.type === 'success' && 'Success'}
                    {notification.type === 'error' && 'Error'}
                    {notification.type === 'info' && 'Info'}
                  </span>
                </div>
                <p className="text-sm break-words">{notification.message}</p>
                {notification.message.includes('testnet.steexp.com') && (
                  <div className="mt-2">
                    <a 
                      href={notification.message.match(/https:\/\/testnet\.steexp\.com\/[^\s]+/)?.[0] || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline font-medium hover:no-underline"
                    >
                      View on Stellar Explorer →
                    </a>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="ml-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
                title="Close notification"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'shop', label: 'Coffee Shop', icon: Coffee },
              { id: 'tokens', label: 'My Tokens', icon: Coins },
              { id: 'rewards', label: 'Rewards', icon: Gift },
              { id: 'history', label: 'History', icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as 'overview' | 'shop' | 'tokens' | 'rewards' | 'history')}
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
        {selectedTab === 'shop' && renderCoffeeShop()}

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
