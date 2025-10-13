# SatoshiSplit 💸

> Cross-chain expense splitting with unified balances

SatoshiSplit is a decentralized expense-splitting application that brings the convenience of Splitwise to the blockchain. Split expenses with friends across multiple chains, track debts transparently, and settle payments using Avail Nexus SDK for seamless cross-chain token bridging.

## ✨ Features

- 🌐 **Multi-Chain Support**: Works across Sepolia, Optimism, Base, Arbitrum, Polygon zkEVM, and Avalanche testnets
- 💰 **Multi-Token Support**: Split expenses in ETH, USDC, or USDT
- 🔄 **Cross-Chain Bridging**: Use Avail Nexus SDK to bridge tokens from any supported chain
- 📊 **Real-Time Indexing**: Envio tracks all events across chains for comprehensive activity dashboards
- 🔐 **Secure & Transparent**: Smart contracts ensure all debts and payments are recorded on-chain
- ⚡ **Modern Stack**: Built with Hardhat 3, Next.js 15, and RainbowKit

## 🏗️ Architecture

```
📱 Frontend (Next.js + RainbowKit + Nexus SDK)
    ↓
⚡ Smart Contracts (Sepolia + other testnets)
    ↓
📊 Envio Indexer (Multi-chain event indexing)
    ↓
💾 GraphQL API
    ↓
🎯 Dashboard & Analytics
```

## 🚀 Quick Start

### Prerequisites

- Node.js v22+
- pnpm (recommended) or npm
- MetaMask or another Web3 wallet

### Clone the Repository

```bash
git clone https://github.com/yourusername/satoshi-split.git
cd satoshi-split
```

### Setup Smart Contracts

```bash
cd hardhat
npm install

# Run tests
npx hardhat test

# Build contracts
npx hardhat build
```

### Setup Indexer

```bash
cd envio
pnpm install

# Generate types
pnpm codegen

# Run locally
pnpm dev
```

### Setup Frontend

```bash
cd ui
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

Visit `http://localhost:3000` 🎉

## 📖 Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Complete deployment instructions
- **[Plan Document](../plan.md)** - Detailed implementation plan and architecture
- **[Smart Contracts](./hardhat/contracts/)** - SplitManager.sol and tests
- **[Envio Config](./envio/config.yaml)** - Multi-chain indexer configuration
- **[Frontend](./ui/)** - Next.js application with RainbowKit

## 🧪 Testing

### Smart Contract Tests

```bash
cd hardhat

# Run Solidity tests
npx hardhat test solidity

# Run TypeScript tests
npx hardhat test nodejs

# Run all tests
npx hardhat test
```

**Test Coverage:**

- ✅ 16 Solidity tests (including fuzz tests)
- ✅ 6 TypeScript integration tests
- ✅ Complete end-to-end flows
- ✅ Edge cases and error conditions

## 🛠️ Tech Stack

### Smart Contracts

- **Hardhat 3** - Development environment
- **Solidity 0.8.28** - Smart contract language
- **OpenZeppelin** - Secure contract libraries
- **Viem** - TypeScript Ethereum library

### Indexing

- **Envio** - Multi-chain event indexer
- **GraphQL** - Query language for indexed data

### Frontend

- **Next.js 15** - React framework with SSR
- **RainbowKit** - Wallet connection UI
- **Wagmi** - React hooks for Ethereum
- **Avail Nexus SDK** - Cross-chain token bridging
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## 📝 Smart Contract Functions

### Core Functions

- `createSplit(address[] initialMembers, address defaultToken)` - Create a new split group
- `addMember(uint256 splitId, address member)` - Add member (creator only)
- `removeMember(uint256 splitId, address member)` - Remove member (creator only)
- `addSpending(uint256 splitId, string title, uint256 amount, address[] forWho)` - Record expense
- `payDebt(uint256 splitId, address creditor, uint256 amount)` - Settle debt

### View Functions

- `getSplitDetails(uint256 splitId)` - Get complete split information
- `getSpendings(uint256 splitId)` - Get all expenses
- `getDebt(uint256 splitId, address debtor, address creditor)` - Get specific debt
- `getDebtorDebts(uint256 splitId, address debtor)` - Get all debts for a user

## 🎯 Use Cases

1. **Group Dinners** - Split restaurant bills among friends
2. **Roommate Expenses** - Track shared apartment costs
3. **Travel Expenses** - Manage group trip spending
4. **Event Costs** - Split event organization expenses
5. **Any Shared Costs** - Track and settle any group expenses

## 🌍 Supported Networks

### Testnets

- Sepolia (Primary deployment)
- Optimism Sepolia
- Base Sepolia
- Arbitrum Sepolia
- Polygon zkEVM Cardona
- Avalanche Fuji

### Tokens

- ETH (Native)
- USDC
- USDT

_All supported via Avail Nexus SDK for cross-chain bridging_

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Hardhat Team** - For the excellent development framework
- **Envio** - For powerful multi-chain indexing
- **Avail Project** - For the Nexus SDK enabling cross-chain functionality
- **RainbowKit** - For beautiful wallet connection UX
- **OpenZeppelin** - For secure smart contract libraries

## 📧 Contact

For questions or demo requests, please open an issue in this repository.

---

**Built for [Hackathon Name]** 🚀

_Bringing decentralized expense splitting to the masses!_
