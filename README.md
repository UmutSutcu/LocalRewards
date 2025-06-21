# 🌟 Stellar Local Rewards

**Modern token-based loyalty program and micro-donation platform built on Stellar blockchain**

[![Stellar](https://img.shields.io/badge/Built%20on-Stellar-black?style=flat&logo=stellar)](https://stellar.org/)
[![React](https://img.shields.io/badge/Frontend-React-blue?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Soroban](https://img.shields.io/badge/Smart%20Contracts-Soroban-purple?style=flat)](https://soroban.stellar.org/)

## 🎯 Overview

Stellar Local Rewards revolutionizes customer loyalty programs by leveraging blockchain technology to create transparent, interoperable, and community-driven reward systems. Built on Stellar's fast and low-cost network with Soroban smart contracts.

### ✨ Key Features

- 🔐 **Passkey Authentication** - Secure, passwordless login using biometric authentication
- 🏪 **Business Dashboard** - Create and manage loyalty tokens, track customer engagement
- 👥 **Customer Portal** - Earn, redeem, and manage loyalty tokens across multiple businesses
- 💝 **Community Donations** - Support local projects with token-based micro-donations
- ⚡ **Gas-Free Transactions** - Launchtube paymaster integration for sponsored transactions
- 🔗 **Stellar Integration** - Built on Stellar network with Soroban smart contracts
- 📱 **Mobile-First Design** - Responsive PWA-ready interface

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Express Backend │    │ Soroban Contracts│
│                 │    │                 │    │                 │
│ • Passkey Auth  │◄──►│ • API Services  │◄──►│ • Token Contract │
│ • Dashboard UI  │    │ • Metadata      │    │ • Loyalty Logic │
│ • Wallet Mgmt   │    │ • Mock POS      │    │ • Donations     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Stellar Network │
                    │                 │
                    │ • Horizon API   │
                    │ • Launchtube    │
                    │ • RPC Endpoint  │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Rust (for smart contracts)
- Soroban CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/stellar-local-rewards.git
   cd stellar-local-rewards
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Frontend
   npm run dev
   
   # Terminal 2 - Backend
   npm run start:backend
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🔧 Development

### Frontend Development

The frontend is built with React, TypeScript, and Vite for optimal development experience.

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

### Smart Contract Development

Smart contracts are written in Rust using the Soroban framework.

```bash
# Navigate to contracts directory
cd contracts

# Build contracts
soroban contract build

# Run tests
cargo test

# Deploy to testnet
./deploy-scripts/deploy.sh
```

### Backend Development

Express.js API server for metadata and demo functionality.

```bash
cd backend

# Start development server
npm run dev

# Start production server
npm start
```

## 📚 User Flows

### For Businesses

1. **Onboarding**
   - Connect with Passkey authentication
   - Set up business profile
   - Create loyalty token

2. **Token Management**
   - Issue tokens to customers
   - Set earning rates and rules
   - Track redemptions and analytics

### For Customers

1. **Getting Started**
   - Connect with Passkey
   - Browse local businesses
   - Join loyalty programs

2. **Earning & Spending**
   - Earn tokens through purchases
   - View token balances
   - Redeem rewards

3. **Community Support**
   - Discover local projects
   - Make token donations
   - Track community impact

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first styling
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons

### Blockchain
- **Stellar Network** - Fast, low-cost blockchain
- **Soroban** - Smart contract platform
- **Stellar SDK** - JavaScript integration
- **Passkey Kit** - Secure authentication
- **Launchtube** - Gas sponsorship

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **CORS** - Cross-origin support
- **Helmet** - Security middleware

## 🔐 Security Features

- **Passkey Authentication** - Biometric security, no passwords
- **Smart Contract Auditing** - Comprehensive input validation
- **HTTPS Enforcement** - Secure communication
- **Rate Limiting** - API protection
- **Input Sanitization** - XSS prevention

## 🌐 Network Configuration

### Testnet (Development)
- **Network**: Stellar Testnet
- **Horizon**: https://horizon-testnet.stellar.org
- **Soroban RPC**: https://soroban-testnet.stellar.org
- **Friendbot**: https://friendbot.stellar.org

### Mainnet (Production)
- **Network**: Stellar Mainnet
- **Horizon**: https://horizon.stellar.org
- **Soroban RPC**: https://soroban-mainnet.stellar.org

## 📈 Roadmap

### Phase 1 - MVP (Current)
- [x] Passkey authentication
- [x] Basic loyalty token system
- [x] Community donation features
- [x] Responsive web interface

### Phase 2 - Enhanced Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-token support
- [ ] Automated token vesting

### Phase 3 - Enterprise
- [ ] POS system integrations
- [ ] White-label solutions
- [ ] Advanced governance features
- [ ] Cross-chain compatibility

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♀️ Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/stellar-local-rewards/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/stellar-local-rewards/discussions)

## 🌟 Acknowledgments

- **Stellar Development Foundation** - For the amazing blockchain platform
- **Soroban Team** - For the smart contract framework
- **Community Contributors** - For their valuable feedback and contributions

---

**Built with ❤️ for the Stellar ecosystem**
