# Escrow Smart Contract Deployment Guide

## 🚀 Contract Deployment Steps

### 1. Prerequisites

```bash
# Install Soroban CLI
cargo install --locked soroban-cli --features opt

# Configure network
soroban network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Create identity
soroban keys generate --global alice --network testnet
```

### 2. Build Contract

```bash
cd contracts/escrow
cargo build --target wasm32-unknown-unknown --release
```

### 3. Deploy Contract

```bash
# Deploy to testnet
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow_contract.wasm \
  --source alice \
  --network testnet)

echo "Contract deployed with ID: $CONTRACT_ID"
```

### 4. Initialize Contract

```bash
# Get admin address
ADMIN_ADDRESS=$(soroban keys address alice)

# Initialize contract
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- initialize \
  --admin $ADMIN_ADDRESS
```

### 5. Update Frontend Configuration

```typescript
// In sorobanEscrowService.ts, update:
this.contractId = 'YOUR_DEPLOYED_CONTRACT_ID_HERE';
```

## 🔧 Local Development Setup

### 1. Start Local Network

```bash
# Start Stellar Quickstart (local network)
docker run --rm -it \
  -p 8000:8000 \
  -p 11626:11626 \
  -p 11625:11625 \
  --name stellar \
  stellar/quickstart:latest \
  --testnet \
  --enable-soroban-rpc
```

### 2. Configure Local Network

```bash
soroban network add \
  --global local \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Test SDF Network ; September 2015"

# Create and fund test account
soroban keys generate --global test-account --network local
soroban keys fund test-account --network local
```

### 3. Deploy to Local

```bash
# Deploy to local network
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow_contract.wasm \
  --source test-account \
  --network local)

# Initialize
ADMIN_ADDRESS=$(soroban keys address test-account)
soroban contract invoke \
  --id $CONTRACT_ID \
  --source test-account \
  --network local \
  -- initialize \
  --admin $ADMIN_ADDRESS
```

## 🧪 Testing Contract Functions

### Create Escrow

```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- create_escrow \
  --job_id "job_123" \
  --employer "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
  --amount "1000000000" \
  --token "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
  --deadline null
```

### Assign Freelancer

```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- assign_freelancer \
  --job_id "job_123" \
  --freelancer "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### Release Escrow

```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- release_escrow \
  --job_id "job_123"
```

### Get Escrow Data

```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- get_escrow \
  --job_id "job_123"
```

## 📋 Environment Variables

Add to your `.env` file:

```env
# Contract IDs
VITE_ESCROW_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Token Contract IDs
VITE_XLM_TOKEN_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_USDC_TOKEN_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Network Configuration
VITE_STELLAR_NETWORK=testnet
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org:443
```

## 🔍 Verification

### Check Contract Status

```bash
# Get contract info
soroban contract info --id $CONTRACT_ID --network testnet

# Check contract code
soroban contract code --id $CONTRACT_ID --network testnet
```

### Monitor Events

```bash
# Watch for contract events
soroban events --start-ledger latest --id $CONTRACT_ID --network testnet
```

## 🛡️ Security Considerations

1. **Multi-signature**: Implement multi-sig for admin functions
2. **Time locks**: Add deadline enforcement
3. **Balance checks**: Validate sufficient funds before operations
4. **Reentrancy protection**: Ensure atomic operations
5. **Access control**: Verify caller permissions

## 📚 Additional Resources

- [Soroban Documentation](https://soroban.stellar.org/)
- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Smart Contract Best Practices](https://soroban.stellar.org/docs/learn/best-practices)

## 🐛 Troubleshooting

### Common Issues

1. **Contract not found**: Ensure contract is deployed and ID is correct
2. **Insufficient balance**: Fund accounts before transactions
3. **Authorization failed**: Check signing keys and permissions
4. **Network mismatch**: Verify network configuration

### Debug Commands

```bash
# Check account balance
soroban keys fund alice --network testnet

# Verify network connection
soroban network ls

# Test contract simulation
soroban contract invoke --id $CONTRACT_ID --source alice --network testnet -- get_escrow --job_id "test"
```
