import { useState, useEffect, useCallback } from 'react';
import { WalletState } from '../types';
import passkeyWalletService from '../services/passkeyService';
import freighterService from '../services/freighterService';
import stellarService from '../services/stellarService';

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: '0',
    isLoading: false,
    error: null,
  });
  const [isPasskeySupported, setIsPasskeySupported] = useState(false);
  const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);

  const loadBalance = useCallback(async (address: string) => {
    try {
      const balance = await stellarService.getBalance(address);
      setWalletState(prev => ({
        ...prev,
        balance,
      }));
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  }, []);  useEffect(() => {
    setIsPasskeySupported(passkeyWalletService.isPasskeySupported());
    
    // Only check if Freighter is installed
    const checkFreighter = async () => {
      const installed = await freighterService.isFreighterInstalled();
      setIsFreighterInstalled(installed);
      
      // If saved wallet exists, only restore state
      // Don't auto-reconnect
      const savedWallet = localStorage.getItem('connectedWallet');
      const walletType = localStorage.getItem('walletType');
      
      if (savedWallet && installed) {
        if (walletType === 'freighter') {
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            address: savedWallet,
          }));
          
          // Load balance
          loadBalance(savedWallet);
        } else if (walletType === 'passkey') {
          // For passkey connections
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            address: savedWallet,
          }));
          
          // Load balance
          loadBalance(savedWallet);
        }
      }
    };
    
    checkFreighter();
  }, [loadBalance]);

  const connectWithPasskey = useCallback(async (username?: string) => {
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let passkey;
      
      if (username) {
        // Create new passkey
        passkey = await passkeyWalletService.createPasskey(username);
      } else {
        // Authenticate with existing passkey
        passkey = await passkeyWalletService.authenticateWithPasskey();
      }

      const walletAddress = await passkeyWalletService.createSmartWallet(passkey);
      
      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        address: walletAddress,
        isLoading: false,
      }));      // Save to localStorage
      localStorage.setItem('connectedWallet', walletAddress);
      localStorage.setItem('walletType', 'passkey');
      
      // Load balance
      await loadBalance(walletAddress);

      return walletAddress;
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
      throw error;
    }
  }, [loadBalance]);
  const disconnect = useCallback(() => {
    const walletType = localStorage.getItem('walletType');
    
    if (walletType === 'passkey') {
      passkeyWalletService.disconnect();
    }
    // Freighter doesn't need explicit disconnect, just clear local storage
    
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletType');
    
    setWalletState({
      isConnected: false,
      address: null,
      balance: '0',
      isLoading: false,
      error: null,
    });
  }, []);

  const refreshBalance = useCallback(async () => {
    if (walletState.address) {
      await loadBalance(walletState.address);
    }
  }, [walletState.address, loadBalance]);
  const connectWithFreighter = useCallback(async () => {
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const isInstalled = await freighterService.isFreighterInstalled();
      if (!isInstalled) {
        throw new Error('Freighter wallet is not installed');
      }

      const { publicKey, network } = await freighterService.connect();
      
      // Verify we're on testnet
      if (network !== 'TESTNET') {
        throw new Error('Please switch to Stellar Testnet in Freighter');
      }

      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        address: publicKey,
        isLoading: false,
        error: null,
      }));

      // Save to localStorage
      localStorage.setItem('connectedWallet', publicKey);
      localStorage.setItem('walletType', 'freighter');
      
      // Load balance
      await loadBalance(publicKey);

      return publicKey;
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Freighter',
      }));
      throw error;
    }
  }, [loadBalance]);
  return {
    ...walletState,
    isPasskeySupported,
    isFreighterInstalled,
    connectWithPasskey,
    connectWithFreighter,
    disconnect,
    refreshBalance,
  };
};
