import { createContext } from 'react';
import { WalletContextType } from '@/types/wallet';

export const WalletContext = createContext<WalletContextType | undefined>(undefined);
