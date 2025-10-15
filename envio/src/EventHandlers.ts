import { SplitManager, PoolManager } from '../generated/src/Handlers.gen';
import { BigDecimal, Swap, handlerContext } from 'generated';
import { getChainConfig } from './utils/chains';
import { safeDiv, convertTokenToDecimal } from './utils/math';
import {
  sqrtPriceX96ToTokenPrices,
  findNativePerToken,
  getTrackedAmountUSD,
  getNativePriceInUSD,
} from './utils/pricing';

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
  // If token is ETH, add to totalSpentETH, otherwise add to totalSpentUSD
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
  // If token is ETH, add to totalReceivedETH, otherwise add to totalReceivedUSD
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

PoolManager.Swap.handler(async ({ event, context }) => {
  let [poolManager, pool, bundle] = await Promise.all([
    context.PoolManager.get(`${event.chainId}_${event.srcAddress}`),
    context.Pool.get(`${event.chainId}_${event.params.id}`),
    context.Bundle.get(event.chainId.toString()),
  ]);

  if (!pool || !poolManager) {
    return;
  }

  let token0;
  let token1;
  let poolHookStats;

  const isHookedPool =
    pool.hooks !== '0x0000000000000000000000000000000000000000';

  [token0, token1, poolHookStats] = await Promise.all([
    context.Token.get(pool.token0),
    context.Token.get(pool.token1),
    isHookedPool
      ? context.HookStats.get(`${event.chainId}_${pool.hooks}`)
      : undefined,
  ]);

  if (!token0 || !token1) {
    return;
  }

  const chainConfig = getChainConfig(event.chainId);

  // Check if this pool should be skipped
  // NOTE: Subgraph only has this check in Initialize handler since skipped pools
  // are never created, but we keep it here for safety in case we switch to
  // getOrThrow APIs in the future and don't want exceptions thrown
  if (chainConfig.poolsToSkip.includes(event.params.id)) {
    return;
  }

  bundle = bundle || {
    id: event.chainId.toString(),
    ethPriceUSD: new BigDecimal('0'),
  };

  // Update tokens' derivedETH values first
  token0 = {
    ...token0,
    derivedETH: await findNativePerToken(
      context,
      token0,
      chainConfig.wrappedNativeAddress,
      chainConfig.stablecoinAddresses,
      chainConfig.minimumNativeLocked
    ),
  };
  token1 = {
    ...token1,
    derivedETH: await findNativePerToken(
      context,
      token1,
      chainConfig.wrappedNativeAddress,
      chainConfig.stablecoinAddresses,
      chainConfig.minimumNativeLocked
    ),
  };

  const ethPriceUSD = await getNativePriceInUSD(
    context,
    event.chainId.toString(),
    chainConfig.stablecoinWrappedNativePoolId,
    chainConfig.stablecoinIsToken0
  );

  if (context.isPreload) {
    return;
  }

  const prices = sqrtPriceX96ToTokenPrices(
    event.params.sqrtPriceX96,
    token0,
    token1,
    chainConfig.nativeTokenDetails
  );
  // Convert amounts using proper decimal handling
  // Unlike V3, a negative amount represents that amount is being sent to the pool and vice versa, so invert the sign
  const amount0 = convertTokenToDecimal(
    event.params.amount0,
    token0.decimals
  ).times(new BigDecimal('-1'));
  const amount1 = convertTokenToDecimal(
    event.params.amount1,
    token1.decimals
  ).times(new BigDecimal('-1'));
  // Get absolute amounts for volume
  const amount0Abs = amount0.lt(new BigDecimal('0'))
    ? amount0.times(new BigDecimal('-1'))
    : amount0;
  const amount1Abs = amount1.lt(new BigDecimal('0'))
    ? amount1.times(new BigDecimal('-1'))
    : amount1;
  const amount0ETH = amount0Abs.times(token0.derivedETH);
  const amount1ETH = amount1Abs.times(token1.derivedETH);
  const amount0USD = amount0ETH.times(bundle.ethPriceUSD);
  const amount1USD = amount1ETH.times(bundle.ethPriceUSD);
  // Get tracked amount USD
  const trackedAmountUSD = await getTrackedAmountUSD(
    context,
    amount0Abs,
    token0,
    amount1Abs,
    token1,
    event.chainId.toString(),
    chainConfig.whitelistTokens
  );
  const amountTotalUSDTracked = trackedAmountUSD.div(new BigDecimal('2'));
  const amountTotalETHTracked = safeDiv(
    amountTotalUSDTracked,
    bundle.ethPriceUSD
  );
  const amountTotalUSDUntracked = amount0USD
    .plus(amount1USD)
    .div(new BigDecimal('2'));
  // Calculate fees
  const feesETH = amountTotalETHTracked
    .times(pool.feeTier.toString())
    .div(new BigDecimal('1000000'));
  const feesUSD = amountTotalUSDTracked
    .times(pool.feeTier.toString())
    .div(new BigDecimal('1000000'));
  // Calculate untracked fees
  const feesUSDUntracked = amountTotalUSDUntracked.times(
    new BigDecimal(pool.feeTier.toString()).div(new BigDecimal('1000000'))
  );
  // Calculate collected fees in tokens
  const feesToken0 = amount0Abs
    .times(pool.feeTier.toString())
    .div(new BigDecimal('1000000'));
  const feesToken1 = amount1Abs
    .times(pool.feeTier.toString())
    .div(new BigDecimal('1000000'));
  // Store current pool TVL values for later calculations
  const currentPoolTvlETH = pool.totalValueLockedETH;
  const currentPoolTvlUSD = pool.totalValueLockedUSD;
  // Update pool values
  pool = {
    ...pool,
    txCount: pool.txCount + 1n,
    sqrtPrice: event.params.sqrtPriceX96,
    tick: event.params.tick,
    token0Price: prices[0],
    token1Price: prices[1],
    totalValueLockedToken0: pool.totalValueLockedToken0.plus(amount0),
    totalValueLockedToken1: pool.totalValueLockedToken1.plus(amount1),
    liquidity: event.params.liquidity,
    volumeToken0: pool.volumeToken0.plus(amount0Abs),
    volumeToken1: pool.volumeToken1.plus(amount1Abs),
    volumeUSD: pool.volumeUSD.plus(amountTotalUSDTracked),
    untrackedVolumeUSD: pool.untrackedVolumeUSD.plus(amountTotalUSDUntracked),
    feesUSD: pool.feesUSD.plus(feesUSD),
    feesUSDUntracked: pool.feesUSDUntracked.plus(feesUSDUntracked),
    collectedFeesToken0: pool.collectedFeesToken0.plus(feesToken0),
    collectedFeesToken1: pool.collectedFeesToken1.plus(feesToken1),
    collectedFeesUSD: pool.collectedFeesUSD.plus(feesUSD),
  };
  pool = {
    ...pool,
    totalValueLockedETH: pool.totalValueLockedToken0
      .times(token0.derivedETH)
      .plus(pool.totalValueLockedToken1.times(token1.derivedETH)),
  };
  pool = {
    ...pool,
    totalValueLockedUSD: pool.totalValueLockedETH.times(bundle.ethPriceUSD),
  };
  // Update PoolManager aggregates
  poolManager = {
    ...poolManager,
    txCount: poolManager.txCount + 1n,
    totalVolumeETH: poolManager.totalVolumeETH.plus(amountTotalETHTracked),
    totalVolumeUSD: poolManager.totalVolumeUSD.plus(amountTotalUSDTracked),
    untrackedVolumeUSD: poolManager.untrackedVolumeUSD.plus(
      amountTotalUSDUntracked
    ),
    totalFeesETH: poolManager.totalFeesETH.plus(feesETH),
    totalFeesUSD: poolManager.totalFeesUSD.plus(feesUSD),
    // Reset and recalculate TVL
    totalValueLockedETH: poolManager.totalValueLockedETH
      .minus(currentPoolTvlETH)
      .plus(pool.totalValueLockedETH),
  };
  // Then calculate USD value based on the updated ETH value
  poolManager = {
    ...poolManager,
    totalValueLockedUSD: poolManager.totalValueLockedETH.times(
      bundle.ethPriceUSD
    ),
  };

  // Use for USD swap amount
  const finalAmountUSD = amountTotalUSDTracked.gt(new BigDecimal('0'))
    ? amountTotalUSDTracked
    : amountTotalUSDUntracked;

  let entity: Swap = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    chainId: BigInt(event.chainId),
    transaction: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
    pool: `${event.chainId}_${event.params.id}`,
    token0_id: token0.id,
    token1_id: token1.id,
    sender: event.params.sender,
    origin: event.transaction.from || 'NONE',
    amount0: amount0,
    amount1: amount1,
    amountUSD: finalAmountUSD,
    sqrtPriceX96: event.params.sqrtPriceX96,
    tick: event.params.tick,
    logIndex: BigInt(event.logIndex),
  };
  // Use immutability pattern
  context.Bundle.set({
    ...bundle,
    ethPriceUSD,
  });
  context.Pool.set(pool);
  context.PoolManager.set(poolManager);
  context.Swap.set(entity);
  context.Token.set(token0);
  context.Token.set(token1);

  poolManager = {
    ...poolManager,
    numberOfSwaps: poolManager.numberOfSwaps + 1n,
    hookedSwaps: isHookedPool
      ? poolManager.hookedSwaps + 1n
      : poolManager.hookedSwaps,
  };

  context.PoolManager.set(poolManager);

  // After processing the swap, update HookStats if it's a hooked pool
  if (poolHookStats) {
    // Calculate volume and fees, using untracked volume as fallback
    const volumeToAdd = amountTotalUSDTracked.gt(new BigDecimal('0'))
      ? amountTotalUSDTracked
      : amountTotalUSDUntracked;

    // Calculate fees based on the volume we're using (use the same calculation as earlier in the code)
    const feesToAdd = amountTotalUSDTracked.gt(new BigDecimal('0'))
      ? feesUSD
      : amountTotalUSDUntracked.times(
          new BigDecimal(pool.feeTier.toString()).div(new BigDecimal('1000000'))
        );

    context.HookStats.set({
      ...poolHookStats,
      numberOfSwaps: poolHookStats.numberOfSwaps + 1n,
      totalVolumeUSD: poolHookStats.totalVolumeUSD.plus(volumeToAdd), // right now this is includes untracked volume
      untrackedVolumeUSD: poolHookStats.untrackedVolumeUSD.plus(
        amountTotalUSDUntracked
      ),
      totalFeesUSD: poolHookStats.totalFeesUSD.plus(feesToAdd),
      totalValueLockedUSD: poolHookStats.totalValueLockedUSD
        .minus(currentPoolTvlUSD) // Remove old TVL
        .plus(pool.totalValueLockedUSD), // Add new TVL
    });
  }
});
