# SatoshiSplit Deployment Guide

This guide will walk you through deploying the complete SatoshiSplit application.

## Prerequisites

- Node.js v22+ installed
- pnpm (recommended) or npm
- A wallet with testnet ETH on Sepolia
- WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

## 1. Smart Contract Deployment

### Setup Environment Variables

Create `/hardhat/.env` (copy from `.env.example`):

```bash
SEPOLIA_RPC_URL=https://rpc.sepolia.org
DEPLOYER_PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

⚠️ **Never commit your private keys!**

**Get Etherscan API Key:**

1. Go to https://etherscan.io/myapikey
2. Sign up or log in
3. Create a new API key
4. Add it to your `.env` file

### Deploy to Sepolia

**Option 1: Deploy and Verify in One Step (Recommended)**

```bash
cd hardhat
npm install
npx hardhat run scripts/deploy-and-verify.ts --network sepolia
```

This script will:

- Deploy the contract using Ignition
- Wait for confirmations
- Automatically verify on Etherscan
- Display all necessary information for next steps

**Option 2: Deploy Then Verify Separately**

Deploy:

```bash
npx hardhat ignition deploy ignition/modules/SplitManager.ts --network sepolia
```

Then verify (after noting the deployed address):

```bash
CONTRACT_ADDRESS=0xYourDeployedAddress npx hardhat run scripts/verify-contract.ts --network sepolia
```

## 2. Envio Indexer Setup

### Update Configuration

Edit `envio/config.yaml` and replace the placeholder addresses with your deployed contract address:

```yaml
networks:
  - id: 11155111 # Sepolia
    start_block: DEPLOYMENT_BLOCK_NUMBER
    contracts:
      - name: SplitManager
        address:
          - 'YOUR_DEPLOYED_CONTRACT_ADDRESS'
```

### Install Dependencies

```bash
cd envio
pnpm install
```

### Generate Types

```bash
pnpm codegen
```

### Run Indexer Locally (Development)

```bash
pnpm dev
```

This will start the indexer and expose a GraphQL endpoint at `http://localhost:8080/v1/graphql`.

### Deploy Indexer (Production)

Follow [Envio's hosting documentation](https://docs.envio.dev/) to deploy your indexer to production.

## 3. Frontend Deployment

### Setup Environment Variables

Create `/ui/.env.local`:

```bash
# WalletConnect Project ID (Get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Envio GraphQL Endpoint
NEXT_PUBLIC_ENVIO_GRAPHQL_URL=http://localhost:8080/v1/graphql

# Deployed SplitManager Contract Address
NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS=0xYourContractAddress

# Optional: Custom RPC (if needed)
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

### Install Dependencies

```bash
cd ui
npm install
```

### Update Token Addresses

Edit `ui/app/create-split/page.tsx` and update the token addresses with actual testnet token addresses:

```typescript
const TOKENS = [
  { name: 'ETH', address: '0x0000000000000000000000000000000000000000' },
  { name: 'USDC', address: '0xYourSepoliaUSDCAddress' }, // Get from Nexus SDK docs
  { name: 'USDT', address: '0xYourSepoliaUSDTAddress' },
];
```

Refer to the [Nexus SDK constants](https://github.com/availproject/nexus-sdk/blob/develop/packages/commons/constants/index.ts) for testnet token addresses.

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app.

### Deploy to Production (Vercel)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set the environment variables in Vercel's dashboard
4. Deploy!

Vercel will automatically handle Next.js SSR and optimize your deployment.

## 4. Testing the Complete Flow

### 1. Get Test Tokens

- Get Sepolia ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Get test USDC/USDT from testnet faucets

### 2. Create a Split

1. Connect your wallet
2. Navigate to "Create Split"
3. Add member addresses (you can use multiple wallets you control)
4. Select default token
5. Submit transaction

### 3. Add an Expense

1. Go to your split's detail page
2. Fill in expense details
3. Select participating members
4. Submit transaction

### 4. Pay Debt

1. View your outstanding debts on the split detail page
2. Click "Pay Debt"
3. Approve token spending (if using ERC20)
4. Submit payment transaction

### 5. Check Dashboard

Visit the dashboard to see:

- Your total spent and received
- Active splits
- Transaction history
- Gas costs

## 5. Multi-Chain Testing (Optional)

To test cross-chain functionality with Nexus SDK:

1. Deploy contracts to multiple testnets (Optimism Sepolia, Base Sepolia, etc.)
2. Update Envio config with all contract addresses
3. Bridge tokens using Nexus SDK hooks in the UI
4. Settle debts cross-chain

## Troubleshooting

### Contract Not Indexed

- Check Envio logs for errors
- Verify the contract address in `config.yaml`
- Ensure the start block is before your deployment

### Transactions Failing

- Check you have enough gas
- Verify contract address in UI environment variables
- Check wallet connection and network

### GraphQL Queries Returning Empty

- Wait a few minutes for Envio to index recent transactions
- Check the Envio GraphQL playground at `/v1/graphql`
- Verify your queries match the schema

## Production Checklist

- [ ] Smart contracts verified on Etherscan
- [ ] Envio indexer deployed and running
- [ ] Frontend deployed with correct environment variables
- [ ] All token addresses updated for production
- [ ] Tested complete user flow
- [ ] Documentation updated with deployed addresses
- [ ] Demo video/screenshots prepared for judges

## Support

For issues or questions:

- Check the [Hardhat docs](https://hardhat.org/docs)
- Check the [Envio docs](https://docs.envio.dev/)
- Check the [Nexus SDK docs](https://docs.availproject.org/nexus)
- Review the code comments in this repository
