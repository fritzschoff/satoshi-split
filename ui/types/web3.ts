export interface Split {
  id: string;
  creator: string;
  members: string[];
  defaultToken: string;
  createdAt: string;
  totalDebt: string;
  spendingCounter?: string;
  spendings: Spending[];
  debts: Debt[];
  isPending?: boolean;
}

export interface Spending {
  id: string;
  spendingId: string;
  title: string;
  payer: string;
  amount: string;
  forWho: string[];
  timestamp: string | 'not found';
  token: string;
  txHash: string;
  chainId: number;
  isPending?: boolean;
}

export interface Debt {
  id: string;
  debtor: string;
  creditor: string;
  amount: string;
  token: string;
  isPaid: boolean;
  paidAt: string | null;
  txHash: string | null;
  isPending?: boolean;
}
export interface UserActivity {
  id: string;
  totalSpentETH: string;
  totalSpentUSD: string;
  totalReceivedETH: string;
  totalReceivedUSD: string;
  totalGasSpent: string;
  transactionCount: number;
  splits: string[];
}
export interface BridgeDepositSource {
  chainId: number;
  tokenAddress: string;
  amount: string;
  universe: string;
}

export interface BridgeDepositDestination {
  tokenAddress: string;
  amount: string;
}

export interface BridgeDeposit {
  id: string;
  requestHash: string;
  from: string;
  gasRefunded: boolean;
  timestamp: string | 'not found';
  blockNumber: string;
  txHash: string;
  chainId: number;

  intentId?: string;
  status?: 'Pending' | 'Deposited' | 'Fulfilled' | 'Refunded';
  isPending?: boolean;
  isFulfilled?: boolean;
  isDeposited?: boolean;
  isRefunded?: boolean;
  sourceChainIds?: number[];
  primarySourceChainId?: number;
  sources?: BridgeDepositSource[];
  destinationChainId?: number;
  destinationUniverse?: string;
  destinations?: BridgeDepositDestination[];
  sourceAmount?: string;
  destinationAmount?: string;
  expiry?: number;
  expiryDate?: string;
}

export interface BridgeFill {
  id: string;
  requestHash: string;
  from: string;
  solver: string;
  timestamp: string | 'not found';
  blockNumber: string;
  txHash: string;
  chainId: number;
}

export interface BridgeWithdraw {
  id: string;
  to: string;
  token: string;
  amount: string;
  timestamp: string | 'not found';
  blockNumber: string;
  txHash: string;
  chainId: number;
}

export interface BridgeActivity {
  BridgeDeposit: BridgeDeposit[];
  BridgeFill: BridgeFill[];
  BridgeWithdraw: BridgeWithdraw[];
}
