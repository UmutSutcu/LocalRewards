import { useContext } from 'react';
import { WalletContext } from '@/contexts/WalletContextDefinition';
import { WalletContextType } from '@/types/wallet';

export function useWalletContext(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
