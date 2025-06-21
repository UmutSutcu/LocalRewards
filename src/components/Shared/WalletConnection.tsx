"use client";
import { useState, useEffect } from "react";
import freighterApi from "@stellar/freighter-api";
import stellarService, { StellarService } from "../../services/stellarService";

interface WalletConnectionProps {
  publicKey: string | null;
  onConnect: (address: string) => void;
}

export default function WalletConnection({ publicKey, onConnect }: WalletConnectionProps) {
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [loadingBalance, setLoadingBalance] = useState(false);

  const handleConnectWallet = async () => {
    setConnecting(true);
    try {
      await freighterApi.requestAccess();
      const address = await freighterApi.getPublicKey();
      onConnect(address);
    } catch (error) {
      console.error("Error connecting to Freighter:", error);
      alert("Cüzdan bağlantısında hata oluştu. Freighter uzantısının yüklü olduğundan emin olun.");
    } finally {
      setConnecting(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  // Bakiye yükleme
  useEffect(() => {
    if (publicKey) {
      loadBalance();
    }
  }, [publicKey]);
  const loadBalance = async () => {
    if (!publicKey) return;
    setLoadingBalance(true);
    try {
      const userBalance = await stellarService.getBalance(publicKey);
      setBalance(userBalance);
    } catch (error) {
      console.error('Bakiye yüklenemedi:', error);
      setBalance('0');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleFundAccount = async () => {
    if (!publicKey) return;
    
    const confirmFund = window.confirm(
      'Testnet hesabınızı 10000 XLM ile fonlamak ister misiniz?\n\n' +
      'Bu işlem sadece test amaçlıdır ve gerçek para değeri yoktur.'
    );
    
    if (!confirmFund) return;    try {
      const result = await StellarService.fundTestAccount(publicKey);
      if (result.success) {
        alert('✅ Hesap başarıyla fonlandı!');
        await loadBalance();
      } else {
        alert('❌ Hesap fonlanamadı');
      }
    } catch (error) {
      alert('❌ Hesap fonlanamadı');
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-2xl">👛</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Stellar Cüzdan</h3>
            {publicKey ? (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-mono text-sm">
                    {truncateAddress(publicKey)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-300 text-sm">💰</span>
                  <span className="text-blue-300 font-mono text-sm">
                    {loadingBalance ? 'Yükleniyor...' : `${parseFloat(balance).toFixed(4)} XLM`}
                  </span>
                  <button
                    onClick={loadBalance}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                    title="Bakiyeyi yenile"
                  >
                    🔄
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-gray-400 text-sm">Bağlı değil</span>
            )}
          </div>
        </div>

        {!publicKey && (
          <button
            onClick={handleConnectWallet}
            disabled={connecting}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                     disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                     text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 
                     transform hover:scale-105 active:scale-95 shadow-lg"
          >
            {connecting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Bağlanıyor...</span>
              </div>
            ) : (
              "Freighter Bağla"
            )}
          </button>
        )}
      </div>

      {publicKey && (
        <div className="mt-4 space-y-3">
          <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✅</span>
              <span className="text-green-400 font-medium">Cüzdan başarıyla bağlandı!</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleFundAccount}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700
                       text-white font-bold py-2 px-4 rounded-xl transition-all duration-200 
                       transform hover:scale-105 active:scale-95 shadow-lg text-sm"
            >
              🚰 Test Hesabını Fonla
            </button>
            
            <button
              onClick={() => window.open(`https://stellar.expert/explorer/testnet/account/${publicKey}`, '_blank')}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700
                       text-white font-bold py-2 px-4 rounded-xl transition-all duration-200 
                       transform hover:scale-105 active:scale-95 shadow-lg text-sm"
            >
              🔍 Hesabı Görüntüle
            </button>
          </div>
          
          <div className="p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <div className="text-center">
              <span className="text-yellow-300 text-sm">
                ⚡ Testnet ağında çalışıyorsunuz
              </span>
              <br />
              <span className="text-yellow-200 text-xs">
                Bu gerçek para değildir, sadece test amaçlıdır
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
