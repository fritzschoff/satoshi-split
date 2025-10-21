export const SPLIT_MANAGER_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'target',
        type: 'address',
      },
    ],
    name: 'AddressEmptyCode',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'implementation',
        type: 'address',
      },
    ],
    name: 'ERC1967InvalidImplementation',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ERC1967NonPayable',
    type: 'error',
  },
  {
    inputs: [],
    name: 'FailedCall',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidInitialization',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UUPSUnauthorizedCallContext',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'slot',
        type: 'bytes32',
      },
    ],
    name: 'UUPSUnsupportedProxiableUUID',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'debtor',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creditor',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'DebtPaid',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'member',
        type: 'address',
      },
    ],
    name: 'MemberAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'spendingId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'member',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'addedBy',
        type: 'address',
      },
    ],
    name: 'MemberAddedToSpending',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'member',
        type: 'address',
      },
    ],
    name: 'MemberRemoved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'spendingId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'title',
        type: 'string',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'payer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'forWho',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'SpendingAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'spendingId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'removedBy',
        type: 'address',
      },
    ],
    name: 'SpendingRemoved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'initialMembers',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'defaultToken',
        type: 'address',
      },
    ],
    name: 'SplitCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'implementation',
        type: 'address',
      },
    ],
    name: 'Upgraded',
    type: 'event',
  },
  {
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'member',
        type: 'address',
      },
    ],
    name: 'addMember',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'spendingId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'member',
        type: 'address',
      },
    ],
    name: 'addMemberToSpending',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'title',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'address[]',
        name: 'forWho',
        type: 'address[]',
      },
    ],
    name: 'addSpending',
    outputs: [
      {
        internalType: 'uint256',
        name: 'spendingId',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'initialMembers',
        type: 'address[]',
      },
      {
        internalType: 'address',
        name: 'defaultToken',
        type: 'address',
      },
    ],
    name: 'createSplit',
    outputs: [
      {
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'debts',
    outputs: [
      {
        internalType: 'address',
        name: 'debtor',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'creditor',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'isPaid',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'debtor',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'creditor',
        type: 'address',
      },
    ],
    name: 'getDebt',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'debtor',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'creditor',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: 'isPaid',
            type: 'bool',
          },
        ],
        internalType: 'struct SplitManager.Debt',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'debtor',
        type: 'address',
      },
    ],
    name: 'getDebtorDebts',
    outputs: [
      {
        internalType: 'address[]',
        name: 'creditors',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
    ],
    name: 'getSpendings',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'title',
            type: 'string',
          },
          {
            internalType: 'address',
            name: 'payer',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'address[]',
            name: 'forWho',
            type: 'address[]',
          },
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
        ],
        internalType: 'struct SplitManager.Spending[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
    ],
    name: 'getSplitDetails',
    outputs: [
      {
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        internalType: 'address[]',
        name: 'members',
        type: 'address[]',
      },
      {
        internalType: 'uint256',
        name: 'createdAt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'totalDebt',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'defaultToken',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'spendingCounter',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'creditor',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'payDebt',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proxiableUUID',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'member',
        type: 'address',
      },
    ],
    name: 'removeMember',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'splitId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'spendingId',
        type: 'uint256',
      },
    ],
    name: 'removeSpending',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'splitIdCounter',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'splitSpendings',
    outputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'title',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'payer',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'splits',
    outputs: [
      {
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'createdAt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'totalDebt',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'defaultToken',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'spendingCounter',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newImplementation',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
