import {
  SplitManager,
  ChainlinkPriceFeed,
} from '../generated/src/Handlers.gen';
import { handlerContext } from 'generated';
import { getLatestEthPrice } from './utils';

async function getOrCreateUserActivity(
  context: handlerContext,
  address: string
): Promise<{
  id: string;
  totalSpentETH: bigint;
  totalSpentUSD: bigint;
  totalReceivedETH: bigint;
  totalReceivedUSD: bigint;
  totalGasSpent: bigint;
  transactionCount: number;
  splits: string[];
}> {
  let userActivity = await context.UserActivity.get(address.toLowerCase());

  if (!userActivity) {
    userActivity = {
      id: address.toLowerCase(),
      totalSpentETH: 0n,
      totalSpentUSD: 0n,
      totalReceivedETH: 0n,
      totalReceivedUSD: 0n,
      totalGasSpent: 0n,
      transactionCount: 0,
      splits: [],
    };
  }

  return userActivity;
}

function addSplitToUser(splits: string[], splitId: string): string[] {
  const splitIdStr = splitId.toString();
  if (!splits.includes(splitIdStr)) {
    return [...splits, splitIdStr];
  }
  return splits;
}

SplitManager.SplitCreated.handler(async ({ event, context }) => {
  const { splitId, creator, initialMembers, defaultToken } = event.params;

  const split = {
    id: splitId.toString(),
    creator: creator.toLowerCase(),
    members: [
      creator.toLowerCase(),
      ...initialMembers.map((addr) => addr.toLowerCase()),
    ],
    defaultToken: defaultToken.toLowerCase(),
    createdAt: BigInt(event.block.timestamp),
    totalDebt: 0n,
  };

  context.Split.set(split);

  let creatorActivity = await getOrCreateUserActivity(
    context,
    creator.toLowerCase()
  );
  creatorActivity.splits = addSplitToUser(
    creatorActivity.splits,
    splitId.toString()
  );
  creatorActivity.transactionCount += 1;
  creatorActivity.totalGasSpent += BigInt(event.transaction.gasPrice || 0);
  context.UserActivity.set(creatorActivity);

  for (const member of initialMembers) {
    const memberLower = member.toLowerCase();
    if (memberLower !== creator.toLowerCase()) {
      let memberActivity = await getOrCreateUserActivity(context, memberLower);
      memberActivity.splits = addSplitToUser(
        memberActivity.splits,
        splitId.toString()
      );
      context.UserActivity.set(memberActivity);
    }
  }

  const transaction = {
    id: event.transaction.hash,
    from_id: creator.toLowerCase(),
    to: event.srcAddress.toLowerCase(),
    amount: 0n,
    token: '',
    gasUsed: BigInt(event.transaction.gasPrice || 0),
    gasPrice: BigInt(event.transaction.gasPrice || 0),
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    status: 'success',
    blockNumber: BigInt(event.block.number),
    txType: 'CreateSplit',
  };

  context.Transaction.set(transaction);
});

SplitManager.MemberAdded.handler(async ({ event, context }) => {
  const { splitId, member } = event.params;

  const split = await context.Split.get(splitId.toString());
  if (split) {
    const memberLower = member.toLowerCase();
    if (!split.members.includes(memberLower)) {
      const updatedSplit = {
        ...split,
        members: [...split.members, memberLower],
      };
      context.Split.set(updatedSplit);
    }

    let memberActivity = await getOrCreateUserActivity(context, memberLower);
    memberActivity.splits = addSplitToUser(
      memberActivity.splits,
      splitId.toString()
    );
    context.UserActivity.set(memberActivity);
  }

  const transaction = {
    id: event.transaction.hash,
    from_id:
      event.transaction.from?.toLowerCase() || event.srcAddress.toLowerCase(),
    to: event.srcAddress.toLowerCase(),
    amount: 0n,
    token: '',
    gasUsed: BigInt(event.transaction.gasPrice || 0),
    gasPrice: BigInt(event.transaction.gasPrice || 0),
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    status: 'success',
    blockNumber: BigInt(event.block.number),
    txType: 'AddMember',
  };

  context.Transaction.set(transaction);
});

SplitManager.MemberRemoved.handler(async ({ event, context }) => {
  const { splitId, member } = event.params;

  const split = await context.Split.get(splitId.toString());
  if (split) {
    const memberLower = member.toLowerCase();
    const updatedSplit = {
      ...split,
      members: split.members.filter((m: string) => m !== memberLower),
    };
    context.Split.set(updatedSplit);

    let memberActivity = await getOrCreateUserActivity(context, memberLower);
    const updatedActivity = {
      ...memberActivity,
      splits: memberActivity.splits.filter(
        (s: string) => s !== splitId.toString()
      ),
    };
    context.UserActivity.set(updatedActivity);
  }

  const transaction = {
    id: event.transaction.hash,
    from_id:
      event.transaction.from?.toLowerCase() || event.srcAddress.toLowerCase(),
    to: event.srcAddress.toLowerCase(),
    amount: 0n,
    token: '',
    gasUsed: BigInt(event.transaction.gasPrice || 0),
    gasPrice: BigInt(event.transaction.gasPrice || 0),
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    status: 'success',
    blockNumber: BigInt(event.block.number),
    txType: 'RemoveMember',
  };

  context.Transaction.set(transaction);
});

SplitManager.SpendingAdded.handler(async ({ event, context }) => {
  const { splitId, spendingId, title, payer, amount, forWho, token } =
    event.params;

  // Get current ETH price from Chainlink
  const ethPrice = await context.effect(getLatestEthPrice, {
    chainId: event.chainId,
  });

  const spending = {
    id: `${splitId.toString()}-${spendingId.toString()}`,
    split_id: splitId.toString(),
    spendingId: BigInt(spendingId),
    title,
    payer: payer.toLowerCase(),
    amount: BigInt(amount),
    forWho: forWho.map((addr) => addr.toLowerCase()),
    timestamp: BigInt(event.block.timestamp),
    token: token.toLowerCase(),
    txHash: event.transaction.hash,
    chainId: event.chainId,
  };

  context.Spending.set(spending);

  let payerActivity = await getOrCreateUserActivity(
    context,
    payer.toLowerCase()
  );
  // If token is ETH, add to totalSpentETH and calculate USD value
  if (token === '0x0000000000000000000000000000000000000000') {
    payerActivity.totalSpentETH += BigInt(amount);
    // Convert ETH to USD using current price (price has 8 decimals, amount has 18 decimals)
    if (ethPrice) {
      const usdValue = (BigInt(amount) * ethPrice) / BigInt(1e8);
      payerActivity.totalSpentUSD += usdValue;
    }
  } else {
    payerActivity.totalSpentETH += BigInt(0);
    payerActivity.totalSpentUSD += BigInt(amount);
  }
  payerActivity.transactionCount += 1;
  payerActivity.totalGasSpent += BigInt(event.transaction.gasPrice || 0);
  context.UserActivity.set(payerActivity);

  const numParticipants = forWho.length;
  const sharePerPerson = BigInt(amount) / BigInt(numParticipants);

  for (const participant of forWho) {
    const participantLower = participant.toLowerCase();
    const payerLower = payer.toLowerCase();

    if (participantLower === payerLower) continue;

    const debtId = `${splitId.toString()}-${participantLower}-${payerLower}`;
    let debt = await context.Debt.get(debtId);

    if (!debt) {
      debt = {
        id: debtId,
        split_id: splitId.toString(),
        debtor: participantLower,
        creditor: payerLower,
        amount: sharePerPerson,
        token: token.toLowerCase(),
        isPaid: false,
        paidAt: undefined,
        txHash: undefined,
      };
      context.Debt.set(debt);
    } else {
      const updatedDebt = {
        ...debt,
        amount: BigInt(debt.amount) + sharePerPerson,
      };
      context.Debt.set(updatedDebt);
    }
  }

  const split = await context.Split.get(splitId.toString());
  if (split) {
    const totalDebtIncrease = sharePerPerson * BigInt(numParticipants - 1);
    const updatedSplit = {
      ...split,
      totalDebt: BigInt(split.totalDebt) + totalDebtIncrease,
    };
    context.Split.set(updatedSplit);
  }

  const transaction = {
    id: event.transaction.hash,
    from_id: payer.toLowerCase(),
    to: event.srcAddress.toLowerCase(),
    amount: BigInt(amount),
    token: token.toLowerCase(),
    gasUsed: BigInt(event.transaction.gasPrice || 0),
    gasPrice: BigInt(event.transaction.gasPrice || 0),
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    status: 'success',
    blockNumber: BigInt(event.block.number),
    txType: 'AddSpending',
  };

  context.Transaction.set(transaction);
});

SplitManager.DebtPaid.handler(async ({ event, context }) => {
  const { splitId, debtor, creditor, amount, token } = event.params;

  const ethPrice = await context.effect(getLatestEthPrice, {
    chainId: event.chainId,
  });

  const debtorLower = debtor.toLowerCase();
  const creditorLower = creditor.toLowerCase();
  const debtId = `${splitId.toString()}-${debtorLower}-${creditorLower}`;

  let debt = await context.Debt.get(debtId);
  if (debt) {
    const newAmount = BigInt(debt.amount) - BigInt(amount);
    const updatedDebt = {
      ...debt,
      amount: newAmount,
      isPaid: newAmount <= 0n,
      paidAt: newAmount <= 0n ? BigInt(event.block.timestamp) : debt.paidAt,
      txHash: newAmount <= 0n ? event.transaction.hash : debt.txHash,
    };

    context.Debt.set(updatedDebt);
  }

  const paymentId = `${event.transaction.hash}-${event.logIndex}`;
  const debtPayment = {
    id: paymentId,
    debt_id: debtId,
    amount: BigInt(amount),
    timestamp: BigInt(event.block.timestamp),
    txHash: event.transaction.hash,
    chainId: event.chainId,
  };

  context.DebtPayment.set(debtPayment);

  const split = await context.Split.get(splitId.toString());
  if (split) {
    const updatedSplit = {
      ...split,
      totalDebt: BigInt(split.totalDebt) - BigInt(amount),
    };
    context.Split.set(updatedSplit);
  }

  let creditorActivity = await getOrCreateUserActivity(context, creditorLower);
  if (token === '0x0000000000000000000000000000000000000000') {
    creditorActivity.totalReceivedETH += BigInt(amount);
    if (ethPrice) {
      const usdValue = (BigInt(amount) * ethPrice) / BigInt(1e8);
      creditorActivity.totalReceivedUSD += usdValue;
    }
  } else {
    creditorActivity.totalReceivedETH += BigInt(0);
    creditorActivity.totalReceivedUSD += BigInt(amount);
  }
  context.UserActivity.set(creditorActivity);

  let debtorActivity = await getOrCreateUserActivity(context, debtorLower);
  debtorActivity.transactionCount += 1;
  debtorActivity.totalGasSpent += BigInt(event.transaction.gasPrice || 0);
  context.UserActivity.set(debtorActivity);

  const transaction = {
    id: event.transaction.hash,
    from_id: debtorLower,
    to: event.srcAddress.toLowerCase(),
    amount: BigInt(amount),
    token: token.toLowerCase(),
    gasUsed: BigInt(event.transaction.gasPrice || 0),
    gasPrice: BigInt(event.transaction.gasPrice || 0),
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    status: 'success',
    blockNumber: BigInt(event.block.number),
    txType: 'PayDebt',
  };

  context.Transaction.set(transaction);
});
