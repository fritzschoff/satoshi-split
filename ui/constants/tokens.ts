import { SUPPORTED_TOKENS } from '@avail-project/nexus-widgets';

export const TOKEN_SYMBOLS: Record<string, string> = {
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': 'USDC',
  '0x0000000000000000000000000000000000000000': 'ETH',
};

export const TOKEN_DECIMALS: Record<string, number> = {
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': 6,
  '0x0000000000000000000000000000000000000000': 18,
};

export const SUPPORTED_TOKENS_BY_SYMBOL = ['USDC', 'ETH'] as SUPPORTED_TOKENS[];
export const SUPPORTED_CHAINS = [8453, 11155111, 80002, 11155420, 421614];

export const getUSDCTokenAddress = (chainId: number) => {
  switch (chainId) {
    case 84532:
      return '0x036cbd53842c5426634e7929541ec2318f3dcf7e';
    case 11155111:
      return '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238';
    case 80002:
      return '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582';
    case 11155420:
      return '0x5fd84259d66cd46123540766be93dfe6d43130d7';
    case 421614:
      return '0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d';
    case 10143:
      return '0xf817257fed379853cde0fa4f97ab987181b1e5ea';
    default:
      return null;
  }
};

export const getUSDTTokenAddress = (chainId: number) => {
  switch (chainId) {
    case 11155420:
      return '0x6462693c2f21ac0e517f12641d404895030f7426';
    case 421614:
      return '0xf954d4a5859b37de88a91bdbb8ad309056fb04b1';
    case 10143:
      return '0x1c56f176d6735888fbb6f8bd9adad8ad7a023a0b';
    default:
      return null;
  }
};
