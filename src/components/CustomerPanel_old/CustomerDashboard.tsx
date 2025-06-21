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
  Coffee
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
  const [pendingAction, setPendingAction] = useState<'earnTokens' | 'redeemReward' | 'scanQR' | 'buyCoffee' | 'buyCake' | null>(null);
  const [pendingActionData, setPendingActionData] = useState<string | null>(null);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);  const [tokenBalanceState, setTokenBalanceState] = useState<TokenBalance[]>([]);
  const [businessWalletStatus, setBusinessWalletStatus] = useState<{
    address: string;
    exists: boolean;
    balance: string;
    error?: string;
  } | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
  const [isLoadingCustomerTransactions, setIsLoadingCustomerTransactions] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState<Record<string, number>>({});
  const { requireWalletWithModal, address } = useWalletRequired();// Auto-update wallet address and handle pending actions
  useEffect(() => {
    console.log('useEffect triggered - address:', address, 'pendingAction:', pendingAction);
    
    if (address) {
      setWalletAddress(address);
      console.log('Wallet address updated:', address);
      
      // Execute pending action if any
      if (pendingAction) {
        console.log('Executing pending action:', pendingAction, 'with data:', pendingActionData);        switch (pendingAction) {
          case 'earnTokens':
            if (pendingActionData) {
              console.log('Executing pending token earning for:', pendingActionData);
              // Execute earn tokens logic here
            }
            break;
          case 'redeemReward':
            if (pendingActionData) {
              console.log('Executing pending reward redemption for:', pendingActionData);
              handleRedeemReward(pendingActionData);
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
          case 'buyCake':
            if (pendingActionData) {
              console.log('Executing pending cake purchase for:', pendingActionData);
              const cakeItem = cakeItems.find(item => item.id === pendingActionData);
              if (cakeItem) {
                handleCakePurchase(cakeItem);
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

  // Business configurations
  const businessConfigs = {
    coffee: {
      walletAddress: 'GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK',
      name: 'Stellar Coffee Co.',
      tokenSymbol: 'COFFEE',
      tokenName: 'Coffee Shop Rewards',
      location: 'Istanbul, Besiktas',
      earnRate: 1
    },
    cake: {
      walletAddress: 'GARQZZ4P6U4GQYE2IFMV3TCEIACVXOE4WNRRGJBEWGTM2EYHADTGAAZU',
      name: 'Stellar Cake House',
      tokenSymbol: 'CAKE',
      tokenName: 'Cake House Points',
      location: 'Istanbul, Taksim',
      earnRate: 1.5
    }
  };

  // Calculate loyalty points from transactions
  const calculateLoyaltyPointsFromTransactions = (transactions: Transaction[]) => {
    const points: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      if (transaction.type === 'earn') {
        const business = Object.values(businessConfigs).find(
          b => b.tokenSymbol === transaction.tokenSymbol
        );
        if (business) {
          const key = business.tokenSymbol;
          points[key] = (points[key] || 0) + transaction.amount;
        }
      } else if (transaction.type === 'redeem') {
        const business = Object.values(businessConfigs).find(
          b => b.tokenSymbol === transaction.tokenSymbol
        );
        if (business) {
          const key = business.tokenSymbol;
          points[key] = Math.max(0, (points[key] || 0) - transaction.amount);
        }
      }
    });
    
    return points;
  };
  // Dynamic token balances based on transactions
  const getTokenBalances = (): TokenBalance[] => {
    const calculatedPoints = calculateLoyaltyPointsFromTransactions(customerTransactions);
    
    return Object.values(businessConfigs).map(business => ({
      tokenSymbol: business.tokenSymbol,
      tokenName: business.tokenName,
      balance: calculatedPoints[business.tokenSymbol] || 0,
      businessName: business.name,
      earnRate: business.earnRate,
      businessLocation: business.location
    }));
  };
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
      title: 'Free Cake Slice',
      description: 'Delicious cake slice of your choice',
      cost: 80,
      category: 'Dessert',
      businessName: 'Stellar Cake House',
      isAvailable: true,
      originalPrice: 35,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'
    },
    {
      id: '3',
      title: '10% Coffee Discount',
      description: '10% discount on your next coffee purchase',
      cost: 50,
      category: 'Discount',
      businessName: 'Stellar Coffee Co.',
      isAvailable: true,
      discount: 10,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    },
    {
      id: '4',
      title: 'Premium Cake Experience',
      description: 'Special cake varieties with decorations',
      cost: 150,
      category: 'Premium',
      businessName: 'Stellar Cake House',
      isAvailable: true,
      originalPrice: 60,
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400'
    },
    {
      id: '5',
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
      type: 'earn',
      amount: 30,
      tokenSymbol: 'CAKE',
      businessName: 'Stellar Cake House',
      description: 'Cake purchase',
      timestamp: new Date(Date.now() - 1800000),
      status: 'completed'
    },
    {
      id: '3',
      type: 'redeem',
      amount: 100,
      tokenSymbol: 'COFFEE',
      businessName: 'Stellar Coffee Co.',
      description: 'Free coffee reward',
      timestamp: new Date(Date.now() - 3600000),
      status: 'completed'
    },
    {
      id: '4',
      type: 'earn',
      amount: 25,
      tokenSymbol: 'CAKE',
      businessName: 'Stellar Cake House',
      description: 'Red velvet cake',
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

  const cakeItems: CoffeeItem[] = [
    {
      id: '5',
      name: 'Chocolate Cake',
      price: 40,
      loyaltyPoints: 30,
      description: 'Rich and moist chocolate cake',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'
    },
    {
      id: '6',
      name: 'Cheesecake',
      price: 45,
      loyaltyPoints: 35,
      description: 'Creamy New York style cheesecake',
      image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400'
    },
    {
      id: '7',
      name: 'Red Velvet',
      price: 35,
      loyaltyPoints: 25,
      description: 'Classic red velvet with cream cheese frosting',
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400'
    },
    {
      id: '8',
      name: 'Tiramisu',
      price: 50,
      loyaltyPoints: 40,
      description: 'Italian coffee-flavored dessert',
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400'
    }
  ];

  const categories = ['all', 'Beverage', 'Dessert', 'Discount', 'Premium'];  const handleEarnTokens = async (businessId: string) => {
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
    
    if (!walletAddress) {
      console.log('Wallet not connected, showing modal');
      setPendingAction('redeemReward');
      setPendingActionData(rewardId);
      await requireWalletWithModal();
      return;
    }

    // Find the reward
    const reward = rewardOptions.find(r => r.id === rewardId);
    if (!reward) {
      setNotification({
        type: 'error',
        message: 'Reward not found'
      });
      return;
    }

    // Check if reward is available
    if (!reward.isAvailable) {
      setNotification({
        type: 'error',
        message: 'This reward is currently not available'
      });
      return;
    }

    // Find the business token symbol for this reward
    let requiredTokenSymbol = '';
    if (reward.businessName === 'Stellar Coffee Co.') {
      requiredTokenSymbol = 'COFFEE';
    } else if (reward.businessName === 'Stellar Cake House') {
      requiredTokenSymbol = 'CAKE';
    } else {
      setNotification({
        type: 'error',
        message: 'Business type not recognized for this reward'
      });
      return;
    }

    // Check if user has enough tokens
    const userBalance = loyaltyPoints[requiredTokenSymbol] || 0;
    if (userBalance < reward.cost) {
      setNotification({
        type: 'error',
        message: `Insufficient ${requiredTokenSymbol} tokens. You need ${reward.cost} but only have ${userBalance}.`
      });
      return;
    }

    // Confirm redemption
    const confirmRedemption = confirm(
      `Redeem "${reward.title}" for ${reward.cost} ${requiredTokenSymbol} tokens?\n\nYou currently have ${userBalance} ${requiredTokenSymbol} tokens.`
    );

    if (!confirmRedemption) {
      return;
    }

    console.log('Processing reward redemption:', reward);
    setIsProcessingPurchase(true);
    setProcessingStep('Processing reward redemption...');

    try {
      setNotification({
        type: 'info',
        message: 'Processing your reward redemption...'
      });      // Create a redemption transaction locally with 0.1x reward points
      const redemptionTransaction: Transaction = {
        id: `redeem_${Date.now()}`,
        type: 'redeem',
        amount: reward.cost,
        tokenSymbol: requiredTokenSymbol,
        businessName: reward.businessName,
        description: `Redeemed: ${reward.title}`,
        timestamp: new Date(),
        status: 'completed'
      };

      // Add redemption to transaction history
      setCustomerTransactions(prev => [redemptionTransaction, ...prev]);

      // Award 0.1x points for redemption (loyalty reward for using the system)
      const rewardPoints = Math.floor(reward.cost * 0.1);
      if (rewardPoints > 0) {
        const rewardPointsTransaction: Transaction = {
          id: `reward_${Date.now()}`,
          type: 'earn',
          amount: rewardPoints,
          tokenSymbol: requiredTokenSymbol,
          businessName: reward.businessName,
          description: `Loyalty reward points (${rewardPoints} ${requiredTokenSymbol} for redemption)`,
          timestamp: new Date(),
          status: 'completed'
        };
        
        setCustomerTransactions(prev => [rewardPointsTransaction, ...prev]);
      }

      // Generate a redemption code for the business
      const redemptionCode = `RDM-${Date.now().toString().slice(-6)}-${rewardId}`;      setNotification({
        type: 'success',
        message: `🎉 Reward redeemed successfully! Show this code to the business: ${redemptionCode}. ${rewardPoints > 0 ? `Earned ${rewardPoints} loyalty points as reward bonus!` : ''} Your ${requiredTokenSymbol} balance has been updated.`
      });

      console.log('Reward redemption completed successfully');
      console.log('Redemption code:', redemptionCode);

    } catch (error) {
      console.error('Reward redemption failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setNotification({
        type: 'error',
        message: `Reward redemption failed: ${errorMessage}`
      });
    } finally {
      setIsProcessingPurchase(false);
      setProcessingStep('');
    }  };

  // Handle loyalty points payment for items
  const handleLoyaltyPayment = async (item: CoffeeItem, businessType: 'coffee' | 'cake') => {
    console.log(`=== STARTING LOYALTY PAYMENT FOR ${businessType.toUpperCase()} ===`);
    
    if (!walletAddress) {
      console.log('Wallet not connected, showing modal');
      setPendingAction(businessType === 'coffee' ? 'buyCoffee' : 'buyCake');
      setPendingActionData(item.id);
      await requireWalletWithModal();
      return;
    }

    const requiredTokens = item.price * 10; // 1 XLM = 10 tokens
    const businessConfig = businessConfigs[businessType];
    const userBalance = loyaltyPoints[businessConfig.tokenSymbol] || 0;

    if (userBalance < requiredTokens) {
      setNotification({
        type: 'error',
        message: `Insufficient ${businessConfig.tokenSymbol} tokens. You need ${requiredTokens} but only have ${userBalance}.`
      });
      return;
    }

    // Confirm payment
    const confirmPayment = confirm(
      `Pay for "${item.name}" using ${requiredTokens} ${businessConfig.tokenSymbol} tokens?\n\nYou currently have ${userBalance} ${businessConfig.tokenSymbol} tokens.`
    );

    if (!confirmPayment) {
      return;
    }

    console.log('Processing loyalty payment:', item);
    setIsProcessingPurchase(true);
    setProcessingStep('Processing loyalty payment...');

    try {
      setNotification({
        type: 'info',
        message: 'Processing your loyalty payment...'
      });

      // Create a loyalty payment transaction
      const loyaltyPaymentTransaction: Transaction = {
        id: `loyalty_${Date.now()}`,
        type: 'redeem',
        amount: requiredTokens,
        tokenSymbol: businessConfig.tokenSymbol,
        businessName: businessConfig.name,
        description: `Loyalty payment: ${item.name}`,
        timestamp: new Date(),
        status: 'completed'
      };

      // Add to transaction history
      setCustomerTransactions(prev => [loyaltyPaymentTransaction, ...prev]);

      setNotification({
        type: 'success',
        message: `🎉 ${item.name} purchased with loyalty points! Your ${businessConfig.tokenSymbol} balance has been updated.`
      });

      console.log('Loyalty payment completed successfully');

    } catch (error) {
      console.error('Loyalty payment failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setNotification({
        type: 'error',
        message: `Loyalty payment failed: ${errorMessage}`
      });
    } finally {
      setIsProcessingPurchase(false);
      setProcessingStep('');
    }
  };
  
  // Initialize token balances and update when transactions change
  useEffect(() => {
    const tokenBalances = getTokenBalances();
    setTokenBalanceState(tokenBalances);
    
    // Update loyalty points state
    const calculatedPoints = calculateLoyaltyPointsFromTransactions(customerTransactions);
    setLoyaltyPoints(calculatedPoints);
  }, [customerTransactions]);  // Generic purchase handler for both coffee and cake
  const handleItemPurchase = async (item: CoffeeItem, businessType: 'coffee' | 'cake') => {
    console.log(`=== STARTING ${businessType.toUpperCase()} PURCHASE PROCESS ===`);
    console.log('handleItemPurchase called, current walletAddress:', walletAddress);
    console.log('Item:', item);
    console.log('Business type:', businessType);
    
    if (!walletAddress) {
      console.log('Wallet not connected, showing modal');
      setPendingAction(businessType === 'coffee' ? 'buyCoffee' : 'buyCake');
      setPendingActionData(item.id);
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
    }    setIsProcessingPurchase(true);
    setProcessingStep('Checking network...');
    
    try {
      // Check network connectivity first
      console.log('=== STEP 0: Network connectivity check ===');
      try {
        const networkCheck = await fetch('https://horizon-testnet.stellar.org/', {
          method: 'GET',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!networkCheck.ok) {
          throw new Error('Stellar network unavailable');
        }
        
        console.log('✓ Network connectivity confirmed');
      } catch (networkError) {
        console.error('❌ Network check failed:', networkError);
        throw new Error('Network connectivity issue. Please check your internet connection and try again.');
      }
        console.log('=== STEP 1: Getting business wallet ===');
      setProcessingStep('Getting business wallet...');
      
      const businessConfig = businessConfigs[businessType];
      const businessWallet = businessConfig.walletAddress;
      
      console.log('✓ Business wallet obtained:', businessWallet);
      console.log('Customer wallet:', walletAddress);
      console.log('Business wallet:', businessWallet);
      
      // Show initial processing notification
      setNotification({
        type: 'info',
        message: 'Creating transaction... Please wait.'
      });
        console.log('=== STEP 2: Creating transaction ===');
      setProcessingStep('Creating transaction...');
      console.log('About to call purchaseCoffeeAndEarnTokens with:');
      console.log('- Customer:', walletAddress);
      console.log('- Business:', businessWallet);
      console.log('- Price:', item.price);
      console.log('- Points:', item.loyaltyPoints);      // Create the transaction with improved timeout handling
      let result: any;
      try {
        console.log('⏱️ Setting 45-second timeout for transaction creation...');
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Transaction creation timed out after 45 seconds. This may be due to network congestion.'));
          }, 45000); // Increased to 45 seconds
        });
        
        // Race between transaction creation and timeout
        result = await Promise.race([
          StellarService.purchaseCoffeeAndEarnTokens(
            walletAddress,
            businessWallet,
            item.price,
            item.loyaltyPoints
          ),
          timeoutPromise
        ]) as any;
        
        console.log('✓ Transaction creation completed. Result:', result);
      } catch (transactionError) {
        console.error('❌ Transaction creation error:', transactionError);
        
        // Check if it's a timeout error
        if ((transactionError as Error).message.includes('timeout') || (transactionError as Error).message.includes('timed out')) {
          throw new Error('Transaction creation timed out. The Stellar network may be experiencing high traffic. Please try again in a few moments.');
        }
        
        // Check if it's a 504 Gateway Timeout
        if ((transactionError as Error).message.includes('504')) {
          throw new Error('Gateway timeout occurred. The Stellar network is temporarily overloaded. Please wait a moment and try again.');
        }
        
        throw new Error(`Transaction creation failed: ${(transactionError as Error).message}`);
      }

      if (!result.success) {
        throw new Error(result.message);
      }

      if (!result.transaction) {
        throw new Error('No transaction object returned');
      }      console.log('=== STEP 3: Signing and submitting transaction ===');
      setProcessingStep('Waiting for wallet signature...');
      
      // Update notification for signing
      setNotification({
        type: 'info',
        message: 'Transaction created. Please sign with your Freighter wallet...'
      });
        // Sign and submit the transaction with retry mechanism
      console.log('About to call signAndSubmitTransaction with:');
      console.log('- Transaction:', result.transaction);
      console.log('- Wallet address:', walletAddress);
      
      let submitResult: any;
      const maxRetries = 3;
      let currentAttempt = 1;
      
      while (currentAttempt <= maxRetries) {        try {
          console.log(`Transaction submission attempt ${currentAttempt}/${maxRetries}`);
          setProcessingStep(`Submitting transaction (attempt ${currentAttempt}/${maxRetries})...`);
          
          // Create timeout for transaction submission
          const submitPromise = StellarService.signAndSubmitTransaction(
            result.transaction,
            walletAddress
          );
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Transaction submission timeout after 60 seconds (attempt ${currentAttempt})`));
            }, 60000); // 60 second timeout
          });
          
          submitResult = await Promise.race([submitPromise, timeoutPromise]) as any;
          
          // If we get here, submission was successful
          console.log(`Transaction submission successful on attempt ${currentAttempt}`);
          break;
          
        } catch (submissionError) {
          console.error(`Transaction submission failed on attempt ${currentAttempt}:`, submissionError);
          
          if (currentAttempt === maxRetries) {
            // Last attempt failed, throw the error
            throw new Error(`Transaction submission failed after ${maxRetries} attempts: ${(submissionError as Error).message}`);
          }
          
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, currentAttempt) * 1000; // 2s, 4s, 8s
          console.log(`Waiting ${waitTime}ms before retry...`);
          
          setNotification({
            type: 'info',
            message: `Transaction submission failed (attempt ${currentAttempt}/${maxRetries}). Retrying in ${waitTime/1000} seconds...`
          });
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
          currentAttempt++;
        }
      }
      
      console.log('=== STEP 4: Processing submission result ===');
      console.log('Transaction submission result:', submitResult);

      if (submitResult.success) {
        console.log('=== SUCCESS: Transaction completed ===');
        
        // Add transaction to local state immediately for better UX
        const newTransaction: Transaction = {
          id: `local_${Date.now()}`,
          type: 'earn',
          amount: item.loyaltyPoints,
          tokenSymbol: businessConfig.tokenSymbol,
          businessName: businessConfig.name,
          description: `${item.name} purchase`,
          timestamp: new Date(),
          status: 'completed'
        };
        
        setCustomerTransactions(prev => [newTransaction, ...prev]);

        // Show success notification with transaction link
        setNotification({
          type: 'success',
          message: `${item.name} purchased successfully! Earned ${item.loyaltyPoints} ${businessConfig.tokenSymbol} tokens. Transaction hash: ${submitResult.transactionHash}`
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
      console.error(`=== ERROR: ${businessType} purchase failed ===`);
      console.error('Error details:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error message:', errorMessage);
      
      // Provide user-friendly error messages based on error type
      let userMessage = errorMessage;
      
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        userMessage = `Transaction timed out. The Stellar network may be busy. Please try again in a few moments.`;
      } else if (errorMessage.includes('504') || errorMessage.includes('Gateway')) {
        userMessage = `Network gateway timeout. The Stellar servers are temporarily overloaded. Please wait 30 seconds and try again.`;
      } else if (errorMessage.includes('Network connectivity')) {
        userMessage = `Network connection issue. Please check your internet connection and try again.`;
      } else if (errorMessage.includes('insufficient')) {
        userMessage = `Insufficient funds. Please ensure your wallet has enough XLM for the transaction.`;
      } else if (errorMessage.includes('User declined')) {
        userMessage = `Transaction was cancelled. Please try again if you want to complete the purchase.`;
      } else if (errorMessage.includes('not found') || errorMessage.includes('account')) {
        userMessage = `Account not found. Please ensure your wallet is properly funded and try again.`;
      }
      
      setNotification({
        type: 'error',
        message: `${item.name} purchase failed: ${userMessage}`
      });    } finally {
      console.log(`=== ${businessType.toUpperCase()} PURCHASE PROCESS COMPLETED ===`);
      setIsProcessingPurchase(false);
      setProcessingStep('');
    }
  };

  // Coffee purchase handler (backward compatibility)
  const handleCoffeePurchase = async (coffeeItem: CoffeeItem) => {
    await handleItemPurchase(coffeeItem, 'coffee');
  };

  // Cake purchase handler
  const handleCakePurchase = async (cakeItem: CoffeeItem) => {
    await handleItemPurchase(cakeItem, 'cake');
  };  // Helper function to detect business from transaction
  const detectBusinessFromTransaction = (tx: any, walletAddress: string) => {
    let businessType = 'external';
    let tokenSymbol = 'XLM';
    let businessName = 'External';
    let loyaltyPoints = 0;
    
    // Check if transaction is from our wallet to a business wallet
    const isOutgoingPayment = tx.from === walletAddress || tx.source_account === walletAddress;
    
    if (isOutgoingPayment) {
      const coffeeWallet = businessConfigs.coffee.walletAddress;
      const cakeWallet = businessConfigs.cake.walletAddress;
      
      // Check destination address (multiple possible fields)
      const destination = tx.to || tx.destination || tx.account || tx.destination_account;
      
      if (destination === coffeeWallet) {
        businessType = 'coffee';
        tokenSymbol = 'COFFEE';
        businessName = businessConfigs.coffee.name;
        loyaltyPoints = Math.floor((tx.amount || 0) * businessConfigs.coffee.earnRate);
      } else if (destination === cakeWallet) {
        businessType = 'cake';
        tokenSymbol = 'CAKE';
        businessName = businessConfigs.cake.name;
        loyaltyPoints = Math.floor((tx.amount || 0) * businessConfigs.cake.earnRate);
      }
      
      // Enhanced fallback: Check memo for business hints
      if (businessType === 'external' && tx.memo) {
        const memo = tx.memo.toLowerCase();
        
        // Coffee-related keywords
        const coffeeKeywords = ['coffee', 'espresso', 'latte', 'cappuccino', 'americano', 'mocha', 'macchiato', 'brew', 'cafee', 'stellar coffee'];
        if (coffeeKeywords.some(keyword => memo.includes(keyword))) {
          businessType = 'coffee';
          tokenSymbol = 'COFFEE';
          businessName = businessConfigs.coffee.name;
          loyaltyPoints = Math.floor((tx.amount || 0) * businessConfigs.coffee.earnRate);
        }
        
        // Cake-related keywords
        const cakeKeywords = ['cake', 'chocolate', 'cheesecake', 'tiramisu', 'velvet', 'bakery', 'dessert', 'pastry', 'stellar cake'];
        if (cakeKeywords.some(keyword => memo.includes(keyword))) {
          businessType = 'cake';
          tokenSymbol = 'CAKE';
          businessName = businessConfigs.cake.name;
          loyaltyPoints = Math.floor((tx.amount || 0) * businessConfigs.cake.earnRate);
        }
      }
    }
    
    return {
      businessType,
      tokenSymbol,
      businessName,
      loyaltyPoints,
      isBusinessTransaction: businessType !== 'external'
    };
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
        const convertedTransactions: Transaction[] = history.map((tx: any, index: number) => {
          // Use helper function to detect business
          const businessInfo = detectBusinessFromTransaction(tx, walletAddress);
          
          let description = '';
          if (businessInfo.isBusinessTransaction) {
            // Create a descriptive message for business transactions
            const xlmAmount = tx.amount || 0;
            description = `Purchase (${xlmAmount} XLM → ${businessInfo.loyaltyPoints} ${businessInfo.tokenSymbol})`;
            
            // Add item details if available in memo
            if (tx.memo && !tx.memo.toLowerCase().includes('purchase')) {
              description = `${tx.memo} (${xlmAmount} XLM → ${businessInfo.loyaltyPoints} ${businessInfo.tokenSymbol})`;
            }
          } else {
            description = tx.memo || `${tx.asset || 'XLM'} transaction`;
          }
          
          return {
            id: tx.id || `tx_${index}`,
            type: businessInfo.isBusinessTransaction ? 'earn' : 'transfer',
            amount: businessInfo.isBusinessTransaction ? businessInfo.loyaltyPoints : (tx.amount || 0),
            tokenSymbol: businessInfo.tokenSymbol,
            businessName: businessInfo.businessName,
            description: description,
            timestamp: tx.timestamp || new Date(),
            status: 'completed' as const
          };
        });

        console.log('Converted transactions with business detection:', convertedTransactions);
        setCustomerTransactions(convertedTransactions);
        
        // Calculate and display loyalty points summary
        const loyaltyPointsSummary = calculateLoyaltyPointsFromTransactions(convertedTransactions);
        console.log('Calculated loyalty points:', loyaltyPointsSummary);
        
        setNotification({
          type: 'info',
          message: `Transaction history updated. Found ${convertedTransactions.length} transactions. Loyalty: ${loyaltyPointsSummary.COFFEE || 0} COFFEE, ${loyaltyPointsSummary.CAKE || 0} CAKE tokens.`
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

  const totalTokenValue = Object.values(loyaltyPoints).reduce((sum, points) => sum + points, 0);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="mb-6">
        <WalletConnection 
          publicKey={walletAddress} 
          onConnect={setWalletAddress} 
        />
      </div>      {/* Token Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Tokens</p>
              <p className="text-3xl font-bold">{formatNumber(totalTokenValue)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Available Rewards</p>
              <p className="text-3xl font-bold">{rewardOptions.filter(r => r.isAvailable).length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Active Businesses</p>
              <p className="text-3xl font-bold">{tokenBalanceState.length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Token Balances */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Your Token Portfolio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coffee Tokens */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <Coffee className="w-8 h-8 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-gray-800">Coffee Rewards</h4>
                  <p className="text-sm text-gray-600">Stellar Coffee Co.</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-3xl font-bold text-amber-600">
                      {loyaltyPoints.COFFEE || 0}
                    </span>
                    <span className="text-sm text-gray-500">COFFEE tokens</span>
                  </div>
                  <div className="mt-2">
                    {(loyaltyPoints.COFFEE || 0) >= 100 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        ✨ Ready for free coffee!
                      </span>
                    ) : (loyaltyPoints.COFFEE || 0) >= 50 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        🎯 {100 - (loyaltyPoints.COFFEE || 0)} more for free coffee
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        📈 Buy coffee to earn tokens
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cake Tokens */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🍰</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-gray-800">Cake Points</h4>
                  <p className="text-sm text-gray-600">Stellar Cake House</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-3xl font-bold text-pink-600">
                      {loyaltyPoints.CAKE || 0}
                    </span>
                    <span className="text-sm text-gray-500">CAKE tokens</span>
                  </div>
                  <div className="mt-2">
                    {(loyaltyPoints.CAKE || 0) >= 80 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        ✨ Ready for free cake!
                      </span>
                    ) : (loyaltyPoints.CAKE || 0) >= 40 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        🎯 {80 - (loyaltyPoints.CAKE || 0)} more for free cake
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        📈 Buy cake to earn tokens
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={() => setSelectedTab('shop')}
          className="p-4 h-auto flex-col items-start text-left justify-start bg-gradient-to-r from-amber-500 to-pink-600"
        >
          <div className="flex items-center mb-2">
            <Coffee className="w-5 h-5 mr-1" />
            <span className="text-lg">🍰</span>
          </div>
          <div className="font-semibold">Coffee & Cake Shop</div>
          <div className="text-sm opacity-90 font-normal">Buy items, earn loyalty tokens</div>
        </Button>

        <Button 
          variant="outline"
          onClick={() => setSelectedTab('rewards')}
          className="p-4 h-auto flex-col items-start text-left justify-start"
        >
          <Gift className="w-6 h-6 mb-2" />
          <div className="font-semibold">Redeem Rewards</div>
          <div className="text-sm opacity-90 font-normal">Use your tokens for rewards</div>
        </Button>

        <Button 
          variant="outline"
          onClick={() => setSelectedTab('tokens')}
          className="p-4 h-auto flex-col items-start text-left justify-start"
        >
          <Coins className="w-6 h-6 mb-2" />
          <div className="font-semibold">Token Management</div>
          <div className="text-sm opacity-90 font-normal">View all your tokens</div>
        </Button>
      </div>{/* Featured Rewards */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Featured Rewards</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedTab('rewards')}
            >
              View All
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewardOptions.slice(0, 3).map((reward) => {
              // Determine required token type and user balance
              let requiredTokenSymbol = '';
              let userBalance = 0;
              
              if (reward.businessName === 'Stellar Coffee Co.') {
                requiredTokenSymbol = 'COFFEE';
                userBalance = loyaltyPoints.COFFEE || 0;
              } else if (reward.businessName === 'Stellar Cake House') {
                requiredTokenSymbol = 'CAKE';
                userBalance = loyaltyPoints.CAKE || 0;
              }
              
              const canAfford = userBalance >= reward.cost;
              
              return (
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-primary-600">
                      {reward.cost} {requiredTokenSymbol}
                    </span>
                    <span className={`text-sm ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                      You have {userBalance}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleRedeemReward(reward.id)}
                    disabled={!canAfford}
                    className="w-full"
                  >
                    {canAfford ? 'Redeem' : 'Need More Tokens'}
                  </Button>
                </div>
              );
            })}
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
              type="text"
              placeholder="Search rewards..."
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

      {/* Token Balance Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">Your Token Balances</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 bg-white rounded-lg p-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Coffee className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Coffee Tokens</div>
                <div className="text-2xl font-bold text-amber-600">
                  {loyaltyPoints.COFFEE || 0} COFFEE
                </div>
                <div className="text-xs text-gray-500">Stellar Coffee Co.</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 bg-white rounded-lg p-4">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-pink-600 text-xl">🍰</span>
              </div>
              <div>
                <div className="text-sm text-gray-600">Cake Tokens</div>
                <div className="text-2xl font-bold text-pink-600">
                  {loyaltyPoints.CAKE || 0} CAKE
                </div>
                <div className="text-xs text-gray-500">Stellar Cake House</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRewards.map((reward) => {
          // Determine required token type and user balance
          let requiredTokenSymbol = '';
          let userBalance = 0;
          
          if (reward.businessName === 'Stellar Coffee Co.') {
            requiredTokenSymbol = 'COFFEE';
            userBalance = loyaltyPoints.COFFEE || 0;
          } else if (reward.businessName === 'Stellar Cake House') {
            requiredTokenSymbol = 'CAKE';
            userBalance = loyaltyPoints.CAKE || 0;
          }
          
          const canAfford = userBalance >= reward.cost;
          
          return (
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
                    {reward.discount && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
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
                    </span>
                    {reward.isAvailable && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        Available
                      </span>
                    )}
                    {!canAfford && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                        Insufficient Tokens
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
                      {reward.cost} {requiredTokenSymbol}
                    </div>
                  </div>
                </div>

                {/* Token Balance Info */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Your {requiredTokenSymbol} balance:</span>
                    <span className={`font-semibold ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                      {userBalance} tokens
                    </span>
                  </div>
                  {!canAfford && userBalance > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      Need {reward.cost - userBalance} more tokens
                    </div>
                  )}
                  {userBalance === 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Buy from {reward.businessName} to earn tokens
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => handleRedeemReward(reward.id)}
                  disabled={!reward.isAvailable || !canAfford || isProcessingPurchase}
                  className="w-full"
                >
                  {!reward.isAvailable ? 'Not Available' :
                   !canAfford ? 'Insufficient Tokens' :
                   isProcessingPurchase ? 'Processing...' : 'Redeem Now'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredRewards.length === 0 && (
        <Card className="p-8 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Rewards Found</h3>
          <p className="text-gray-500">No rewards match your search criteria.</p>
        </Card>
      )}

      {/* Quick Actions to Earn More Tokens */}
      <Card className="bg-gradient-to-r from-amber-50 to-pink-50 border-amber-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Need More Tokens?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => setSelectedTab('shop')}
              variant="outline"
              className="flex items-center justify-center space-x-2 p-4"
            >
              <Coffee className="w-5 h-5 text-amber-600" />
              <span>Buy Coffee & Earn COFFEE Tokens</span>
            </Button>
            
            <Button 
              onClick={() => setSelectedTab('shop')}
              variant="outline"
              className="flex items-center justify-center space-x-2 p-4"
            >
              <span className="text-xl">🍰</span>
              <span>Buy Cake & Earn CAKE Tokens</span>
            </Button>
          </div>
        </div>
      </Card>
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
        <h2 className="text-2xl font-semibold">☕🍰 Coffee & Cake Shop</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Earn <span className="font-semibold text-amber-600">COFFEE</span> & <span className="font-semibold text-pink-600">CAKE</span> tokens with every purchase!
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
          </div>        </Card>
      )}

      {/* Helpful Tips for Slow Transactions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex items-center mb-2">
            <span className="text-blue-600 mr-2">💡</span>
            <h4 className="font-medium text-blue-800">Transaction Tips</h4>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• If transactions are slow, the Stellar network may be experiencing high traffic</p>
            <p>• Wait 30-60 seconds between retry attempts</p>
            <p>• Check your internet connection if you see timeout errors</p>
            <p>• Gateway timeout (504) errors usually resolve themselves - try again later</p>
          </div>
        </div>
      </Card>      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="text-sm text-gray-600">
                  Earn loyalty points
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-2">
                <Button 
                  onClick={() => handleCoffeePurchase(coffee)}
                  disabled={isProcessingPurchase}
                  className="w-full"
                >
                  {isProcessingPurchase ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {processingStep || 'Processing...'}
                    </div>
                  ) : (
                    <>Pay with XLM</>
                  )}
                </Button>

                {/* Loyalty Points Payment Option */}
                {(loyaltyPoints.COFFEE || 0) >= coffee.price * 10 && (
                  <Button 
                    variant="outline"
                    onClick={() => handleLoyaltyPayment(coffee, 'coffee')}
                    disabled={isProcessingPurchase}
                    className="w-full border-amber-500 text-amber-600 hover:bg-amber-50"
                  >
                    Pay with {coffee.price * 10} COFFEE tokens
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>      {/* Cake Items Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-pink-700">🍰 Stellar Cake House</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cakeItems.map((cake) => (
            <Card key={cake.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {cake.image && (
                <img 
                  src={cake.image} 
                  alt={cake.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">{cake.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{cake.description}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-2xl font-bold text-gray-900">{cake.price} XLM</div>
                  <div className="text-sm text-gray-600">
                    Earn loyalty points
                  </div>
                </div>

                {/* Payment Options */}
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleCakePurchase(cake)}
                    disabled={isProcessingPurchase}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                  >
                    {isProcessingPurchase ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {processingStep || 'Processing...'}
                      </div>
                    ) : (
                      <>Pay with XLM</>
                    )}
                  </Button>

                  {/* Loyalty Points Payment Option */}
                  {(loyaltyPoints.CAKE || 0) >= cake.price * 10 && (
                    <Button 
                      variant="outline"
                      onClick={() => handleLoyaltyPayment(cake, 'cake')}
                      disabled={isProcessingPurchase}
                      className="w-full border-pink-500 text-pink-600 hover:bg-pink-50"
                    >
                      Pay with {cake.price * 10} CAKE tokens
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
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
            </div>            <div className="flex items-center text-amber-800">
              <Trophy className="w-4 h-4 mr-2" />
              1 XLM = 1 COFFEE token
            </div>          </div>
        </div>
      </Card>

      {/* Cake House Info */}
      <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🍰</span>
            <div>
              <h3 className="text-xl font-semibold text-pink-900">Stellar Cake House</h3>
              <p className="text-pink-700">Delicious cakes made with love on the blockchain</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-pink-800">
              <MapPin className="w-4 h-4 mr-2" />
              Istanbul, Taksim
            </div>
            <div className="flex items-center text-pink-800">
              <Zap className="w-4 h-4 mr-2" />
              Instant loyalty rewards
            </div>
            <div className="flex items-center text-pink-800">
              <Trophy className="w-4 h-4 mr-2" />
              1.5x CAKE tokens per XLM
            </div>
          </div>
        </div>
      </Card>{/* Debug Panel - Development Only */}
      {walletAddress && (
        <Card className="bg-gray-50 border-gray-200">
          <div className="p-4">
            <h4 className="font-medium text-gray-700 mb-3">🔧 Debug Information</h4>            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Customer Wallet:</span>
                <p className="font-mono text-xs text-gray-800 break-all">{walletAddress}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Coffee Business:</span>
                <p className="font-mono text-xs text-gray-800">GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Cake Business:</span>
                <p className="font-mono text-xs text-gray-800">GARQZZ4P6U4GQYE2IFMV3TCEIACVXOE4WNRRGJBEWGTM2EYHADTGAAZU</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Network:</span>
                <p className="text-gray-800">Stellar Testnet</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Freighter Status:</span>                <p className={`font-medium ${StellarService.isFreighterInstalled() ? 'text-green-600' : 'text-red-600'}`}>
                  {StellarService.isFreighterInstalled() ? 'Available' : 'Not Available'}
                </p>
              </div>              <div>
                <span className="font-medium text-gray-600">Loyalty Points:</span>
                <p className="text-gray-800">
                  COFFEE: {loyaltyPoints.COFFEE || 0}, CAKE: {loyaltyPoints.CAKE || 0}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Business Detection:</span>
                <p className="text-gray-800">
                  {customerTransactions.filter(tx => tx.tokenSymbol === 'COFFEE').length} coffee transactions, 
                  {customerTransactions.filter(tx => tx.tokenSymbol === 'CAKE').length} cake transactions
                </p>
              </div>
            </div>
            
            {/* Debug Actions */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 mb-3">
                <button 
                  onClick={async () => {
                    try {
                      setNotification({ type: 'info', message: 'Testing network connectivity...' });
                      
                      const startTime = Date.now();
                      const response = await fetch('https://horizon-testnet.stellar.org/', {
                        method: 'GET',
                        signal: AbortSignal.timeout(10000)
                      });
                      const endTime = Date.now();
                      const responseTime = endTime - startTime;
                      
                      if (response.ok) {
                        setNotification({ 
                          type: 'success', 
                          message: `Network OK - Response time: ${responseTime}ms` 
                        });
                      } else {
                        setNotification({ 
                          type: 'error', 
                          message: `Network issue - Status: ${response.status}` 
                        });
                      }
                    } catch (error) {
                      setNotification({ 
                        type: 'error', 
                        message: `Network test failed: ${(error as Error).message}` 
                      });
                    }
                  }}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                >                  Test Network
                </button>

                <button 
                  onClick={async () => {
                    try {
                      setNotification({ type: 'info', message: 'Testing business detection...' });
                      
                      // Test with mock transactions
                      const mockTransactions = [
                        {
                          id: 'test1',
                          to: businessConfigs.coffee.walletAddress,
                          amount: 25,
                          memo: 'Cappuccino purchase',
                          timestamp: new Date()
                        },
                        {
                          id: 'test2',
                          to: businessConfigs.cake.walletAddress,
                          amount: 40,
                          memo: 'Chocolate cake purchase',
                          timestamp: new Date()
                        }
                      ];
                      
                      let detectedBusinesses = 0;
                      let totalLoyalty = { COFFEE: 0, CAKE: 0 };
                      
                      mockTransactions.forEach(tx => {
                        if (tx.to === businessConfigs.coffee.walletAddress) {
                          detectedBusinesses++;
                          totalLoyalty.COFFEE += tx.amount;
                        } else if (tx.to === businessConfigs.cake.walletAddress) {
                          detectedBusinesses++;
                          totalLoyalty.CAKE += Math.floor(tx.amount * businessConfigs.cake.earnRate);
                        }
                      });
                      
                      setNotification({ 
                        type: 'success', 
                        message: `Business detection test: ${detectedBusinesses} businesses detected. Loyalty: ${totalLoyalty.COFFEE} COFFEE, ${totalLoyalty.CAKE} CAKE` 
                      });
                      
                    } catch (error) {
                      setNotification({ 
                        type: 'error', 
                        message: `Business detection test failed: ${(error as Error).message}` 
                      });
                    }
                  }}
                  className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                >
                  Test Business Detection
                </button>

                <button
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
