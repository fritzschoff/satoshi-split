import {
  SplitManager_SplitCreated_eventArgs,
  SplitManager_MemberAdded_eventArgs,
  SplitManager_MemberRemoved_eventArgs,
  SplitManager_SpendingAdded_eventArgs,
  SplitManager_DebtPaid_eventArgs,
} from '../generated/src/Types.gen';

// Helper function to get or create UserActivity
async function getOrCreateUserActivity(
  context: any,
  address: string
): Promise<any> {
  let userActivity = await context.UserActivity.get(address.toLowerCase());

  if (!userActivity) {
    userActivity = {
      id: address.toLowerCase(),
      totalSpent: 0n,
      totalReceived: 0n,
      totalGasSpent: 0n,
      transactionCount: 0,
      splits: [],
    };
  }

  return userActivity;
}

// Helper function to add split to user's split list if not already there
function addSplitToUser(splits: string[], splitId: string): string[] {
  const splitIdStr = splitId.toString();
  if (!splits.includes(splitIdStr)) {
    return [...splits, splitIdStr];
  }
  return splits;
}

// SplitCreated event handler
SplitManager.SplitCreated.handler(async ({ event, context }) => {
  const { splitId, creator, initialMembers, defaultToken } = event.params;

  // Create Split entity
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

  // Update creator's user activity
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

  // Update all initial members' user activities
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

  // Create transaction record
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

// MemberAdded event handler
SplitManager.MemberAdded.handler(async ({ event, context }) => {
  const { splitId, member } = event.params;

  // Update Split entity
  const split = await context.Split.get(splitId.toString());
  if (split) {
    const memberLower = member.toLowerCase();
    if (!split.members.includes(memberLower)) {
      split.members = [...split.members, memberLower];
      context.Split.set(split);
    }

    // Update member's user activity
    let memberActivity = await getOrCreateUserActivity(context, memberLower);
    memberActivity.splits = addSplitToUser(
      memberActivity.splits,
      splitId.toString()
    );
    context.UserActivity.set(memberActivity);
  }

  // Create transaction record
  const transaction = {
    id: event.transaction.hash,
    from_id: event.transaction.from.toLowerCase(),
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

// MemberRemoved event handler
SplitManager.MemberRemoved.handler(async ({ event, context }) => {
  const { splitId, member } = event.params;

  // Update Split entity
  const split = await context.Split.get(splitId.toString());
  if (split) {
    const memberLower = member.toLowerCase();
    split.members = split.members.filter((m) => m !== memberLower);
    context.Split.set(split);

    // Update member's user activity
    let memberActivity = await getOrCreateUserActivity(context, memberLower);
    memberActivity.splits = memberActivity.splits.filter(
      (s) => s !== splitId.toString()
    );
    context.UserActivity.set(memberActivity);
  }

  // Create transaction record
  const transaction = {
    id: event.transaction.hash,
    from_id: event.transaction.from.toLowerCase(),
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

// SpendingAdded event handler
SplitManager.SpendingAdded.handler(async ({ event, context }) => {
  const { splitId, spendingId, title, payer, amount, forWho, token } =
    event.params;

  // Create Spending entity
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

  // Update payer's user activity (total spent)
  let payerActivity = await getOrCreateUserActivity(
    context,
    payer.toLowerCase()
  );
  payerActivity.totalSpent += BigInt(amount);
  payerActivity.transactionCount += 1;
  payerActivity.totalGasSpent += BigInt(event.transaction.gasPrice || 0);
  context.UserActivity.set(payerActivity);

  // Calculate debt per person (equal split)
  const numParticipants = forWho.length;
  const sharePerPerson = BigInt(amount) / BigInt(numParticipants);

  // Create or update debts
  for (const participant of forWho) {
    const participantLower = participant.toLowerCase();
    const payerLower = payer.toLowerCase();

    // Skip if participant is the payer
    if (participantLower === payerLower) continue;

    const debtId = `${splitId.toString()}-${participantLower}-${payerLower}`;
    let debt = await context.Debt.get(debtId);

    if (!debt) {
      // Create new debt
      debt = {
        id: debtId,
        split_id: splitId.toString(),
        debtor: participantLower,
        creditor: payerLower,
        amount: sharePerPerson,
        token: token.toLowerCase(),
        isPaid: false,
        paidAt: null,
        txHash: null,
        chainId: null,
      };
    } else {
      // Add to existing debt
      debt.amount = BigInt(debt.amount) + sharePerPerson;
    }

    context.Debt.set(debt);
  }

  // Update Split total debt
  const split = await context.Split.get(splitId.toString());
  if (split) {
    // Total debt increase = sharePerPerson * (numParticipants - 1) because payer doesn't owe themselves
    const totalDebtIncrease = sharePerPerson * BigInt(numParticipants - 1);
    split.totalDebt = BigInt(split.totalDebt) + totalDebtIncrease;
    context.Split.set(split);
  }

  // Create transaction record
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

// DebtPaid event handler
SplitManager.DebtPaid.handler(async ({ event, context }) => {
  const { splitId, debtor, creditor, amount, token } = event.params;

  const debtorLower = debtor.toLowerCase();
  const creditorLower = creditor.toLowerCase();
  const debtId = `${splitId.toString()}-${debtorLower}-${creditorLower}`;

  // Update debt
  let debt = await context.Debt.get(debtId);
  if (debt) {
    debt.amount = BigInt(debt.amount) - BigInt(amount);

    if (debt.amount <= 0n) {
      debt.isPaid = true;
      debt.paidAt = BigInt(event.block.timestamp);
      debt.txHash = event.transaction.hash;
      debt.chainId = event.chainId;
    }

    context.Debt.set(debt);
  }

  // Create debt payment record
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

  // Update Split total debt
  const split = await context.Split.get(splitId.toString());
  if (split) {
    split.totalDebt = BigInt(split.totalDebt) - BigInt(amount);
    context.Split.set(split);
  }

  // Update creditor's user activity (total received)
  let creditorActivity = await getOrCreateUserActivity(context, creditorLower);
  creditorActivity.totalReceived += BigInt(amount);
  context.UserActivity.set(creditorActivity);

  // Update debtor's user activity (transaction count and gas)
  let debtorActivity = await getOrCreateUserActivity(context, debtorLower);
  debtorActivity.transactionCount += 1;
  debtorActivity.totalGasSpent += BigInt(event.transaction.gasPrice || 0);
  context.UserActivity.set(debtorActivity);

  // Create transaction record
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
