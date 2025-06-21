import React, { useState, useEffect } from 'react';
import {
  Heart,
  Target,
  Users,
  TrendingUp,
  DollarSign,
  Search,
  MapPin,
  Clock,
  AlertCircle,
  Star
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
  daysLeft: number;
  featured?: boolean;
}

interface DonationRecord {
  id: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  timestamp: string;
  txHash: string;
  isAnonymous: boolean;
}

interface DonationStats {
  totalDonated: number;
  campaignsSupported: number;
  averageDonation: number;
  impact: string;
}

export const DonationDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);
  const [selectedTab, setSelectedTab] = useState<'discover' | 'my-donations' | 'impact'>('discover');
  const [donationAmount, setDonationAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { requireWalletWithModal } = useWalletRequired();

  const categories = ['all', 'Eğitim', 'Sağlık', 'Çevre', 'Hayvan Hakları', 'Sosyal Yardım', 'Afet Yardımı'];

  // Mock data
  useEffect(() => {
    const mockCampaigns: DonationCampaign[] = [
      {
        id: '1',
        title: 'Çocuklar İçin Eğitim Yardımı',
        description: 'Maddi durumu iyi olmayan çocukların eğitim masraflarını karşılamaya yardımcı olun. Bu kampanya ile okul malzemesi, kitap ve teknoloji desteği sağlayacağız.',
        targetAmount: 50000,
        currentAmount: 32500,
        endDate: '2024-12-31',
        category: 'Eğitim',
        organizerName: 'Eğitim Derneği',
        organizerAddress: 'GBXXX...XXXX',
        isActive: true,
        image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=400',
        location: 'İstanbul, Türkiye',
        donorCount: 245,
        daysLeft: 45,
        featured: true
      },
      {
        id: '2',
        title: 'Sokak Hayvanları Yardımı',
        description: 'Sokak hayvanlarının beslenme ve tedavi masrafları için bağış kampanyası. Veteriner hekimlik hizmetleri ve barınak desteği.',
        targetAmount: 25000,
        currentAmount: 18750,
        endDate: '2024-11-30',
        category: 'Hayvan Hakları',
        organizerName: 'Hayvan Severler Derneği',
        organizerAddress: 'GCYYY...YYYY',
        isActive: true,
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
        location: 'Ankara, Türkiye',
        donorCount: 189,
        daysLeft: 23,
        featured: false
      },
      {
        id: '3',
        title: 'Yaşlılar İçin Sıcak Yemek',
        description: 'Yalnız yaşayan yaşlı vatandaşlar için günlük sıcak yemek hizmeti. Evde bakım desteği ve sosyal aktiviteler.',
        targetAmount: 75000,
        currentAmount: 45000,
        endDate: '2025-01-15',
        category: 'Sosyal Yardım',
        organizerName: 'Sosyal Dayanışma Vakfı',
        organizerAddress: 'GDZZZ...ZZZZ',
        isActive: true,
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        location: 'İzmir, Türkiye',
        donorCount: 356,
        daysLeft: 78,
        featured: true
      },
      {
        id: '4',
        title: 'Çevre Koruma Projesi',
        description: 'Ağaçlandırma ve temizlik çalışmaları için destek. Sürdürülebilir çevre projeleri ve farkındalık çalışmaları.',
        targetAmount: 30000,
        currentAmount: 12000,
        endDate: '2024-12-15',
        category: 'Çevre',
        organizerName: 'Yeşil Dünya Derneği',
        organizerAddress: 'GEAAA...AAAA',
        isActive: true,
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
        location: 'Bursa, Türkiye',
        donorCount: 78,
        daysLeft: 32,
        featured: false
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
        isAnonymous: false
      },
      {
        id: '2',
        campaignId: '2',
        campaignTitle: 'Sokak Hayvanları Yardımı',
        amount: 250,
        timestamp: '2024-01-10T15:45:00Z',
        txHash: '0xdef456...',
        isAnonymous: true
      }
    ];

    setTimeout(() => {
      setCampaigns(mockCampaigns);
      setDonations(mockDonations);
      setLoading(false);
    }, 1000);
  }, []);

  const stats: DonationStats = {
    totalDonated: donations.reduce((sum, d) => sum + d.amount, 0),
    campaignsSupported: [...new Set(donations.map(d => d.campaignId))].length,
    averageDonation: donations.length > 0 ? donations.reduce((sum, d) => sum + d.amount, 0) / donations.length : 0,
    impact: '32 Çocuğa Eğitim Desteği'
  };

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
        isAnonymous
      };

      setDonations(prev => [newDonation, ...prev]);
      
      // Update campaign amount
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === selectedCampaign.id 
          ? { ...campaign, currentAmount: campaign.currentAmount + parseFloat(donationAmount), donorCount: campaign.donorCount + 1 }
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

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.organizerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || campaign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredCampaigns = campaigns.filter(c => c.featured);

  const renderDiscover = () => (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="mb-6">
        <WalletConnection 
          publicKey={walletAddress} 
          onConnect={setWalletAddress} 
        />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Kampanya ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'Tüm Kategoriler' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Featured Campaigns */}
      {featuredCampaigns.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Star className="w-5 h-5 text-yellow-500 mr-2" />
            Öne Çıkan Kampanyalar
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="overflow-hidden">
                <div className="relative">
                  <img 
                    src={campaign.image} 
                    alt={campaign.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Öne Çıkan
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/90 px-2 py-1 rounded text-xs font-medium">
                      {campaign.daysLeft} gün kaldı
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-lg">{campaign.title}</h4>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {campaign.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Toplanan</span>
                        <span className="font-medium">{formatCurrency(campaign.currentAmount)} / {formatCurrency(campaign.targetAmount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                          style={{ width: `${getProgressPercentage(campaign.currentAmount, campaign.targetAmount)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{campaign.donorCount} bağışçı</span>
                      </div>
                      {campaign.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{campaign.location}</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => {
                        if (requireWalletWithModal()) {
                          setSelectedCampaign(campaign);
                        }
                      }}
                      className="w-full"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Bağış Yap
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Campaigns */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Tüm Kampanyalar</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="overflow-hidden">
                <div className="relative">
                  <img 
                    src={campaign.image} 
                    alt={campaign.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 px-2 py-1 rounded text-xs font-medium">
                      {campaign.daysLeft} gün
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-base line-clamp-1">{campaign.title}</h4>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                      {campaign.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{campaign.description}</p>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">%{getProgressPercentage(campaign.currentAmount, campaign.targetAmount).toFixed(0)} tamamlandı</span>
                        <span className="font-medium">{formatCurrency(campaign.currentAmount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full"
                          style={{ width: `${getProgressPercentage(campaign.currentAmount, campaign.targetAmount)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{campaign.donorCount} bağışçı</span>
                      <span>Hedef: {formatCurrency(campaign.targetAmount)}</span>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        if (requireWalletWithModal()) {
                          setSelectedCampaign(campaign);
                        }
                      }}
                      size="sm"
                      className="w-full"
                    >
                      Bağış Yap
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredCampaigns.length === 0 && (
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Kampanya Bulunamadı</h3>
            <p className="text-gray-500">Arama kriterlerinize uygun kampanya bulunmuyor.</p>
          </Card>
        )}
      </div>
    </div>
  );

  const renderMyDonations = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Bağışlarım</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Bağış</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalDonated)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Desteklenen Kampanya</p>
              <p className="text-xl font-bold text-blue-600">{stats.campaignsSupported}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ortalama Bağış</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.averageDonation)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Etki</p>
              <p className="text-sm font-bold text-orange-600">{stats.impact}</p>
            </div>
            <Heart className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Donations History */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Bağış Geçmişi</h3>
          {donations.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Henüz bağış yapmadınız.</p>
              <Button onClick={() => setSelectedTab('discover')} className="mt-4">
                Kampanyaları Keşfet
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{donation.campaignTitle}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(donation.timestamp).toLocaleDateString('tr-TR')}</span>
                        {donation.isAnonymous && (
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs">Anonim</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(donation.amount)}</div>
                    <div className="text-xs text-gray-500">{donation.txHash}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderImpact = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Etki Raporum</h2>
      <Card className="p-6">
        <div className="text-center py-8">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Etki Raporu Yakında</h3>
          <p className="text-gray-500">Bağışlarınızın oluşturduğu etkiyi detaylı olarak görebileceksiniz.</p>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bağış Platformu</h1>
          <p className="text-gray-600">Toplumsal fayda yaratın, sosyal sorumluluk projelerini destekleyin</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'discover', label: 'Kampanyalar', icon: Search },
              { id: 'my-donations', label: 'Bağışlarım', icon: Heart },
              { id: 'impact', label: 'Etki', icon: TrendingUp },
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
        {selectedTab === 'discover' && renderDiscover()}
        {selectedTab === 'my-donations' && renderMyDonations()}
        {selectedTab === 'impact' && renderImpact()}

        {/* Donation Modal */}
        {selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{selectedCampaign.title}</h3>
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <img 
                  src={selectedCampaign.image} 
                  alt={selectedCampaign.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 mb-2">{selectedCampaign.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span>Düzenleyen: {selectedCampaign.organizerName}</span>
                      {selectedCampaign.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{selectedCampaign.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Toplanan: {formatCurrency(selectedCampaign.currentAmount)}</span>
                      <span>Hedef: {formatCurrency(selectedCampaign.targetAmount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                        style={{ width: `${getProgressPercentage(selectedCampaign.currentAmount, selectedCampaign.targetAmount)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{selectedCampaign.donorCount} bağışçı</span>
                      <span>{selectedCampaign.daysLeft} gün kaldı</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bağış Miktarı (TL)
                    </label>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Miktar girin"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-600">
                      Anonim bağış yap
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCampaign(null)}
                      className="flex-1"
                    >
                      İptal
                    </Button>
                    <Button
                      onClick={handleDonate}
                      disabled={!donationAmount || isDonating}
                      className="flex-1"
                    >
                      {isDonating ? (
                        <div className="flex items-center justify-center">
                          <LoadingSpinner />
                          <span className="ml-2">Bağışlanıyor...</span>
                        </div>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Bağış Yap
                        </>
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
