import * as StellarSdk from '@stellar/stellar-sdk';

// Extract needed classes from StellarSdk
const { 
  Networks, 
  TransactionBuilder, 
  Operation, 
  Asset, 
  Memo
} = StellarSdk;

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
   * Get account balance
   */
  static async getAccountBalance(publicKey: string): Promise<string> {
    try {
      const account = await server.loadAccount(publicKey);
      const balance = account.balances.find((balance: any) => balance.asset_type === 'native');
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
      
      if (!assetCode) {        // Return XLM balance
        const xlmBalance = account.balances.find((balance: any) => balance.asset_type === 'native');
        return xlmBalance?.balance || '0';
      }
      
      // Return custom asset balance
      const assetBalance = account.balances.find((balance: any) => 
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
   */
  async getTransactionHistory(publicKey: string, limit: number = 10) {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(publicKey)
        .order('desc')
        .limit(limit)
        .call();

      return transactions.records;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
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
  streamTransactions(publicKey: string, onTransaction: (transaction: any) => void) {
    return this.server
      .transactions()
      .forAccount(publicKey)
      .cursor('now')
      .stream({        onmessage: onTransaction,
        onerror: (error: any) => console.error('Stream error:', error),
      });
  }
}

export const stellarService = new StellarService();
export { StellarService };
export default stellarService;
