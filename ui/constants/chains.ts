import { SUPPORTED_CHAINS } from './tokens';

export const CHAIN_NAMES: Record<(typeof SUPPORTED_CHAINS)[number], string> = {
  11155111: 'Sepolia',
  11155420: 'OP Sepolia',
  421614: 'Arbitrum Sepolia',
  84532: 'Base Sepolia',
};
