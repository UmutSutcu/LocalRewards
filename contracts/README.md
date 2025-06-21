# Stellar Local Rewards - Smart Contracts

This directory contains the Soroban smart contracts for the Stellar Local Rewards platform.

## Contracts

### 1. Token Contract (`token/`)
- **Purpose**: ERC-20 like token implementation for loyalty rewards
- **Functions**: 
  - `mint(to: Address, amount: i128)` - Mint new tokens
  - `burn(from: Address, amount: i128)` - Burn tokens
  - `transfer(from: Address, to: Address, amount: i128)` - Transfer tokens
  - `balance(address: Address)` - Get token balance
  - `total_supply()` - Get total token supply

### 2. Loyalty Contract (`loyalty/`)
- **Purpose**: Manages loyalty program rules and token distribution
- **Functions**:
  - `earn_tokens(customer: Address, business: Address, amount: i128)` - Award loyalty tokens
  - `redeem_tokens(customer: Address, business: Address, amount: i128)` - Redeem tokens for rewards
  - `set_earn_rate(business: Address, rate: i128)` - Set token earning rate

### 3. Donation Contract (`donation/`)
- **Purpose**: Handles community project donations
- **Functions**:
  - `donate(donor: Address, project: Address, amount: i128)` - Make a donation
  - `get_donations(project: Address)` - Get total donations for a project
  - `register_project(project: Address, target: i128)` - Register new community project

## Development

### Prerequisites
- Rust and Cargo
- Soroban CLI
- Stellar CLI

### Build and Deploy

1. **Build contracts:**
   ```bash
   cd contracts
   soroban contract build
   ```

2. **Deploy to testnet:**
   ```bash
   soroban contract deploy \
     --wasm target/wasm32-unknown-unknown/release/[contract_name].wasm \
     --source alice \
     --network testnet
   ```

3. **Initialize contracts:**
   ```bash
   soroban contract invoke \
     --id [CONTRACT_ID] \
     --source alice \
     --network testnet \
     -- initialize --admin [ADMIN_ADDRESS]
   ```

### Testing

Run contract tests:
```bash
cargo test
```

## Configuration

Update the contract addresses in `../src/services/stellarService.ts` after deployment.

## Security Notes

- All contracts implement proper authorization checks
- Input validation is performed on all parameters
- Reentrancy protection is implemented where necessary
- Admin functions are properly secured
