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
  } = useWalletContext();

  /**
   * Wallet bağlantısını kontrol eder, bağlı değilse modal gösterir
   * Bir kez bağlandıktan sonra tekrar bağlanmaya çalışmaz
   */
  const requireWalletWithModal = async (): Promise<boolean> => {
    // Zaten bağlıysa, bağlantıyı doğrula
    if (isConnected && address) {
      try {
        // Freighter API'sinin çalıştığını doğrula
        const connection = await freighterService.requireWalletConnection();
        return connection.publicKey === address;
      } catch (error) {
        console.warn('Wallet connection validation failed:', error);
        // Bağlantı geçersizse modal göster
        setShowWalletModal(true);
        return false;
      }
    }
    
    // Bağlı değilse modal göster
    if (!isConnected) {
      setShowWalletModal(true);
      return false;
    }
    
    return false;
  };

  /**
   * Wallet bağlantısını gerektirir, otomatik bağlanma seçeneği ile
   * @deprecated Bu fonksiyon yerine requireWalletWithModal kullanın
   */
  const requireWallet = async (options?: {
    title?: string;
    description?: string;
    autoConnect?: boolean;
  }): Promise<{ publicKey: string; network: string }> => {
    // Zaten bağlıysa wallet bilgilerini döndür
    if (isConnected && address) {
      return await freighterService.requireWalletConnection();
    }

    // Otomatik bağlanma kapalıysa veya Freighter yüklü değilse modal göster
    if (!options?.autoConnect || !isFreighterInstalled) {
      setShowWalletModal(true);
      throw new Error('WALLET_REQUIRED');
    }

    // Otomatik bağlanmaya çalış (sadece bir kez)
    try {
      await connectWallet();
      return await freighterService.requireWalletConnection();
    } catch {
      setShowWalletModal(true);
      throw new Error('WALLET_REQUIRED');
    }
  };

  /**
   * Mevcut bağlı wallet adresini döndürür
   */
  const getConnectedAddress = (): string | null => {
    return isConnected ? address : null;
  };

  /**
   * Wallet bağlantı durumunu kontrol eder
   */
  const isWalletReady = (): boolean => {
    return isConnected && !!address && isFreighterInstalled;
  };

  return {
    // Durum bilgileri
    isConnected,
    address,
    isFreighterInstalled,
    isWalletReady: isWalletReady(),
    
    // Ana fonksiyonlar
    requireWalletWithModal,
    getConnectedAddress,
    
    // Modal kontrolü
    showWalletModal,
    setShowWalletModal,
    
    // Geriye uyumluluk için (deprecated)
    requireWallet,
  };
};
