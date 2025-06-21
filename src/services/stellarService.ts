import * as StellarSdk from '@stellar/stellar-sdk';

// Extract needed classes from StellarSdk
const { 
  Networks, 
  TransactionBuilder, 
  Operation, 
  Asset, 
  Memo
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
    // Use the specific business wallet address provided by user
    const BUSINESS_WALLET = 'GBFHNS7DD2O3MS4LARWVQ7T6HG42FZTATJOSA4LZ5L5BXGRXHHMPDRLK';
    
    try {
      // Check if the account exists and is funded
      await server.loadAccount(BUSINESS_WALLET);
      console.log('Using business wallet:', BUSINESS_WALLET);
      return BUSINESS_WALLET;
    } catch (error) {
      console.log('Business wallet not found or not funded:', BUSINESS_WALLET);
      // Don't create a new one, just throw an error with instructions
      throw new Error(`Business wallet not found: ${BUSINESS_WALLET}. Please fund this wallet at https://friendbot.stellar.org/?addr=${BUSINESS_WALLET}`);
    }
  }

  /**
   * Get account balance
   */
  static async getAccountBalance(publicKey: string): Promise<string> {
    try {
      const account = await server.loadAccount(publicKey);
      const balance = account.balances.find((balance: StellarBalance) => balance.asset_type === 'native');
      return balance ? balance.balance : '0';
    } catch (error) {
      console.error('Hesap bakiyesi alınamadı:', error);
      return '0';
    }
  }

  /**
   * Check if account exists
   */
  static async checkAccountExists(publicKey: string): Promise<boolean> {
    try {
      await server.loadAccount(publicKey);
      return true;    } catch {
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
   */  static async purchaseCoffeeAndEarnTokens(
    customerPublicKey: string,
    businessPublicKey: string,
    coffeePrice: number,
    loyaltyTokensToEarn: number
  ): Promise<{ success: boolean; message: string; transactionHash?: string; transaction?: any }> {
    try {
      // In a real implementation, this would:
      // 1. Transfer XLM from customer to business for coffee payment
      // 2. Mint loyalty tokens to customer
      // 3. Record the transaction in smart contract      // For demo purposes, we'll create a real testnet transaction with memo
      console.log(`Processing coffee purchase: ${customerPublicKey} -> ${businessPublicKey}, Price: ${coffeePrice} XLM`);
      
      // Check that customer and business are not the same
      if (customerPublicKey === businessPublicKey) {
        throw new Error('Customer and business wallet addresses cannot be the same. Please use a different customer wallet.');
      }
      
      // Validate that both accounts exist on the network
      try {
        await server.loadAccount(businessPublicKey);
      } catch (error) {
        throw new Error(`Business wallet account not found on network: ${businessPublicKey}. Please ensure the business wallet is funded on testnet.`);
      }
      
      let customerAccount;
      try {
        customerAccount = await server.loadAccount(customerPublicKey);
      } catch (error) {
        throw new Error(`Customer wallet account not found on network: ${customerPublicKey}. Please ensure your wallet is funded on testnet. You can get testnet XLM from https://friendbot.stellar.org/?addr=${customerPublicKey}`);
      }
      
      // Create a payment transaction with loyalty memo
      
      const transaction = new TransactionBuilder(customerAccount, {
        fee: '100000',
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })        .addOperation(Operation.payment({
          destination: businessPublicKey,
          asset: Asset.native(),
          amount: coffeePrice.toString(),
        }))
        .addMemo(Memo.text(`Coffee+${loyaltyTokensToEarn}pts`))
        .setTimeout(30)
        .build();

      // Return the transaction for signing
      // In real app, this would be signed by user's wallet (Freighter, etc.)
      return {
        success: true,
        message: `Coffee purchased! Transaction created. Please sign with your wallet to complete.`,
        transactionHash: transaction.hash().toString('hex'),
        transaction: transaction // Return unsigned transaction
      };
    } catch (error) {
      console.error('Coffee purchase error:', error);
      return {
        success: false,
        message: 'Coffee purchase failed: ' + (error as Error).message
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
  }
  /**
   * Sign and submit transaction using Freighter wallet
   */
  static async signAndSubmitTransaction(
    transaction: any,
    publicKey: string
  ): Promise<{ success: boolean; message: string; transactionHash?: string }> {
    try {
      // Check if Freighter is available
      if (!(window as any).freighterApi) {
        // If Freighter is not available, provide helpful instructions
        return {
          success: false,
          message: 'Freighter wallet not found. Please install Freighter browser extension from https://freighter.app/ and try again.'
        };
      }

      // Get network details
      const networkPassphrase = STELLAR_CONFIG.networkPassphrase;
      
      // Sign transaction with Freighter
      const signedTransaction = await (window as any).freighterApi.signTransaction(
        transaction.toXDR(),
        {
          network: networkPassphrase,
          accountToSign: publicKey,
        }
      );

      // Submit the signed transaction
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedTransaction,
        networkPassphrase
      );

      const result = await server.submitTransaction(signedTx);
      
      return {
        success: true,
        message: 'Transaction submitted successfully!',
        transactionHash: result.hash
      };
    } catch (error) {
      console.error('Transaction signing/submission error:', error);
      
      // Provide more specific error messages
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('User rejected')) {
        return {
          success: false,
          message: 'Transaction was rejected by user.'
        };
      } else if (errorMessage.includes('insufficient funds')) {
        return {
          success: false,
          message: 'Insufficient funds. Please ensure your wallet has enough XLM for the transaction and fees.'
        };
      } else {
        return {
          success: false,
          message: 'Transaction failed: ' + errorMessage
        };
      }
    }
  }

  /**
   * Check if Freighter wallet is available
   */
  static isFreighterAvailable(): boolean {
    return !!(window as any).freighterApi;
  }

  /**
   * Get Freighter connection info and helpful instructions
   */
  static getFreighterInfo(): { isAvailable: boolean; message: string } {
    const isAvailable = this.isFreighterAvailable();
    
    if (isAvailable) {
      return {
        isAvailable: true,
        message: 'Freighter wallet is available and ready to use.'
      };
    } else {
      return {
        isAvailable: false,
        message: 'Freighter wallet not found. Please install Freighter browser extension from https://freighter.app/ and refresh the page.'
      };
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
}

export const stellarService = new StellarService();
export { StellarService };
export default stellarService;
