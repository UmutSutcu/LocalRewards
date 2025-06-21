import { useWalletContext } from '@/contexts/WalletContext';
import freighterService from '@/services/freighterService';

export const useWalletRequired = () => {
  const { 
    isConnected, 
    connectWallet, 
    isFreighterInstalled, 
    showWalletModal, 
    setShowWalletModal 
  } = useWalletContext();

  const requireWallet = async (options?: {
    title?: string;
    description?: string;
    autoConnect?: boolean;
  }): Promise<{ publicKey: string; network: string }> => {
    // If already connected, return wallet details
    if (isConnected) {
      return await freighterService.requireWalletConnection();
    }

    // If auto-connect is disabled or Freighter is not installed, show modal
    if (!options?.autoConnect || !isFreighterInstalled) {
      setShowWalletModal(true);
      
      // Return a promise that rejects (user needs to manually connect)
      throw new Error('WALLET_REQUIRED');
    }

    // Try auto-connect
    try {
      await connectWallet();
      return await freighterService.requireWalletConnection();
    } catch (error) {
      // If auto-connect fails, show modal
      setShowWalletModal(true);
      throw new Error('WALLET_REQUIRED');
    }
  };
  const requireWalletWithModal = () => {
    if (!isConnected) {
      setShowWalletModal(true);
      return false;
    }
    return true;
  };

  return {
    isConnected,
    isFreighterInstalled,
    requireWallet,
    requireWalletWithModal,
    showWalletModal,
    setShowWalletModal,
  };
};
