import * as StellarSdk from '@stellar/stellar-sdk';
import freighterApi from '@stellar/freighter-api';

// Extract needed classes from StellarSdk
const { 
  Networks, 
  TransactionBuilder, 
  Operation, 
  Asset, 
  Memo,
  BASE_FEE
} = StellarSdk;

// Types for Stellar API responses
interface StellarBalance {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

// Stellar Horizon server (Testnet)
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

// Testnet configuration
export const STELLAR_CONFIG = {
  networkPassphrase: Networks.TESTNET,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  friendbotUrl: 'https://friendbot.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
};

// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  TOKEN_CONTRACT: 'CCONTRACT_ADDRESS_PLACEHOLDER',
  LOYALTY_CONTRACT: 'CCONTRACT_ADDRESS_PLACEHOLDER',
  DONATION_CONTRACT: 'CCONTRACT_ADDRESS_PLACEHOLDER',
};

class StellarService {
  private server: StellarSdk.Horizon.Server;

  constructor() {
    this.server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
  }

  /**
   * Create and fund a testnet account for business use
   */
  static async createTestnetAccount(): Promise<{ publicKey: string; secretKey: string }> {
    try {
      // Generate a new keypair
      const keypair = StellarSdk.Keypair.random();
      
      // Fund the account using friendbot
      await fetch(`${STELLAR_CONFIG.friendbotUrl}?addr=${keypair.publicKey()}`);
      
      return {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret()
      };
    } catch (error) {
      console.error('Error creating testnet account:', error);
      throw error;
    }
  }  /**
   * Get a funded business wallet address for demo purposes
   */
  static async getBusinessWalletAddress(): Promise<string> {
    console.log('🔍 getBusinessWalletAddress called');
    
    // Use the specific business wallet address provided by user
    const BUSINESS_WALLET = 'GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK';
    console.log('🔍 Checking business wallet:', BUSINESS_WALLET);
    
    try {
      console.log('🔍 About to call server.loadAccount...');
      
      // Check if the account exists and is funded
      const account = await server.loadAccount(BUSINESS_WALLET);
      
      console.log('✅ Business wallet account loaded successfully');
      console.log('✅ Account ID:', account.accountId());
      console.log('✅ Account sequence:', account.sequenceNumber());
      
      // Check balance
      const balance = account.balances.find((b: any) => b.asset_type === 'native');
      console.log('✅ Business wallet XLM balance:', balance?.balance || '0');
      
      console.log('✅ Using business wallet:', BUSINESS_WALLET);
      return BUSINESS_WALLET;
    } catch (error) {
      console.error('❌ Business wallet error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', (error as Error).message);
      console.error('❌ Error stack:', (error as Error).stack);
      
      console.log('❌ Business wallet not found or not funded:', BUSINESS_WALLET);
      // Don't create a new one, just throw an error with instructions
      throw new Error(`Business wallet not found: ${BUSINESS_WALLET}. Please fund this wallet at https://friendbot.stellar.org/?addr=${BUSINESS_WALLET}`);
    }
  }

  /**
   * Get account balance (following the example pattern)
   */
  static async getAccountBalance(publicKey: string): Promise<string> {
    try {
      const account = await server.loadAccount(publicKey);
      const balance = account.balances.find((balance: StellarBalance) => balance.asset_type === 'native');
      return balance ? balance.balance : '0';
    } catch (error) {
      console.error('❌ Hesap bakiyesi alınamadı:', error);
      return '0';
    }
  }

  /**
   * Check if account exists on the network
   */
  static async checkAccountExists(publicKey: string): Promise<boolean> {
    try {
      await server.loadAccount(publicKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fund test account using friendbot
   */
  static async fundTestAccount(publicKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      );
      
      if (response.ok) {
        return {
          success: true,
          message: 'Hesap başarıyla 10000 XLM ile fonlandı!'
        };
      } else {
        return {
          success: false,
          message: 'Hesap fonlanamadı. Hesap zaten fonlanmış olabilir.'
        };
      }
    } catch (error) {
      console.error('Friendbot hatası:', error);
      return {
        success: false,
        message: 'Hesap fonlama sırasında hata oluştu.'
      };
    }
  }

  /**
   * Create a new Stellar account (for demo purposes)
   */
  async createAccount(): Promise<{ publicKey: string; secretKey: string }> {
    const pair = StellarSdk.Keypair.random();
    
    try {
      // Fund account with friendbot
      const response = await fetch(
        `${STELLAR_CONFIG.friendbotUrl}?addr=${pair.publicKey()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fund account');
      }

      return {
        publicKey: pair.publicKey(),
        secretKey: pair.secret(),
      };
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  /**
   * Get account information
   */
  async getAccount(publicKey: string) {
    try {
      const account = await this.server.loadAccount(publicKey);
      return account;
    } catch (error) {
      console.error('Error loading account:', error);
      throw error;
    }
  }
  /**
   * Get account balance for a specific asset
   */
  async getBalance(publicKey: string, assetCode?: string, assetIssuer?: string): Promise<string> {
    try {
      const account = await this.getAccount(publicKey);
      
      if (!assetCode) {
        // Return XLM balance
        const xlmBalance = account.balances.find((balance: StellarBalance) => balance.asset_type === 'native');
        return xlmBalance?.balance || '0';
      }
      
      // Return custom asset balance
      const assetBalance = account.balances.find((balance: StellarBalance) => 
        balance.asset_type !== 'native' &&
        balance.asset_code === assetCode &&
        balance.asset_issuer === assetIssuer
      );
      
      return assetBalance?.balance || '0';
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }
  /**
   * Create and submit a payment transaction
   */
  async createPayment(
    sourceKeypair: StellarSdk.Keypair,
    destinationPublicKey: string,
    amount: string,
    assetCode?: string,
    assetIssuer?: string,
    memo?: string
  ) {
    try {
      const sourceAccount = await this.getAccount(sourceKeypair.publicKey());
      
      const asset = assetCode && assetIssuer 
        ? new Asset(assetCode, assetIssuer)
        : Asset.native();

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100000',
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: destinationPublicKey,
            asset: asset,
            amount: amount,
          })
        )
        .setTimeout(30);

      if (memo) {
        transaction.addMemo(Memo.text(memo));
      }

      const builtTransaction = transaction.build();
      builtTransaction.sign(sourceKeypair);

      const result = await this.server.submitTransaction(builtTransaction);
      return result;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for an account
   */  static async getTransactionHistory(publicKey: string, limit: number = 20): Promise<any[]> {
    try {
      console.log(`Fetching transaction history for account: ${publicKey}`);
      
      const transactions = await server.transactions()
        .forAccount(publicKey)
        .order('desc')
        .limit(limit)
        .call();

      console.log(`Found ${transactions.records.length} transactions for account`);
      
      const processedTransactions = [];

      for (const tx of transactions.records) {
        try {
          console.log(`Processing transaction: ${tx.id}, created: ${tx.created_at}`);
          
          // Get operations for this transaction
          const operations = await server.operations()
            .forTransaction(tx.id)
            .call();

          console.log(`Transaction ${tx.id} has ${operations.records.length} operations`);

          for (const op of operations.records) {
            // Process different operation types
            let transactionData = null;

            switch (op.type) {
              case 'payment':
                console.log(`Processing payment operation: ${op.from} -> ${op.to}, amount: ${op.amount}`);
                if (op.asset_type === 'native') {
                  transactionData = {
                    id: tx.id,
                    type: op.from === publicKey ? 'sent' : 'received',
                    amount: parseFloat(op.amount),
                    asset: 'XLM',
                    from: op.from,
                    to: op.to,
                    timestamp: new Date(tx.created_at),
                    memo: tx.memo || '',
                    hash: tx.hash
                  };
                } else {
                  // Custom token payment
                  transactionData = {
                    id: tx.id,
                    type: op.from === publicKey ? 'sent' : 'received',
                    amount: parseFloat(op.amount),
                    asset: op.asset_code || 'UNKNOWN',
                    from: op.from,
                    to: op.to,
                    timestamp: new Date(tx.created_at),
                    memo: tx.memo || '',
                    hash: tx.hash
                  };
                }
                break;

              case 'create_account':
                console.log(`Processing account creation: ${op.funder} -> ${op.account}`);
                if (op.funder !== publicKey) {
                  transactionData = {
                    id: tx.id,
                    type: 'account_created',
                    amount: parseFloat(op.starting_balance),
                    asset: 'XLM',
                    from: op.funder,
                    to: op.account,
                    timestamp: new Date(tx.created_at),
                    memo: 'Account Creation',
                    hash: tx.hash
                  };
                }
                break;

              case 'manage_data':
                // This could be loyalty program data
                transactionData = {
                  id: tx.id,
                  type: 'data_update',
                  amount: 0,
                  asset: 'DATA',
                  from: publicKey,
                  to: publicKey,
                  timestamp: new Date(tx.created_at),
                  memo: `Data: ${op.name}`,
                  hash: tx.hash
                };
                break;
            }

            if (transactionData) {
              console.log(`Added transaction data:`, transactionData);
              processedTransactions.push(transactionData);
            }
          }
        } catch (opError) {
          console.warn('Operation processing error:', opError);
        }
      }

      console.log(`Processed ${processedTransactions.length} transactions total`);
      return processedTransactions.slice(0, limit);
    } catch (error) {
      console.error('Transaction history fetch error:', error);
      return [];
    }
  }

  /**
   * Get transaction details by hash
   */
  async getTransaction(hash: string) {
    try {
      const transaction = await this.server.transactions().transaction(hash).call();
      return transaction;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  /**
   * Fund testnet account using friendbot (static method for convenience)
   */
  static async fundTestnetAccount(publicKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      );
      
      if (response.ok) {
        return {
          success: true,
          message: 'Hesap başarıyla 10000 XLM ile fonlandı!'
        };
      } else {
        return {
          success: false,
          message: 'Hesap fonlanamadı. Hesap zaten fonlanmış olabilir.'
        };
      }
    } catch (error) {
      console.error('Friendbot hatası:', error);
      return {
        success: false,
        message: 'Hesap fonlama sırasında hata oluştu.'
      };
    }
  }
  /**
   * Monitor account for new transactions
   */
  streamTransactions(publicKey: string, onTransaction: (transaction: unknown) => void) {
    return this.server
      .transactions()
      .forAccount(publicKey)
      .cursor('now')
      .stream({
        onmessage: onTransaction,
        onerror: (error: unknown) => console.error('Stream error:', error),
      });
  }  /**
   * Simulate coffee purchase and earn loyalty tokens
   */
  static async purchaseCoffeeAndEarnTokens(
    customerPublicKey: string,
    businessPublicKey: string,
    coffeePrice: number,
    loyaltyTokensToEarn: number
  ): Promise<{ success: boolean; message: string; transactionHash?: string; transaction?: any }> {
    console.log('🚀 purchaseCoffeeAndEarnTokens function called');
    console.log('🚀 Parameters received:');
    console.log('   - customerPublicKey:', customerPublicKey);
    console.log('   - businessPublicKey:', businessPublicKey);
    console.log('   - coffeePrice:', coffeePrice);
    console.log('   - loyaltyTokensToEarn:', loyaltyTokensToEarn);
    
    try {
      console.log(`🔄 Processing coffee purchase: ${customerPublicKey} -> ${businessPublicKey}, Price: ${coffeePrice} XLM`);
      
      // Validate input parameters
      console.log('🔍 Step 1: Validating input parameters...');
      if (!customerPublicKey || !businessPublicKey) {
        throw new Error('Customer and business wallet addresses are required');
      }
      
      if (coffeePrice <= 0) {
        throw new Error('Coffee price must be greater than 0');
      }
      
      // Check that customer and business are not the same
      if (customerPublicKey === businessPublicKey) {
        throw new Error('Customer and business wallet addresses cannot be the same. Please use a different customer wallet.');
      }
      console.log('✅ Input parameters validated successfully');
        // 1. Check that both accounts exist on the network using the new helper method
      console.log('🔍 Step 2: Validating business wallet exists...');
      const businessExists = await this.checkAccountExists(businessPublicKey);
      if (!businessExists) {
        throw new Error(`Business wallet account not found on network: ${businessPublicKey}. Please ensure the business wallet is funded on testnet.`);
      }
      console.log('✅ Business wallet exists on network');
      
      console.log('🔍 Step 3: Validating customer wallet...');
      const customerExists = await this.checkAccountExists(customerPublicKey);
      if (!customerExists) {
        throw new Error(`Customer wallet account not found on network: ${customerPublicKey}. Please ensure your wallet is funded on testnet. You can get testnet XLM from https://friendbot.stellar.org/?addr=${customerPublicKey}`);
      }
      console.log('✅ Customer wallet exists on network');

      // 2. Check customer balance using the helper method
      console.log('🔍 Step 4: Checking customer balance...');
      const customerBalance = await this.getAccountBalance(customerPublicKey);
      const requiredBalance = coffeePrice + 0.1; // Add 0.1 XLM for transaction fee buffer
      
      console.log(`💰 Customer balance: ${customerBalance} XLM`);
      console.log(`💰 Required balance: ${requiredBalance} XLM (including fees)`);
      
      if (parseFloat(customerBalance) < requiredBalance) {
        throw new Error(`Insufficient XLM balance. Required: ${requiredBalance} XLM (including fees), Available: ${customerBalance} XLM. Please fund your wallet at https://friendbot.stellar.org/?addr=${customerPublicKey}`);
      }
      console.log('✅ Customer has sufficient balance');

      // 3. Load customer account for transaction building
      console.log('🔍 Step 5: Loading customer account for transaction...');
      const customerAccount = await server.loadAccount(customerPublicKey);      // 4. Build transaction following the example pattern
      console.log('🔍 Step 6: Building payment transaction...');
      const transaction = new TransactionBuilder(customerAccount, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
      .addOperation(
        Operation.payment({
          destination: businessPublicKey,
          asset: Asset.native(),
          amount: coffeePrice.toFixed(7), // Ensure proper precision
        })
      )
      .addMemo(
        // Add loyalty info to memo following the example pattern
        Memo.text(`COFFEE:${loyaltyTokensToEarn}:LOYALTY`)
      )
      .setTimeout(30) // 30 seconds timeout like in the example
      .build();

      console.log('✅ Transaction created successfully');
      console.log('📄 Transaction XDR:', transaction.toXDR());
      
      // Return the transaction for signing
      const result = {
        success: true,
        message: `Coffee purchase transaction created. Please sign with your wallet to complete.`,
        transactionHash: transaction.hash().toString('hex'),
        transaction: transaction // Return unsigned transaction
      };
      
      console.log('🎉 purchaseCoffeeAndEarnTokens completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Coffee purchase error in purchaseCoffeeAndEarnTokens:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', (error as Error).message);
      console.error('❌ Error stack:', (error as Error).stack);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: 'Coffee purchase failed: ' + errorMessage
      };
    }
  }

  /**
   * Redeem loyalty tokens for rewards
   */
  static async redeemLoyaltyTokens(
    customerPublicKey: string,
    businessPublicKey: string,
    tokensToRedeem: number,
    rewardDescription: string
  ): Promise<{ success: boolean; message: string; transactionHash?: string }> {
    try {
      // In real implementation, this would:
      // 1. Burn loyalty tokens from customer
      // 2. Record reward redemption in smart contract
      // 3. Notify business of reward to be given
      
      console.log(`Simulating reward redemption: ${customerPublicKey} -> ${businessPublicKey}, Tokens: ${tokensToRedeem}`);
      
      return {
        success: true,
        message: `Redeemed ${tokensToRedeem} tokens for: ${rewardDescription}`,
        transactionHash: 'simulated_redeem_' + Date.now()
      };
    } catch (error) {
      console.error('Token redemption error:', error);
      return {
        success: false,
        message: 'Token redemption failed'
      };
    }
  }  /**
   * Modern Freighter transaction signing and submission
   */
  static async signAndSubmitTransaction(
    transaction: any,
    publicKey: string
  ): Promise<{ success: boolean; message: string; transactionHash?: string }> {
    try {
      console.log('🔐 === STARTING TRANSACTION SIGNING ===');
      console.log('🔐 Customer wallet:', publicKey);
      console.log('🔐 Transaction XDR length:', transaction.toXDR().length);

      // Step 1: Check Freighter status
      console.log('🔍 Step 1: Checking Freighter status...');
      const freighterStatus = await this.getFreighterStatus();
      console.log('🔍 Freighter status:', freighterStatus);

      if (!freighterStatus.isInstalled) {
        return {
          success: false,
          message: 'Freighter extension not found. Please install from https://freighter.app/'
        };
      }

      if (!freighterStatus.isConnected) {
        return {
          success: false,
          message: 'Freighter not connected. Please connect your wallet first.'
        };
      }

      if (freighterStatus.network !== 'TESTNET') {
        return {
          success: false,
          message: `Wrong network. Please switch to Testnet (current: ${freighterStatus.network})`
        };
      }

      if (freighterStatus.publicKey !== publicKey) {
        return {
          success: false,
          message: `Wrong account connected. Expected: ${publicKey.slice(0,8)}..., Connected: ${freighterStatus.publicKey?.slice(0,8)}...`
        };
      }

      console.log('✅ Freighter validation passed');

      // Step 2: Sign transaction
      console.log('✍️ Step 2: Signing transaction...');
      let signedXDR;
      try {
        signedXDR = await freighterApi.signTransaction(
          transaction.toXDR(),
          {
            networkPassphrase: STELLAR_CONFIG.networkPassphrase,
            accountToSign: publicKey,
          }
        );
        console.log('✅ Transaction signed successfully');
      } catch (signError) {
        console.error('❌ Signing failed:', signError);
        const errorMsg = (signError as Error).message;
        
        if (errorMsg.includes('User declined') || errorMsg.includes('rejected')) {
          return { success: false, message: 'Transaction was rejected by user.' };
        }
        
        return { success: false, message: `Signing failed: ${errorMsg}` };
      }

      // Step 3: Build signed transaction
      console.log('🔨 Step 3: Building signed transaction...');
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXDR,
        STELLAR_CONFIG.networkPassphrase
      );

      // Step 4: Submit to network
      console.log('🚀 Step 4: Submitting to Stellar network...');
      const result = await server.submitTransaction(signedTransaction);
      
      console.log('✅ Transaction submitted successfully!');
      console.log('✅ Hash:', result.hash);
      console.log('✅ Ledger:', result.ledger);

      return {
        success: true,
        message: '🎉 Coffee purchase completed successfully!',
        transactionHash: result.hash
      };

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      const errorMsg = (error as Error).message;
      
      if (errorMsg.includes('insufficient funds')) {
        return { success: false, message: 'Insufficient XLM balance for transaction and fees.' };
      }
      
      if (errorMsg.includes('bad_seq')) {
        return { success: false, message: 'Transaction sequence error. Please refresh and try again.' };
      }
      
      return { success: false, message: `Transaction failed: ${errorMsg}` };
    }
  }/**
   * Modern Freighter wallet connection management
   */
  static async isFreighterConnected(): Promise<boolean> {
    try {
      // Use only the official API
      return await freighterApi.isConnected();
    } catch (error) {
      console.warn('Freighter connection check failed:', error);
      return false;
    }
  }

  /**
   * Get comprehensive Freighter status
   */
  static async getFreighterStatus(): Promise<{
    isInstalled: boolean;
    isConnected: boolean;
    publicKey?: string;
    network?: string;
    error?: string;
  }> {
    try {
      // Check if connected using official API
      const isConnected = await freighterApi.isConnected();
      
      if (!isConnected) {
        return {
          isInstalled: true, // If we can call the API, it's installed
          isConnected: false
        };
      }

      // Get connected wallet details
      const publicKey = await freighterApi.getPublicKey();
      const networkDetails = await freighterApi.getNetworkDetails();

      return {
        isInstalled: true,
        isConnected: true,
        publicKey,
        network: networkDetails.network
      };

    } catch (error) {
      // If the API itself fails, extension might not be installed
      return {
        isInstalled: false,
        isConnected: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get user-friendly Freighter info
   */
  static async getFreighterInfo(): Promise<{ isAvailable: boolean; message: string }> {
    const status = await this.getFreighterStatus();

    if (!status.isInstalled) {
      return {
        isAvailable: false,
        message: 'Freighter extension not found. Please install from https://freighter.app/ and refresh.'
      };
    }

    if (!status.isConnected) {
      return {
        isAvailable: false,
        message: 'Freighter installed but not connected. Please connect your wallet.'
      };
    }

    if (status.network !== 'TESTNET') {
      return {
        isAvailable: false,
        message: `Please switch to Stellar Testnet. Current: ${status.network}`
      };
    }

    return {
      isAvailable: true,
      message: `Connected to ${status.publicKey?.slice(0, 8)}... on ${status.network}`
    };
  }

  /**
   * Simple sync check for UI components
   */
  static isFreighterInstalled(): boolean {
    try {
      // Try to access the API - if it exists, extension is installed
      return typeof freighterApi !== 'undefined';
    } catch {
      return false;
    }
  }
  /**
   * Test business wallet and get detailed info
   */
  static async testBusinessWallet(): Promise<{
    address: string;
    exists: boolean;
    balance: string;
    error?: string;
  }> {
    const BUSINESS_WALLET = 'GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK';
    
    try {
      const account = await server.loadAccount(BUSINESS_WALLET);
      const balance = account.balances.find((b: StellarBalance) => b.asset_type === 'native');
      
      return {
        address: BUSINESS_WALLET,
        exists: true,
        balance: balance?.balance || '0'
      };
    } catch (error) {
      return {
        address: BUSINESS_WALLET,
        exists: false,
        balance: '0',
        error: (error as Error).message
      };
    }
  }
  /**
   * Fund business wallet if needed
   */
  static async fundBusinessWalletIfNeeded(): Promise<{ success: boolean; message: string; address: string }> {
    const BUSINESS_WALLET = 'GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK';
    
    try {
      // Check if account exists
      try {
        await server.loadAccount(BUSINESS_WALLET);
        return {
          success: true,
          message: 'Business wallet is already funded and ready.',
          address: BUSINESS_WALLET
        };
      } catch (error) {
        // Account doesn't exist, try to fund it
        console.log('Business wallet not found, attempting to fund:', BUSINESS_WALLET);
        
        const fundResult = await this.fundTestnetAccount(BUSINESS_WALLET);
        if (fundResult.success) {
          return {
            success: true,
            message: `Business wallet funded successfully: ${BUSINESS_WALLET}`,
            address: BUSINESS_WALLET
          };
        } else {
          return {
            success: false,
            message: `Failed to fund business wallet: ${fundResult.message}. Please manually fund at https://friendbot.stellar.org/?addr=${BUSINESS_WALLET}`,
            address: BUSINESS_WALLET
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fund business wallet: ' + (error as Error).message + `. Please manually fund at https://friendbot.stellar.org/?addr=${BUSINESS_WALLET}`,
        address: BUSINESS_WALLET
      };
    }
  }

  /**
   * Get transaction status by hash (following the example pattern)
   */
  static async getTransactionStatus(transactionHash: string) {
    try {
      const transaction = await server.transactions().transaction(transactionHash).call();
      return {
        successful: transaction.successful,
        fee: transaction.fee_charged,
        memo: transaction.memo,
        ledger: transaction.ledger,
        created_at: transaction.created_at,
      };
    } catch (error) {
      console.error('❌ Transaction status could not be retrieved:', error);
      return null;
    }
  }
  /**
   * Comprehensive Freighter debugging
   */
  static async debugFreighterState(): Promise<void> {
    console.log('🔍 === FREIGHTER DEBUG REPORT ===');
    
    try {
      // Test 1: Basic API availability
      console.log('🔍 Test 1: API Availability');
      console.log('   - freighterApi object:', typeof freighterApi);
      console.log('   - isFreighterInstalled():', this.isFreighterInstalled());
      
      // Test 2: Connection status
      console.log('🔍 Test 2: Connection Status');
      const status = await this.getFreighterStatus();
      console.log('   - Full status:', status);
      
      // Test 3: User-friendly info
      console.log('🔍 Test 3: User Info');
      const info = await this.getFreighterInfo();
      console.log('   - Info:', info);
      
      // Test 4: Direct API calls
      if (status.isConnected) {
        console.log('🔍 Test 4: Direct API Calls');
        try {
          const publicKey = await freighterApi.getPublicKey();
          console.log('   - Public Key:', publicKey);
          
          const network = await freighterApi.getNetworkDetails();
          console.log('   - Network:', network);
          
          const balance = await this.getAccountBalance(publicKey);
          console.log('   - Balance:', balance, 'XLM');
        } catch (apiError) {
          console.log('   - API Error:', apiError);
        }
      }
      
    } catch (error) {
      console.log('🔍 Debug Error:', error);
    }
    
    console.log('🔍 === END DEBUG REPORT ===');
  }
}

export const stellarService = new StellarService();
export { StellarService };
export default stellarService;
