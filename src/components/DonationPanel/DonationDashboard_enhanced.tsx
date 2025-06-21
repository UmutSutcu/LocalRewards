import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Target, 
  TrendingUp, 
  Calendar, 
  Users, 
  DollarSign,
  Search,
  MapPin
} from 'lucide-react';
import Card from '../Shared/Card';
import Button from '../Shared/Button';
import WalletConnection from '../Shared/WalletConnection';
import { LoadingSpinner } from '../Shared/Loading';
import { formatCurrency } from '../../utils';
import { useWalletRequired } from '@/hooks/useWalletRequired';

interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  endDate: string;
  category: string;
  organizerName: string;
  organizerAddress: string;
  isActive: boolean;
  image?: string;
  location?: string;
  donorCount: number;
  urgencyLevel: 'low' | 'medium' | 'high';
}

interface DonationRecord {
  id: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  timestamp: string;
  txHash: string;
  isAnonymous: boolean;
  status: 'completed' | 'pending' | 'failed';
}

export const DonationDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'campaigns' | 'my-donations' | 'analytics'>('campaigns');
  const { requireWalletWithModal } = useWalletRequired();

  // Mock data
  useEffect(() => {
    const mockCampaigns: DonationCampaign[] = [
      {
        id: '1',
        title: 'Çocuklar İçin Eğitim Yardımı',
        description: 'Maddi durumu iyi olmayan çocukların eğitim masraflarını karşılamaya yardımcı olun. Her bağış bir çocuğun geleceğini aydınlatıyor.',
        targetAmount: 50000,
        currentAmount: 32500,
        endDate: '2024-12-31',
        category: 'Eğitim',
        organizerName: 'Eğitim Derneği',
        organizerAddress: 'GBXXX...XXXX',
        isActive: true,
        image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=400',
        location: 'İstanbul',
        donorCount: 245,
        urgencyLevel: 'high'
      },
      {
        id: '2',
        title: 'Sokak Hayvanları Yardımı',
        description: 'Sokak hayvanlarının beslenme ve tedavi masrafları için bağış kampanyası. Onların sağlıklı yaşaması için desteğinizi bekliyoruz.',
        targetAmount: 25000,
        currentAmount: 18750,
        endDate: '2024-11-30',
        category: 'Hayvan Hakları',
        organizerName: 'Hayvan Severler Derneği',
        organizerAddress: 'GCYYY...YYYY',
        isActive: true,
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
        location: 'Ankara',
        donorCount: 178,
        urgencyLevel: 'medium'
      },
      {
        id: '3',
        title: 'Yaşlılar İçin Sıcak Yemek',
        description: 'Yalnız yaşayan yaşlı vatandaşlar için günlük sıcak yemek hizmeti. Onlara sıcak bir öğün ve sevgi ulaştıralım.',
        targetAmount: 75000,
        currentAmount: 45000,
        endDate: '2025-01-15',
        category: 'Sosyal Yardım',
        organizerName: 'Sosyal Dayanışma Vakfı',
        organizerAddress: 'GDZZZ...ZZZZ',
        isActive: true,
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        location: 'İzmir',
        donorCount: 312,
        urgencyLevel: 'low'
      }
    ];

    const mockDonations: DonationRecord[] = [
      {
        id: '1',
        campaignId: '1',
        campaignTitle: 'Çocuklar İçin Eğitim Yardımı',
        amount: 500,
        timestamp: '2024-01-15T10:30:00Z',
        txHash: '0xabc123...',
        isAnonymous: false,
        status: 'completed'
      },
      {
        id: '2',
        campaignId: '2',
        campaignTitle: 'Sokak Hayvanları Yardımı',
        amount: 250,
        timestamp: '2024-01-10T15:45:00Z',
        txHash: '0xdef456...',
        isAnonymous: true,
        status: 'completed'
      }
    ];

    setTimeout(() => {
      setCampaigns(mockCampaigns);
      setDonations(mockDonations);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = ['all', 'Eğitim', 'Hayvan Hakları', 'Sosyal Yardım', 'Acil Durum', 'Sağlık'];

  const handleDonate = async () => {
    if (!selectedCampaign || !donationAmount) return;

    if (!requireWalletWithModal()) {
      return;
    }

    setIsDonating(true);
    try {
      // Simulate donation transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDonation: DonationRecord = {
        id: Date.now().toString(),
        campaignId: selectedCampaign.id,
        campaignTitle: selectedCampaign.title,
        amount: parseFloat(donationAmount),
        timestamp: new Date().toISOString(),
        txHash: '0x' + Math.random().toString(16).substr(2, 8) + '...',
        isAnonymous,
        status: 'completed'
      };

      setDonations(prev => [newDonation, ...prev]);
      
      // Update campaign amount
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === selectedCampaign.id 
          ? { 
              ...campaign, 
              currentAmount: campaign.currentAmount + parseFloat(donationAmount),
              donorCount: campaign.donorCount + 1
            }
          : campaign
      ));

      setSelectedCampaign(null);
      setDonationAmount('');
      setIsAnonymous(false);
      
    } catch (error) {
      console.error('Donation failed:', error);
    } finally {
      setIsDonating(false);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.organizerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || campaign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalDonated = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const totalCampaignsSupported = new Set(donations.map(d => d.campaignId)).size;

  const renderCampaigns = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Kampanya ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'Tüm Kategoriler' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Aktif Kampanya</p>
              <p className="text-3xl font-bold">{campaigns.filter(c => c.isActive).length}</p>
            </div>
            <Target className="w-8 h-8 text-white/80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Toplam Bağışçı</p>
              <p className="text-3xl font-bold">{campaigns.reduce((sum, c) => sum + c.donorCount, 0)}</p>
            </div>
            <Users className="w-8 h-8 text-white/80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Toplanan Miktar</p>
              <p className="text-3xl font-bold">{formatCurrency(campaigns.reduce((sum, c) => sum + c.currentAmount, 0))}</p>
            </div>
            <DollarSign className="w-8 h-8 text-white/80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Hedef Miktar</p>
              <p className="text-3xl font-bold">{formatCurrency(campaigns.reduce((sum, c) => sum + c.targetAmount, 0))}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-white/80" />
          </div>
        </Card>
      </div>

      {/* Campaigns Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {campaign.image && (
              <div className="relative">
                <img 
                  src={campaign.image} 
                  alt={campaign.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(campaign.urgencyLevel)}`}>
                    {campaign.urgencyLevel === 'high' ? 'Acil' : 
                     campaign.urgencyLevel === 'medium' ? 'Orta' : 'Düşük'} Öncelik
                  </span>
                </div>
              </div>
            )}
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{campaign.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3">{campaign.description}</p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{campaign.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{campaign.donorCount} bağışçı</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Toplanan</span>
                  <span className="font-semibold">{formatCurrency(campaign.currentAmount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(campaign.currentAmount, campaign.targetAmount)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hedef: {formatCurrency(campaign.targetAmount)}</span>
                  <span className="font-semibold text-primary-600">
                    %{getProgressPercentage(campaign.currentAmount, campaign.targetAmount).toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Düzenleyen: {campaign.organizerName}</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(campaign.endDate).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>

              <Button 
                onClick={() => {
                  if (requireWalletWithModal()) {
                    setSelectedCampaign(campaign);
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                <Heart className="w-4 h-4 mr-2" />
                Bağış Yap
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Kampanya Bulunamadı</h3>
          <p className="text-gray-500">Arama kriterlerinize uygun kampanya bulunmuyor.</p>
        </Card>
      )}
    </div>
  );

  const renderMyDonations = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Toplam Bağış</p>
              <p className="text-3xl font-bold">{formatCurrency(totalDonated)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-white/80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Desteklenen Kampanya</p>
              <p className="text-3xl font-bold">{totalCampaignsSupported}</p>
            </div>
            <Target className="w-8 h-8 text-white/80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Bağış Sayısı</p>
              <p className="text-3xl font-bold">{donations.length}</p>
            </div>
            <Heart className="w-8 h-8 text-white/80" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-6">Bağış Geçmişim</h3>
          {donations.length > 0 ? (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div key={donation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{donation.campaignTitle}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{new Date(donation.timestamp).toLocaleDateString('tr-TR')}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {donation.status === 'completed' ? 'Tamamlandı' :
                           donation.status === 'pending' ? 'Bekliyor' : 'Başarısız'}
                        </span>
                        {donation.isAnonymous && (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                            Anonim
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-purple-600">
                      {formatCurrency(donation.amount)}
                    </div>
                    <button
                      onClick={() => window.open(`https://stellar.expert/explorer/testnet/tx/${donation.txHash}`, '_blank')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      İşlemi Görüntüle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">Henüz bağış yapmadınız</h4>
              <p className="text-gray-500 mb-4">İlk bağışınızı yaparak bir kampanyaya destek olun!</p>
              <Button onClick={() => setSelectedTab('campaigns')}>
                Kampanyaları Keşfet
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Bağış Analitikleri</h3>
        <p className="text-center text-gray-500 py-8">
          Detaylı analitikler yakında geliyor...
        </p>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bağış Platformu</h1>
          <p className="text-gray-600">Değerli amaçları destekleyin ve topluma katkıda bulunun</p>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnection 
            publicKey={walletAddress} 
            onConnect={setWalletAddress} 
          />
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'campaigns', label: 'Kampanyalar', icon: Target },
              { id: 'my-donations', label: 'Bağışlarım', icon: Heart },
              { id: 'analytics', label: 'Analitikler', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
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
        {selectedTab === 'campaigns' && renderCampaigns()}
        {selectedTab === 'my-donations' && renderMyDonations()}
        {selectedTab === 'analytics' && renderAnalytics()}

        {/* Donation Modal */}
        {selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">Bağış Yap</h3>
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">{selectedCampaign.title}</h4>
                    <p className="text-sm text-gray-600">{selectedCampaign.organizerName}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Bağış Miktarı (TL)
                    </label>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-700">
                      Anonim bağış yap
                    </label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Kampanya:</span>
                      <span>{selectedCampaign.title}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Bağış Miktarı:</span>
                      <span className="font-medium">{donationAmount ? formatCurrency(parseFloat(donationAmount)) : '0 TL'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>İşlem Ücreti:</span>
                      <span>~0.01 XLM</span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCampaign(null)}
                      className="flex-1"
                      disabled={isDonating}
                    >
                      İptal
                    </Button>
                    <Button
                      onClick={handleDonate}
                      disabled={!donationAmount || isDonating}
                      className="flex-1"
                    >
                      {isDonating ? (
                        <div className="flex items-center space-x-2">
                          <LoadingSpinner />
                          <span>Gönderiliyor...</span>
                        </div>
                      ) : (
                        'Bağış Yap'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationDashboard;
