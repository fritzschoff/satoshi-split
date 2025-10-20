import { SplitManager, NexusVault } from '../generated/src/Handlers.gen';
import { handlerContext } from 'generated';

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
  if (token === '0x0000000000000000000000000000000000000000') {
    payerActivity.totalSpentETH += BigInt(amount);
    payerActivity.totalSpentUSD += BigInt(0);
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
    creditorActivity.totalReceivedUSD += BigInt(0);
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

SplitManager.SpendingRemoved.handler(async ({ event, context }) => {
  const { splitId, spendingId, removedBy } = event.params;

  const spendingDbId = `${splitId.toString()}-${spendingId.toString()}`;
  const spending = await context.Spending.get(spendingDbId);

  if (!spending) {
    return;
  }

  const sharePerPerson =
    BigInt(spending.amount) / BigInt(spending.forWho.length);

  for (const participant of spending.forWho) {
    const participantLower = participant.toLowerCase();
    const payerLower = spending.payer.toLowerCase();

    if (participantLower === payerLower) continue;

    const debtId = `${splitId.toString()}-${participantLower}-${payerLower}`;
    let debt = await context.Debt.get(debtId);

    if (debt && BigInt(debt.amount) >= sharePerPerson) {
      const newAmount = BigInt(debt.amount) - sharePerPerson;
      const updatedDebt = {
        ...debt,
        amount: newAmount,
        isPaid: newAmount <= 0n ? true : debt.isPaid,
      };
      context.Debt.set(updatedDebt);
    }
  }

  const split = await context.Split.get(splitId.toString());
  if (split) {
    const totalDebtReduction =
      sharePerPerson * BigInt(spending.forWho.length - 1);
    const updatedSplit = {
      ...split,
      totalDebt: BigInt(split.totalDebt) - totalDebtReduction,
    };
    context.Split.set(updatedSplit);
  }

  context.Spending.deleteUnsafe(spendingDbId);

  let removerActivity = await getOrCreateUserActivity(
    context,
    removedBy.toLowerCase()
  );
  removerActivity.transactionCount += 1;
  removerActivity.totalGasSpent += BigInt(event.transaction.gasPrice || 0);
  context.UserActivity.set(removerActivity);

  const transaction = {
    id: event.transaction.hash,
    from_id: removedBy.toLowerCase(),
    to: event.srcAddress.toLowerCase(),
    amount: 0n,
    token: spending.token,
    gasUsed: BigInt(event.transaction.gasPrice || 0),
    gasPrice: BigInt(event.transaction.gasPrice || 0),
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    status: 'success',
    blockNumber: BigInt(event.block.number),
    txType: 'RemoveSpending',
  };

  context.Transaction.set(transaction);
});

SplitManager.MemberAddedToSpending.handler(async ({ event, context }) => {
  const { splitId, spendingId, member, addedBy } = event.params;

  const spendingDbId = `${splitId.toString()}-${spendingId.toString()}`;
  let spending = await context.Spending.get(spendingDbId);

  if (!spending) {
    return;
  }

  const oldMemberCount = spending.forWho.length;
  const newMemberCount = oldMemberCount + 1;

  const oldSharePerPerson = BigInt(spending.amount) / BigInt(oldMemberCount);
  const newSharePerPerson = BigInt(spending.amount) / BigInt(newMemberCount);

  const memberLower = member.toLowerCase();
  const payerLower = spending.payer.toLowerCase();

  for (const existingMember of spending.forWho) {
    const existingLower = existingMember.toLowerCase();

    if (existingLower === payerLower) continue;

    const debtId = `${splitId.toString()}-${existingLower}-${payerLower}`;
    let debt = await context.Debt.get(debtId);

    if (debt && BigInt(debt.amount) >= oldSharePerPerson) {
      const updatedDebt = {
        ...debt,
        amount: BigInt(debt.amount) - oldSharePerPerson + newSharePerPerson,
      };
      context.Debt.set(updatedDebt);
    }
  }

  const updatedSpending = {
    ...spending,
    forWho: [...spending.forWho, memberLower],
  };
  context.Spending.set(updatedSpending);

  if (memberLower !== payerLower) {
    const newDebtId = `${splitId.toString()}-${memberLower}-${payerLower}`;
    let newDebt = await context.Debt.get(newDebtId);

    if (newDebt) {
      const updatedNewDebt = {
        ...newDebt,
        amount: BigInt(newDebt.amount) + newSharePerPerson,
        isPaid: false,
      };
      context.Debt.set(updatedNewDebt);
    } else {
      const createdDebt = {
        id: newDebtId,
        split_id: splitId.toString(),
        debtor: memberLower,
        creditor: payerLower,
        amount: newSharePerPerson,
        token: spending.token,
        isPaid: false,
        paidAt: undefined,
        txHash: undefined,
      };
      context.Debt.set(createdDebt);
    }
  }

  const split = await context.Split.get(splitId.toString());
  if (split) {
    const totalDebtIncrease = newSharePerPerson;
    const updatedSplit = {
      ...split,
      totalDebt: BigInt(split.totalDebt) + totalDebtIncrease,
    };
    context.Split.set(updatedSplit);
  }

  let adderActivity = await getOrCreateUserActivity(
    context,
    addedBy.toLowerCase()
  );
  adderActivity.transactionCount += 1;
  adderActivity.totalGasSpent += BigInt(event.transaction.gasPrice || 0);
  context.UserActivity.set(adderActivity);

  const transaction = {
    id: event.transaction.hash,
    from_id: addedBy.toLowerCase(),
    to: event.srcAddress.toLowerCase(),
    amount: 0n,
    token: spending.token,
    gasUsed: BigInt(event.transaction.gasPrice || 0),
    gasPrice: BigInt(event.transaction.gasPrice || 0),
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    status: 'success',
    blockNumber: BigInt(event.block.number),
    txType: 'AddParticipant',
  };

  context.Transaction.set(transaction);
});

NexusVault.Deposit.handler(async ({ event, context }) => {
  const { requestHash, from, gasRefunded } = event.params;

  const deposit = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    requestHash: requestHash,
    from: from.toLowerCase(),
    gasRefunded,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    chainId: event.chainId,
  };

  context.BridgeDeposit.set(deposit);

  let userActivity = await getOrCreateUserActivity(context, from.toLowerCase());
  userActivity.transactionCount += 1;
  userActivity.totalGasSpent += BigInt(event.transaction.gasPrice || 0);
  context.UserActivity.set(userActivity);

  const transaction = {
    id: `${event.transaction.hash}-${event.logIndex}-deposit`,
    from_id: from.toLowerCase(),
    to: event.srcAddress.toLowerCase(),
    amount: 0n,
    token: '',
    gasUsed: BigInt(event.transaction.gasPrice || 0),
    gasPrice: BigInt(event.transaction.gasPrice || 0),
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    status: 'success',
    blockNumber: BigInt(event.block.number),
    txType: 'BridgeDeposit',
  };

  context.Transaction.set(transaction);
});

NexusVault.Fill.handler(async ({ event, context }) => {
  const { requestHash, from, solver } = event.params;

  const fill = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    requestHash: requestHash,
    from: from.toLowerCase(),
    solver: solver.toLowerCase(),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    chainId: event.chainId,
  };

  context.BridgeFill.set(fill);

  let solverActivity = await getOrCreateUserActivity(
    context,
    solver.toLowerCase()
  );
  solverActivity.transactionCount += 1;
  solverActivity.totalGasSpent += BigInt(event.transaction.gasPrice || 0);
  context.UserActivity.set(solverActivity);

  const transaction = {
    id: `${event.transaction.hash}-${event.logIndex}-fill`,
    from_id: solver.toLowerCase(),
    to: event.srcAddress.toLowerCase(),
    amount: 0n,
    token: '',
    gasUsed: BigInt(event.transaction.gasPrice || 0),
    gasPrice: BigInt(event.transaction.gasPrice || 0),
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    status: 'success',
    blockNumber: BigInt(event.block.number),
    txType: 'BridgeFill',
  };

  context.Transaction.set(transaction);
});

NexusVault.GasOverheadUpdate.handler(async ({ event, context }) => {
  const { _function, overhead } = event.params;

  const gasConfig = {
    id: `${event.chainId}-${_function}`,
    functionType: Number(_function),
    overhead: BigInt(overhead),
    updatedAt: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    chainId: event.chainId,
  };

  context.BridgeGasConfig.set(gasConfig);
});

NexusVault.GasPriceUpdate.handler(async ({ event, context }) => {
  const { gasPrice } = event.params;

  const gasPriceConfig = {
    id: `${event.chainId}-latest`,
    gasPrice: BigInt(gasPrice),
    updatedAt: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    chainId: event.chainId,
  };

  context.BridgeGasPrice.set(gasPriceConfig);
});

NexusVault.ReceiveETH.handler(async ({ event, context }) => {
  const { from, amount } = event.params;

  const receiveETH = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    from: from.toLowerCase(),
    amount: BigInt(amount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    chainId: event.chainId,
  };

  context.BridgeReceiveETH.set(receiveETH);
});

NexusVault.Settle.handler(async ({ event, context }) => {
  const { nonce, solver, token, amount } = event.params;

  const settle = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    nonce: BigInt(nonce),
    solvers: solver.map((s) => s.toLowerCase()),
    tokens: token.map((t) => t.toLowerCase()),
    amounts: amount.map((a) => BigInt(a)),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    chainId: event.chainId,
  };

  context.BridgeSettle.set(settle);

  for (let i = 0; i < solver.length; i++) {
    const transaction = {
      id: `${event.transaction.hash}-${event.logIndex}-settle-${i}`,
      from_id: solver[i].toLowerCase(),
      to: event.srcAddress.toLowerCase(),
      amount: BigInt(amount[i]),
      token: token[i].toLowerCase(),
      gasUsed: BigInt(event.transaction.gasPrice || 0),
      gasPrice: BigInt(event.transaction.gasPrice || 0),
      timestamp: BigInt(event.block.timestamp),
      chainId: event.chainId,
      status: 'success',
      blockNumber: BigInt(event.block.number),
      txType: 'BridgeSettle',
    };

    context.Transaction.set(transaction);
  }
});

NexusVault.Withdraw.handler(async ({ event, context }) => {
  const { to, token, amount } = event.params;

  const withdraw = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    to: to.toLowerCase(),
    token: token.toLowerCase(),
    amount: BigInt(amount),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    chainId: event.chainId,
  };

  context.BridgeWithdraw.set(withdraw);

  let userActivity = await getOrCreateUserActivity(context, to.toLowerCase());
  if (token === '0x0000000000000000000000000000000000000000') {
    userActivity.totalReceivedETH += BigInt(amount);
  } else {
    userActivity.totalReceivedUSD += BigInt(amount);
  }
  context.UserActivity.set(userActivity);

  const transaction = {
    id: `${event.transaction.hash}-${event.logIndex}-withdraw`,
    from_id: event.srcAddress.toLowerCase(),
    to: to.toLowerCase(),
    amount: BigInt(amount),
    token: token.toLowerCase(),
    gasUsed: BigInt(event.transaction.gasPrice || 0),
    gasPrice: BigInt(event.transaction.gasPrice || 0),
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    status: 'success',
    blockNumber: BigInt(event.block.number),
    txType: 'BridgeWithdraw',
  };

  context.Transaction.set(transaction);
});
