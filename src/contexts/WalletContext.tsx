import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';

interface WalletContextType {
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

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const {
    isConnected,
    address,
    balance,
    isLoading,
    error,
    isFreighterInstalled,
    connectWithFreighter,
    disconnect: disconnectWallet,
    refreshBalance,
  } = useWallet();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    // Initialize wallet check - non-blocking
    const checkPreviousConnection = async () => {
      const savedWallet = localStorage.getItem('connectedWallet');
      const walletType = localStorage.getItem('walletType');
      
      if (savedWallet && walletType === 'freighter') {
        try {
          // Try to reconnect with Freighter silently
          await connectWithFreighter();
        } catch (error) {
          console.log('Failed to reconnect with Freighter, clearing saved connection');
          // Clear invalid saved connection
          localStorage.removeItem('connectedWallet');
          localStorage.removeItem('walletType');
        }
      }
      
      setIsInitialized(true);
    };

    // Run async but don't block UI
    checkPreviousConnection();
  }, [connectWithFreighter]);

  const connectWallet = async () => {
    if (!isFreighterInstalled) {
      throw new Error('Freighter wallet is not installed. Please install it first.');
    }

    try {
      await connectWithFreighter();
    } catch (error) {
      throw error;
    }
  };

  const disconnect = () => {
    disconnectWallet();
  };  const contextValue: WalletContextType = {
    isConnected,
    address,
    balance,
    isLoading: isLoading && !isInitialized, // Don't show loading if initialized
    error,
    isFreighterInstalled,
    connectWallet,
    disconnect,
    refreshBalance,
    showWalletModal,
    setShowWalletModal,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
