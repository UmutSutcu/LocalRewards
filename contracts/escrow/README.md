# Escrow Smart Contract

This Soroban smart contract provides an escrow system for freelance jobs on the Starnance platform.

## Features

### ✅ Core Escrow Functions
- **create_escrow**: Locks XLM when a job is initiated by the employer
- **assign_freelancer**: Assigns the accepted freelancer to the escrow
- **release_escrow**: Releases the payment by the employer upon job completion
- **cancel_escrow**: Refunds the employer if the job is canceled

### 🔒 Security Measures
- **Multi-signature controls**: Only authorized parties can perform transactions
- **Time-lock protection**: Can be canceled after the deadline
- **Dispute resolution**: Dispute resolution system
- **Balance check**: Insufficient balance check

### 🏛️ Governance
- **Admin role**: For dispute resolution
- **Event emission**: All significant events are recorded
- **Audit trail**: Transaction history tracking

## Usage Flow

```rust
// 1. Employer creates a job and initiates the escrow
escrow_contract.create_escrow(
    job_id,
    employer_address,
    amount,
    token_address,
    deadline
);

// 2. When the freelancer is accepted, they are assigned to the escrow
escrow_contract.assign_freelancer(
    job_id,
    freelancer_address
);

// 3. Employer releases the payment upon job completion
escrow_contract.release_escrow(job_id);
```

## Security Features

### 🛡️ Smart Contract Security
- Reentrancy protection
- Overflow/underflow control
- Access control (authorization)
- Input validation

### 🔐 Multi-Signature Support
- Employer authorization required
- Freelancer assignment control
- Admin dispute resolution

### ⏰ Time-Lock Mechanism
- Right to cancel after the deadline
- Automatic refund protection
- Grace period implementation

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

The contract emits all significant events:
- `escrow.created`: Escrow created
- `escrow.assigned`: Freelancer assigned
- `escrow.released`: Payment released
- `escrow.cancelled`: Escrow canceled
- `dispute.initiated`: Dispute initiated
- `dispute.resolved`: Dispute resolved

## Deployment

```bash
# Build the contract
soroban contract build

# Deploy to testnet
soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/escrow_contract.wasm \
    --source alice \
    --network testnet

# Initialize it
soroban contract invoke \
    --id $CONTRACT_ID \
    --source alice \
    --network testnet \
    -- initialize \
    --admin $ADMIN_ADDRESS
```

## Test

```bash
# Run unit tests
cargo test

# Integration tests
soroban contract test
```
