# Starnance - Smart Contracts

This directory contains the Soroban smart contracts for the Starnance platform.

## Contracts Overview

### 1. Escrow Contract (`escrow/`)
**Purpose**: Secure fund management for freelance projects

**Key Functions:**
- `create_escrow(job_id, employer, freelancer, amount, currency)` - Lock funds for a job
- `release_funds(job_id, employer)` - Release funds to freelancer upon completion
- `cancel_escrow(job_id, employer)` - Cancel and refund if job hasn't started
- `get_escrow_status(job_id)` - Check current status of escrow

**States:**
- `locked` - Funds are secured in escrow
- `released` - Funds transferred to freelancer
- `cancelled` - Funds returned to employer
- `disputed` - Under dispute resolution

### 2. Reputation Contract (`reputation/`)
**Purpose**: Soulbound Token (SBT) system for freelancer reputation

**Key Functions:**
- `mint_reputation(freelancer, job_id, rating, skill_tags)` - Mint SBT after job completion
- `get_reputation_tokens(freelancer)` - Get all reputation tokens for a freelancer
- `calculate_reputation_score(freelancer)` - Calculate overall reputation score
- `is_token_transferable(token_id)` - Always returns false (soulbound)

**Token Metadata:**
- Job ID and title
- Employer address
- Rating (1-5 stars)
- Skill tags
- Completion date
- Review text (optional)

### 3. Dispute Contract (`dispute/`)
**Purpose**: Decentralized arbitration for project conflicts

**Key Functions:**
- `initialize_dispute(job_id, reason, description, initiator)` - Start dispute process
- `submit_evidence(dispute_id, evidence_hash, submitter)` - Submit dispute evidence
- `vote_resolution(dispute_id, resolution, arbitrator)` - Arbitrator voting
- `execute_resolution(dispute_id)` - Execute final dispute resolution

**Resolution Types:**
- `favor_employer` - Full refund to employer
- `favor_freelancer` - Full payment to freelancer
- `partial_refund` - Split payment based on work completed

## Development Setup

### Prerequisites
- Rust and Cargo
- Soroban CLI
- Stellar CLI

### Installation

1. **Install Soroban CLI**
   ```bash
   cargo install --locked soroban-cli
   ```

2. **Install dependencies**
   ```bash
   cd contracts
   cargo build
   ```

3. **Deploy to testnet**
   ```bash
   # Configure network
   soroban config network add testnet \
     --rpc-url https://soroban-testnet.stellar.org \
     --network-passphrase "Test SDF Network ; September 2015"

   # Deploy contracts
   ./deploy.sh
   ```

## Contract Interactions

### Escrow Flow
1. Employer posts job and selects freelancer
2. Employer calls `create_escrow()` with job details and payment amount
3. Funds are locked in the escrow contract
4. Freelancer completes work and submits deliverables
5. Employer reviews and calls `release_funds()` to pay freelancer
6. Reputation contract automatically mints SBT for freelancer

### Dispute Flow
1. Either party can call `initialize_dispute()` if there's a conflict
2. Both parties submit evidence using `submit_evidence()`
3. Designated arbitrators review and vote on resolution
4. Winning resolution is executed, distributing funds accordingly

### Reputation System
- Reputation tokens are minted only upon successful job completion
- Tokens are non-transferable (soulbound) and permanently linked to freelancer
- Rating and skill tags help employers assess freelancer capabilities
- Reputation score calculated from all completed jobs and ratings

## Contract Security

### Access Controls
- Only designated roles can call specific functions
- Employer must authorize fund release
- Only job participants can initiate disputes
- Arbitrators must be pre-approved

### Safety Mechanisms
- Reentrancy guards on all state-changing functions
- Input validation and sanitization
- Time-locked operations where appropriate
- Emergency pause functionality for critical issues

## Testing

```bash
# Run unit tests
cargo test

# Run integration tests
soroban test

# Test contract deployment
./test-deploy.sh
```

## Contract Addresses (Testnet)

Update these addresses after deployment:

```
ESCROW_CONTRACT: C...
REPUTATION_CONTRACT: C...
DISPUTE_CONTRACT: C...
```

## Gas Optimization

- Use efficient data structures
- Minimize storage operations
- Batch operations where possible
- Optimize for common use cases

## Future Enhancements

- Multi-milestone project support
- Automatic milestone-based payments
- Advanced reputation metrics
- Cross-platform reputation portability
- Integration with other Stellar ecosystem projects

## Contributing

1. Follow Rust coding standards
2. Add comprehensive tests for new features
3. Update documentation for any changes
4. Ensure security best practices

## Security Audits

- [ ] Internal security review
- [ ] External security audit
- [ ] Formal verification (future)

---

For detailed implementation, see individual contract directories.
