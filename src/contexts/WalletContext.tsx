import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import freighterService from '@/services/freighterService';

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
    // Uygulama başlatıldığında bir kez kontrol et
    const initializeWallet = async () => {
      const savedWallet = localStorage.getItem('connectedWallet');
      const walletType = localStorage.getItem('walletType');
      
      if (savedWallet && walletType === 'freighter') {
        try {
          // Sadece Freighter API'sinin mevcut olduğunu kontrol et
          // Otomatik yeniden bağlanma yapma
          const isAvailable = await freighterService.isFreighterInstalled();
          if (isAvailable) {
            console.log('Previous wallet connection found:', savedWallet);
            // Bağlantı bilgilerini restore et ama yeniden bağlanma
          } else {
            // Freighter mevcut değilse bağlantı bilgilerini temizle
            localStorage.removeItem('connectedWallet');
            localStorage.removeItem('walletType');
          }
        } catch {
          // Hata durumunda bağlantı bilgilerini temizle
          localStorage.removeItem('connectedWallet');
          localStorage.removeItem('walletType');
        }
      }
      
      setIsInitialized(true);
    };

    initializeWallet();
  }, []);
  const connectWallet = async () => {
    if (!isFreighterInstalled) {
      throw new Error('Freighter wallet is not installed. Please install it first.');
    }

    await connectWithFreighter();
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
      {children}    </WalletContext.Provider>
  );
};

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
