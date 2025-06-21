import { useWalletContext } from '@/contexts/WalletContext';
import freighterService from '@/services/freighterService';

export const useWalletRequired = () => {
  const { 
    isConnected, 
    address,
    connectWallet, 
    isFreighterInstalled, 
    showWalletModal, 
    setShowWalletModal 
  } = useWalletContext();  /**
   * Check wallet connection status, show modal if not connected
   * Returns true if wallet is connected, false if modal was shown
   */
  const requireWalletWithModal = async (): Promise<boolean> => {
    console.log('requireWalletWithModal called - isConnected:', isConnected, 'address:', address, 'isFreighterInstalled:', isFreighterInstalled);
    
    // If already connected and has address, return true immediately
    if (isConnected && address) {
      console.log('Wallet already connected, returning true');
      return true;
    }
    
    // Check if Freighter is installed before showing modal
    if (!isFreighterInstalled) {
      console.warn('Freighter not installed, showing modal');
      setShowWalletModal(true);
      return false;
    }
    
    // Not connected but Freighter is available, show modal for user to connect
    console.log('Wallet not connected, showing modal');
    setShowWalletModal(true);
    return false;
  };
  /**
   * Require wallet connection with auto-connect option
   * @deprecated Use requireWalletWithModal instead
   */
  const requireWallet = async (options?: {
    title?: string;
    description?: string;
    autoConnect?: boolean;
  }): Promise<{ publicKey: string; network: string }> => {
    // If already connected, return wallet details immediately
    if (isConnected && address) {
      return await freighterService.requireWalletConnection();
    }

    // If auto-connect is disabled or Freighter is not installed, show modal
    if (!options?.autoConnect || !isFreighterInstalled) {
      setShowWalletModal(true);
      throw new Error('WALLET_REQUIRED');
    }

    // Try auto-connect (only once)
    try {
      await connectWallet();
      return await freighterService.requireWalletConnection();
    } catch {
      setShowWalletModal(true);
      throw new Error('WALLET_REQUIRED');
    }
  };
  /**
   * Get currently connected wallet address
   */
  const getConnectedAddress = (): string | null => {
    return isConnected ? address : null;
  };

  /**
   * Check if wallet is ready for transactions
   */
  const isWalletReady = (): boolean => {
    return isConnected && !!address && isFreighterInstalled;
  };

  return {
    // Status information
    isConnected,
    address,
    isFreighterInstalled,
    isWalletReady: isWalletReady(),
    
    // Main functions
    requireWalletWithModal,
    getConnectedAddress,
    
    // Modal control
    showWalletModal,
    setShowWalletModal,
    
    // Backward compatibility (deprecated)
    requireWallet,
  };
};
