import { useState } from 'react';
import { WalletProvider, useWalletContext } from './contexts/WalletContext';
import BusinessDashboard from './components/BusinessPanel/BusinessDashboard';
import CustomerDashboard from './components/CustomerPanel/CustomerDashboard';
import DonationDashboard from './components/DonationPanel/DonationDashboard';
import WalletModal from './components/Shared/WalletModal';
import { Wallet, User, Heart, Building2 } from 'lucide-react';

type UserType = 'business' | 'customer' | 'donor' | null;

function AppContent() {
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
  const { showWalletModal, setShowWalletModal, isConnected, address } = useWalletContext();

  const handleUserTypeSelection = (type: UserType) => {
    setSelectedUserType(type);
  };
  const renderSelectedPanel = () => {
    switch (selectedUserType) {
      case 'business':
        return <BusinessDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      case 'donor':
        return <DonationDashboard />;
      default:
        return renderLandingPage();
    }
  };

  const renderLandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            StellarLocalRewards
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stellar blockchain tabanlı yerel sadakat programı ve mikro-bağış platformu. 
            Cüzdan bağlamadan keşfedin, işlem yapmak için bağlayın.
          </p>
        </div>

        {/* Wallet Status */}
        {isConnected && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center space-x-2">
              <Wallet className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Cüzdan Bağlı: {address?.substring(0, 8)}...{address?.substring(-8)}
              </span>
            </div>
          </div>
        )}

        {/* User Type Selection */}
        <div className="grid md:grid-cols-3 gap-6">
          <div 
            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-primary-500"
            onClick={() => handleUserTypeSelection('business')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">İşletme</h3>
              <p className="text-gray-600 mb-4">
                Müşteri sadakat programları oluşturun ve yönetin. Token dağıtın, müşteri bağlılığını artırın.
              </p>
              <div className="text-sm text-blue-600 font-medium">
                Sadakat programları, Token yönetimi, Müşteri analitiği
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-primary-500"
            onClick={() => handleUserTypeSelection('customer')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Müşteri</h3>
              <p className="text-gray-600 mb-4">
                Alışveriş yaparak token kazanın, ödülleri keşfedin ve kullanın. Yerel işletmeleri destekleyin.
              </p>
              <div className="text-sm text-green-600 font-medium">
                Token kazanma, Ödül kullanma, Yerel destek
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-primary-500"
            onClick={() => handleUserTypeSelection('donor')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bağışçı</h3>
              <p className="text-gray-600 mb-4">
                Sosyal sorumluluk projelerine mikro-bağışlar yapın. Şeffaf ve güvenli bağış sistemi.
              </p>
              <div className="text-sm text-purple-600 font-medium">
                Mikro-bağışlar, Şeffaflık, Sosyal etki
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            🔗 Stellar Blockchain • 🔐 Passkey Auth • ⚡ Launchtube Paymaster • 💼 Smart Contracts
          </p>
        </div>

        {/* Back button for selected user type */}
        {selectedUserType && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setSelectedUserType(null)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Ana Sayfaya Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderSelectedPanel()}
      
      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        title="Cüzdan Bağlantısı Gerekli"
        description="Bu işlemi gerçekleştirmek için cüzdanınızı bağlamanız gerekiyor."
      />
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;