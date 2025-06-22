# Escrow Smart Contract

Bu Soroban smart contract, Starnance platformunda freelance işleri için escrow sistemi sağlar.

## Özellikler

### ✅ Temel Escrow Fonksiyonları
- **create_escrow**: İşveren tarafından iş başlatılırken XLM kilitlenir
- **assign_freelancer**: Kabul edilen freelancer escrow'a atanır
- **release_escrow**: İş tamamlandığında işveren tarafından ödeme serbest bırakılır
- **cancel_escrow**: İş iptal edildiğinde işverene geri ödeme

### 🔒 Güvenlik Önlemleri
- **Multi-signature kontrolleri**: Sadece yetkili taraflar işlem yapabilir
- **Time-lock koruması**: Deadline'dan sonra iptal edilebilir
- **Dispute resolution**: Anlaşmazlık çözüm sistemi
- **Balance kontrolü**: Yetersiz bakiye kontrolü

### 🏛️ Yönetişim
- **Admin rolü**: Anlaşmazlık çözümü için
- **Event emission**: Tüm önemli olaylar kaydedilir
- **Audit trail**: İşlem geçmişi takibi

## Kullanım Akışı

```rust
// 1. İşveren iş oluşturur ve escrow başlatır
escrow_contract.create_escrow(
    job_id,
    employer_address,
    amount,
    token_address,
    deadline
);

// 2. Freelancer kabul edildiğinde escrow'a atanır
escrow_contract.assign_freelancer(
    job_id,
    freelancer_address
);

// 3. İş tamamlandığında işveren ödemeyi serbest bırakır
escrow_contract.release_escrow(job_id);
```

## Güvenlik Özellikleri

### 🛡️ Akıllı Kontrat Güvenliği
- Reentrancy koruması
- Overflow/underflow kontrolü
- Access control (yetkilendirme)
- Input validation (giriş doğrulama)

### 🔐 Multi-Signature Support
- İşveren yetkilendirmesi gerekli
- Freelancer atama kontrolü
- Admin dispute resolution

### ⏰ Time-Lock Mechanism
- Deadline sonrası iptal hakkı
- Otomatik refund koruması
- Grace period implementasyonu

## Error Handling

```rust
pub enum EscrowError {
    EscrowAlreadyExists = 1,
    EscrowNotFound = 2,
    InvalidAmount = 3,
    InvalidStatus = 4,
    FreelancerNotAssigned = 5,
    CannotCancel = 6,
    Unauthorized = 7,
    InsufficientBalance = 8,
}
```

## Events

Kontrat tüm önemli olayları emit eder:
- `escrow.created`: Escrow oluşturuldu
- `escrow.assigned`: Freelancer atandı
- `escrow.released`: Ödeme serbest bırakıldı
- `escrow.cancelled`: Escrow iptal edildi
- `dispute.initiated`: Anlaşmazlık başlatıldı
- `dispute.resolved`: Anlaşmazlık çözüldü

## Deployment

```bash
# Contract'ı build et
soroban contract build

# Testnet'e deploy et
soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/escrow_contract.wasm \
    --source alice \
    --network testnet

# Initialize et
soroban contract invoke \
    --id $CONTRACT_ID \
    --source alice \
    --network testnet \
    -- initialize \
    --admin $ADMIN_ADDRESS
```

## Test

```bash
# Unit testleri çalıştır
cargo test

# Integration testleri
soroban contract test
```
