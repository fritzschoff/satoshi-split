export interface Split {
  id: string;
  creator: string;
  members: string[];
  defaultToken: string;
  createdAt: string;
  totalDebt: string;
  spendings: Spending[];
  debts: Debt[];
}

export interface Spending {
  id: string;
  spendingId: string;
  title: string;
  payer: string;
  amount: string;
  forWho: string[];
  timestamp: string;
  token: string;
  txHash: string;
  chainId: number;
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
export interface BridgeDeposit {
  id: string;
  requestHash: string;
  from: string;
  gasRefunded: boolean;
  timestamp: string;
  blockNumber: string;
  txHash: string;
  chainId: number;
}

export interface BridgeFill {
  id: string;
  requestHash: string;
  from: string;
  solver: string;
  timestamp: string;
  blockNumber: string;
  txHash: string;
  chainId: number;
}

export interface BridgeWithdraw {
  id: string;
  to: string;
  token: string;
  amount: string;
  timestamp: string;
  blockNumber: string;
  txHash: string;
  chainId: number;
}

export interface BridgeActivity {
  BridgeDeposit: BridgeDeposit[];
  BridgeFill: BridgeFill[];
  BridgeWithdraw: BridgeWithdraw[];
}
