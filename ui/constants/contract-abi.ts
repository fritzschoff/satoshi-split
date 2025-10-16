export const SPLIT_MANAGER_ABI = [
  {
    type: 'function',
    name: 'createSplit',
    inputs: [
      { name: 'initialMembers', type: 'address[]' },
      { name: 'defaultToken', type: 'address' },
    ],
    outputs: [{ name: 'splitId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addMember',
    inputs: [
      { name: 'splitId', type: 'uint256' },
      { name: 'member', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removeMember',
    inputs: [
      { name: 'splitId', type: 'uint256' },
      { name: 'member', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addSpending',
    inputs: [
      { name: 'splitId', type: 'uint256' },
      { name: 'title', type: 'string' },
      { name: 'amount', type: 'uint256' },
      { name: 'forWho', type: 'address[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'payDebt',
    inputs: [
      { name: 'splitId', type: 'uint256' },
      { name: 'creditor', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getSplitDetails',
    inputs: [{ name: 'splitId', type: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'members', type: 'address[]' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'totalDebt', type: 'uint256' },
      { name: 'defaultToken', type: 'address' },
      { name: 'spendingCounter', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSpendings',
    inputs: [{ name: 'splitId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'title', type: 'string' },
          { name: 'payer', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'forWho', type: 'address[]' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'token', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getDebt',
    inputs: [
      { name: 'splitId', type: 'uint256' },
      { name: 'debtor', type: 'address' },
      { name: 'creditor', type: 'address' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'debtor', type: 'address' },
          { name: 'creditor', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'isPaid', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getDebtorDebts',
    inputs: [
      { name: 'splitId', type: 'uint256' },
      { name: 'debtor', type: 'address' },
    ],
    outputs: [
      { name: 'creditors', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'SplitCreated',
    inputs: [
      { name: 'splitId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'initialMembers', type: 'address[]', indexed: false },
      { name: 'defaultToken', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MemberAdded',
    inputs: [
      { name: 'splitId', type: 'uint256', indexed: true },
      { name: 'member', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'MemberRemoved',
    inputs: [
      { name: 'splitId', type: 'uint256', indexed: true },
      { name: 'member', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'SpendingAdded',
    inputs: [
      { name: 'splitId', type: 'uint256', indexed: true },
      { name: 'spendingId', type: 'uint256', indexed: false },
      { name: 'title', type: 'string', indexed: false },
      { name: 'payer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'forWho', type: 'address[]', indexed: false },
      { name: 'token', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DebtPaid',
    inputs: [
      { name: 'splitId', type: 'uint256', indexed: true },
      { name: 'debtor', type: 'address', indexed: true },
      { name: 'creditor', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'token', type: 'address', indexed: false },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;
