export interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;
  isLoading: boolean;
  error: string | null;
  isFreighterInstalled: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  showWalletModal: boolean;
  setShowWalletModal: (show: boolean) => void;
}
