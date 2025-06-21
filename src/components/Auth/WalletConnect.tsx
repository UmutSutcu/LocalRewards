import React, { useState } from 'react';
import { Wallet, Eye, EyeOff, Copy, ExternalLink } from 'lucide-react';
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress, copyToClipboard } from '@/utils';

interface WalletConnectProps {
  userType: 'business' | 'customer';
  onConnect: (userType: 'business' | 'customer') => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ userType, onConnect }) => {
  const { 
    isConnected, 
    address, 
    balance, 
    isLoading, 
    connectWithPasskey,
    disconnect,
    isPasskeySupported 
  } = useWallet();

  const [showAddress, setShowAddress] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWithPasskey();
      onConnect(userType);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleCopyAddress = async () => {
    if (address && await copyToClipboard(address)) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <Card className="text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-primary-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Connect Your Wallet
        </h3>
        
        <p className="text-gray-600 mb-6">
          Use Passkey authentication to securely connect your smart wallet
        </p>

        {!isPasskeySupported && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              Passkey is not supported in your browser. Please use a supported browser.
            </p>
          </div>
        )}

        <Button
          onClick={handleConnect}
          disabled={isLoading || !isPasskeySupported}
          isLoading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Connecting...' : 'Connect with Passkey'}
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Wallet Connected</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-600">Connected</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Balance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">XLM Balance</div>
          <div className="text-2xl font-bold text-gray-900">
            {balance} XLM
          </div>
        </div>

        {/* Address */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">Wallet Address</div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddress(!showAddress)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopyAddress}
                className="text-gray-400 hover:text-gray-600"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="font-mono text-sm text-gray-900">
            {showAddress ? address : formatAddress(address || '')}
          </div>
          
          {copySuccess && (
            <div className="text-xs text-green-600 mt-1">Copied to clipboard!</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <a
            href={`https://testnet.stellarchain.io/accounts/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
          </a>
          
          <Button
            variant="ghost"
            onClick={disconnect}
            className="flex-1"
          >
            Disconnect
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default WalletConnect;
