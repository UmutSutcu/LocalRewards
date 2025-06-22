# 💼 Starnance

**Stellar blockchain-based P2P freelance marketplace with escrow & reputation system**

🌐 **[Live Demo](https://starnance.vercel.app)** 

[![Stellar](https://img.shields.io/badge/Built%20on-Stellar-black?style=flat&logo=stellar)](https://stellar.org/)
[![React](https://img.shields.io/badge/Frontend-React-blue?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Soroban](https://img.shields.io/badge/Smart%20Contracts-Soroban-purple?style=flat)](https://soroban.stellar.org/)

## 🎯 Overview

Starnance is a decentralized peer-to-peer freelance marketplace built on Stellar blockchain. It features secure escrow payments, soulbound reputation tokens (SBT), and transparent project management - all powered by Soroban smart contracts.

### ✨ Key Features

- 🔐 **Wallet Integration** - Freighter wallet connection for secure transactions
- 💼 **Employer Dashboard** - Post jobs, manage projects, and hire talent with escrow protection  
- 👨‍💻 **Freelancer Portal** - Browse jobs, build reputation, and get paid securely
- 🔒 **Smart Contract Escrow** - Automated payment protection for both parties
- ⭐ **Soulbound Reputation Tokens** - Non-transferable tokens that build freelancer credibility
- 💰 **Native XLM Payments** - Fast and low-cost transactions on Stellar network
- 🎯 **Dispute Resolution** - Built-in arbitration system for project conflicts

### 🏗️ Technical Architecture

**Frontend:**
- React 18 + TypeScript + Vite
- TailwindCSS for modern UI
- Lucide React for icons
- Stellar SDK for blockchain integration

**Blockchain:**
- Stellar network (Testnet/Mainnet)
- Soroban smart contracts for escrow and reputation
- Freighter wallet integration
- Native XLM payments

**Smart Contracts:**
- **Escrow Contract**: Secure fund locking and release mechanisms
- **Reputation Contract**: Soulbound token minting for freelancer credibility
- **Dispute Contract**: Decentralized arbitration system

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Freighter browser wallet
- Stellar testnet account with XLM

### Installation

1. **Clone the repository**   ```bash
   git clone https://github.com/yourusername/starnance.git
   cd starnance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Smart Contract Setup

1. **Deploy contracts**
   ```bash
   cd contracts
   npm install
   npm run deploy
   ```

2. **Configure contract addresses**
   Update contract addresses in `src/services/stellarService.ts`

## 📱 Usage

### For Employers

1. **Connect Wallet** - Link your Freighter wallet
2. **Post Jobs** - Create detailed job listings with budget and requirements
3. **Review Applications** - Evaluate freelancer proposals and portfolios
4. **Start Escrow** - Lock funds in smart contract when hiring
5. **Release Payment** - Approve completed work to release funds automatically
6. **Rate Freelancer** - Mint reputation tokens based on performance

### For Freelancers

1. **Connect Wallet** - Link your Freighter wallet
2. **Browse Jobs** - Search and filter available opportunities
3. **Submit Proposals** - Apply to jobs with custom proposals
4. **Complete Work** - Deliver projects according to requirements
5. **Get Paid** - Receive automatic payments through escrow
6. **Build Reputation** - Earn soulbound tokens for successful completions

## 🛠️ Development

### Project Structure

```
src/
├── components/          # React components
│   ├── EmployerPanel/   # Employer-specific components
│   ├── FreelancerPanel/ # Freelancer-specific components
│   └── Shared/          # Reusable UI components
├── contexts/            # React contexts (Wallet, etc.)
├── hooks/               # Custom React hooks
├── services/            # API and blockchain services
├── types/               # TypeScript type definitions
└── utils/               # Helper functions

contracts/
├── escrow/              # Escrow smart contract
├── reputation/          # Reputation SBT contract
└── dispute/             # Dispute resolution contract
```

### Key Components

- **EmployerDashboard**: Job posting, applicant management, escrow controls
- **FreelancerDashboard**: Job browsing, application tracking, reputation display
- **EscrowContract**: Secure fund management with automatic release
- **ReputationSystem**: SBT minting and reputation tracking

### Environment Variables

Create `.env.local`:

```env
VITE_STELLAR_NETWORK=testnet
VITE_ESCROW_CONTRACT_ID=your_escrow_contract_id
VITE_REPUTATION_CONTRACT_ID=your_reputation_contract_id
VITE_DISPUTE_CONTRACT_ID=your_dispute_contract_id
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔮 Roadmap

- [ ] **MVP Features**
  - [x] Basic job posting and browsing
  - [x] Wallet integration and user profiles
  - [ ] Escrow contract implementation
  - [ ] Reputation token minting
  - [ ] Application and hiring flow

- [ ] **Advanced Features**
  - [ ] Dispute resolution system
  - [ ] Advanced freelancer filtering
  - [ ] Multi-milestone projects
  - [ ] Team collaboration features
  - [ ] Mobile app development

- [ ] **Integration & Scaling**
  - [ ] Backend API for metadata
  - [ ] IPFS for file storage
  - [ ] Multi-chain support
  - [ ] Advanced analytics dashboard

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Stellar Development Foundation for blockchain infrastructure
- Soroban team for smart contract platform
- React and TypeScript communities
- Hackathon organizers and participants

## 📞 Support

- 📧 Email: support@starnance.com
- 💬 Discord: [Join our community](https://discord.gg/starnance)
- 🐦 Twitter: [@Starnance](https://twitter.com/starnance)
- 📖 Docs: [Documentation](https://docs.starnance.com)

---

**Built with ❤️ for the Stellar ecosystem**
