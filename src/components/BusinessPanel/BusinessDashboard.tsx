import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Users, 
  TrendingUp, 
  Gift, 
  Plus, 
  Eye,
  Settings,
  BarChart3,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Button from '@/components/Shared/Button';
import Card from '@/components/Shared/Card';
import WalletConnection from '@/components/Shared/WalletConnection';
import { useWalletRequired } from '@/hooks/useWalletRequired';
import { formatNumber, formatDate } from '@/utils';

interface BusinessStats {
  totalTokensIssued: number;
  activeCustomers: number;
  tokensRedeemed: number;
  totalRevenue: number;
  conversionRate: number;
}

interface TokenData {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number;
  issued: number;
  redeemed: number;
  rate: number;
  description: string;
}

interface Transaction {
  id: string;
  type: 'issued' | 'redeemed';
  amount: number;
  customer: string;
  customerAddress: string;
  timestamp: Date;
  description: string;
}

const BusinessDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tokens' | 'customers' | 'analytics'>('overview');
  const [showCreateToken, setShowCreateToken] = useState(false);
  const [showDistributeTokens, setShowDistributeTokens] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { requireWalletWithModal, address } = useWalletRequired();

  // Wallet adresini otomatik güncelle
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
    }
  }, [address]);

  // Mock data
  const businessStats: BusinessStats = {
    totalTokensIssued: 50000,
    activeCustomers: 1250,
    tokensRedeemed: 12500,
    totalRevenue: 75000,
    conversionRate: 3.2
  };

  const recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'issued',
      amount: 100,
      customer: 'John Doe',
      customerAddress: 'GDXXX...XXXX',
      timestamp: new Date(),
      description: 'Coffee purchase'
    },
    {
      id: '2', 
      type: 'redeemed',
      amount: 50,
      customer: 'Jane Smith',
      customerAddress: 'GCYYY...YYYY',
      timestamp: new Date(Date.now() - 3600000),
      description: 'Free coffee reward'
    }
  ];

  const tokens: TokenData[] = [
    {
      id: '1',
      name: 'Coffee Shop Rewards',
      symbol: 'COFFEE',
      totalSupply: 1000000,
      issued: 50000,
      redeemed: 12500,
      rate: 1,
      description: 'Coffee shop reward tokens'
    }
  ];  const handleCreateToken = async () => {
    // Wallet bağlı değilse modal göster
    if (!address) {
      const hasWallet = await requireWalletWithModal();
      if (!hasWallet) {
        return;
      }
    }

    // Wallet bağlıysa direkt işlemi başlat
    try {
      setShowCreateToken(true);
    } catch (error) {
      console.error('Token creation failed:', error);
    }
  };

  const handleDistributeTokens = async () => {
    // Wallet bağlı değilse modal göster  
    if (!address) {
      const hasWallet = await requireWalletWithModal();
      if (!hasWallet) {
        return;
      }
    }

    // Wallet bağlıysa direkt işlemi başlat
    try {
      setShowDistributeTokens(true);
    } catch (error) {
      console.error('Token distribution failed:', error);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="mb-6">
        <WalletConnection 
          publicKey={walletAddress} 
          onConnect={setWalletAddress} 
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tokens</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(businessStats.totalTokensIssued)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Coins className="w-6 h-6 text-blue-600" />
            </div>
          </div>          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+12.5%</span>
            <span className="text-sm text-gray-500 ml-1">this month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(businessStats.activeCustomers)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+8.2%</span>
            <span className="text-sm text-gray-500 ml-1">this month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Redeemed Tokens</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(businessStats.tokensRedeemed)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
          </div>          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+15.3%</span>
            <span className="text-sm text-gray-500 ml-1">this month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{businessStats.conversionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+2.1%</span>
            <span className="text-sm text-gray-500 ml-1">this month</span>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          onClick={handleCreateToken}
          className="p-4 h-auto flex-col items-start text-left justify-start"
        >
          <Plus className="w-6 h-6 mb-2" />
          <div className="font-semibold">Yeni Token Oluştur</div>
          <div className="text-sm opacity-90 font-normal">Sadakat programı token'ı oluşturun</div>
        </Button>

        <Button 
          variant="outline"
          onClick={handleDistributeTokens}
          className="p-4 h-auto flex-col items-start text-left justify-start"
        >
          <CreditCard className="w-6 h-6 mb-2" />
          <div className="font-semibold">Token Dağıt</div>
          <div className="text-sm opacity-90 font-normal">Müşterilere token gönderin</div>
        </Button>

        <Button 
          variant="outline"
          onClick={() => setSelectedTab('analytics')}
          className="p-4 h-auto flex-col items-start text-left justify-start"
        >
          <BarChart3 className="w-6 h-6 mb-2" />
          <div className="font-semibold">Analitikleri Görüntüle</div>
          <div className="text-sm opacity-90 font-normal">Detaylı raporları inceleyin</div>
        </Button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Son İşlemler</h3>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'issued' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {transaction.type === 'issued' ? 
                      <ArrowUpRight className="w-5 h-5 text-green-600" /> :
                      <ArrowDownRight className="w-5 h-5 text-blue-600" />
                    }
                  </div>
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-gray-500">{transaction.customer}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${
                    transaction.type === 'issued' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {transaction.type === 'issued' ? '+' : '-'}{transaction.amount} COFFEE
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(transaction.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTokens = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Token Yönetimi</h2>
        <Button onClick={handleCreateToken}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Token Oluştur
        </Button>
      </div>

      <div className="grid gap-6">
        {tokens.map((token) => (
          <Card key={token.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{token.name}</h3>
                  <p className="text-gray-600">{token.symbol}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  Görüntüle
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-1" />
                  Ayarlar
                </Button>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{token.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Toplam Arz</p>
                <p className="font-semibold">{formatNumber(token.totalSupply)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dağıtılan</p>
                <p className="font-semibold">{formatNumber(token.issued)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kullanılan</p>
                <p className="font-semibold">{formatNumber(token.redeemed)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kazanç Oranı</p>
                <p className="font-semibold">{token.rate}x per $1</p>
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <Button onClick={handleDistributeTokens} className="flex-1">
                Token Dağıt
              </Button>
              <Button variant="outline" className="flex-1">
                Ödül Oluştur
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Müşteri Yönetimi</h2>
      <Card className="p-6">
        <p className="text-center text-gray-500">Müşteri yönetimi yakında geliyor...</p>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Analitikler</h2>
      <Card className="p-6">
        <p className="text-center text-gray-500">Detaylı analitikler yakında geliyor...</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">İşletme Paneli</h1>
          <p className="text-gray-600">Sadakat programınızı yönetin ve müşteri etkileşimlerini takip edin</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
              { id: 'tokens', label: 'Token Yönetimi', icon: Coins },
              { id: 'customers', label: 'Müşteriler', icon: Users },
              { id: 'analytics', label: 'Analitikler', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as 'overview' | 'tokens' | 'customers' | 'analytics')}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'tokens' && renderTokens()}
        {selectedTab === 'customers' && renderCustomers()}
        {selectedTab === 'analytics' && renderAnalytics()}

        {/* Modals */}
        {showCreateToken && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold mb-4">Yeni Token Oluştur</h3>
              <p className="text-gray-600 mb-4">Token oluşturma formu yakında geliyor...</p>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowCreateToken(false)} className="flex-1">
                  İptal
                </Button>
                <Button onClick={() => setShowCreateToken(false)} className="flex-1">
                  Oluştur
                </Button>
              </div>
            </Card>
          </div>
        )}

        {showDistributeTokens && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold mb-4">Token Dağıt</h3>
              <p className="text-gray-600 mb-4">Token dağıtım formu yakında geliyor...</p>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowDistributeTokens(false)} className="flex-1">
                  İptal
                </Button>
                <Button onClick={() => setShowDistributeTokens(false)} className="flex-1">
                  Gönder
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;
