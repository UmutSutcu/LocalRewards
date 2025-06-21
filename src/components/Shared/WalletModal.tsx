import React, { useState } from 'react';
import { X, Wallet, AlertCircle, Download, RefreshCw } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import { useWalletContext } from '@/contexts/WalletContext';
import freighterService from '@/services/freighterService';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

const WalletModal: React.FC<WalletModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "Cüzdan Bağlantısı Gerekli",
  description = "Bu işlemi gerçekleştirmek için cüzdanınızı bağlamanız gerekiyor."
}) => {
  const { isFreighterInstalled, connectWallet, isLoading } = useWalletContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingInstallation, setIsCheckingInstallation] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await connectWallet();
      onClose();
    } catch (error) {
      console.error('Connection failed:', error);
      if (error instanceof Error) {
        // Use service to get user-friendly error messages
        if (error.message === 'FREIGHTER_NOT_INSTALLED') {
          setError(freighterService.getErrorMessage('FREIGHTER_NOT_INSTALLED'));
        } else if (error.message === 'USER_REJECTED') {
          setError(freighterService.getErrorMessage('USER_REJECTED'));
        } else if (error.message === 'CONNECTION_FAILED') {
          setError(freighterService.getErrorMessage('CONNECTION_FAILED'));
        } else {
          setError('Cüzdan bağlantısı başarısız. Lütfen tekrar deneyin.');
        }
      } else {
        setError('Bilinmeyen bir hata oluştu.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInstallFreighter = () => {
    const installUrl = freighterService.getInstallationUrl();
    window.open(installUrl, '_blank');
  };

  const handleRefreshDetection = async () => {
    setIsCheckingInstallation(true);
    setError(null);
    
    try {
      await freighterService.refreshDetection();
      // Force a re-check by refreshing the page or triggering a state update
      window.location.reload();
    } catch (error) {
      setError('Cüzdan tespiti başarısız oldu.');
    } finally {
      setIsCheckingInstallation(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">{description}</p>

          {!isFreighterInstalled ? (
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-900 mb-1">
                      Freighter Cüzdanı Bulunamadı
                    </h4>
                    <p className="text-orange-700 text-sm">
                      İşlemleri gerçekleştirmek için Freighter cüzdan uzantısına ihtiyacınız var.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleInstallFreighter}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Freighter'ı Yükle</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleRefreshDetection}
                  disabled={isCheckingInstallation}
                  className="flex items-center justify-center"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingInstallation ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Freighter'ı yükledikten sonra yenile butonuna tıklayın
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Wallet className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      Freighter Cüzdanı Hazır
                    </h4>
                    <p className="text-blue-700 text-sm">
                      Cüzdanınızı bağlamak için aşağıdaki butona tıklayın.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isConnecting || isLoading}
                className="w-full flex items-center justify-center space-x-2"
              >
                {isConnecting || isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Bağlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Cüzdanı Bağla</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 mb-1">Hata</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              İptal
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WalletModal;
