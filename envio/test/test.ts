import assert from 'assert';
import { TestHelpers } from 'generated';
const { MockDb, SplitManager, NexusVault, Addresses } = TestHelpers;

describe('SplitManager', () => {
  it('SplitCreated should create a Split entity with correct data', async () => {
    const mockDbEmpty = MockDb.createMockDb();

    const creatorAddress = Addresses.mockAddresses[0];
    const member1 = Addresses.mockAddresses[1];
    const member2 = Addresses.mockAddresses[2];
    const tokenAddress = Addresses.mockAddresses[3];

    const mockSplitCreated = SplitManager.SplitCreated.createMockEvent({
      splitId: 1n,
      creator: creatorAddress,
      initialMembers: [member1, member2],
      defaultToken: tokenAddress,
    });

    const mockDbAfterCreate = await SplitManager.SplitCreated.processEvent({
      event: mockSplitCreated,
      mockDb: mockDbEmpty,
    });

    const split = mockDbAfterCreate.entities.Split.get('1');

    assert.notEqual(split, undefined, 'Split should be created');
    assert.equal(split?.id, '1', 'Split ID should be 1');
    assert.equal(
      split?.creator.toLowerCase(),
      creatorAddress.toLowerCase(),
      'Creator should match'
    );
    assert.equal(split?.totalDebt, 0n, 'Initial debt should be 0');
    assert.ok(
      split?.members.includes(creatorAddress.toLowerCase()),
      'Creator should be in members'
    );
    assert.ok(
      split?.members.includes(member1.toLowerCase()),
      'Member1 should be in members'
    );
    assert.ok(
      split?.members.includes(member2.toLowerCase()),
      'Member2 should be in members'
    );

    const creatorActivity = mockDbAfterCreate.entities.UserActivity.get(
      creatorAddress.toLowerCase()
    );
    assert.notEqual(
      creatorActivity,
      undefined,
      'Creator activity should be created'
    );
    assert.equal(
      creatorActivity?.transactionCount,
      1,
      'Transaction count should be 1'
    );
  });
});

describe('NexusVault', () => {
  it('Deposit should create a BridgeDeposit entity and update user activity', async () => {
    const mockDbEmpty = MockDb.createMockDb();

    const userAddress = Addresses.mockAddresses[0];
    const requestHash =
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    const mockDeposit = NexusVault.Deposit.createMockEvent({
      requestHash: requestHash,
      from: userAddress,
      gasRefunded: true,
    });

    const mockDbAfterDeposit = await NexusVault.Deposit.processEvent({
      event: mockDeposit,
      mockDb: mockDbEmpty,
    });

    const depositId = `${mockDeposit.transaction.hash}-${mockDeposit.logIndex}`;
    const deposit = mockDbAfterDeposit.entities.BridgeDeposit.get(depositId);

    assert.notEqual(
      deposit,
      undefined,
      `Deposit should be created with ID: ${depositId}`
    );
    assert.equal(
      deposit?.from.toLowerCase(),
      userAddress.toLowerCase(),
      'From address should match'
    );
    assert.equal(deposit?.gasRefunded, true, 'Gas refunded should be true');
    assert.equal(
      deposit?.requestHash,
      requestHash,
      'Request hash should match'
    );

    const userActivity = mockDbAfterDeposit.entities.UserActivity.get(
      userAddress.toLowerCase()
    );
    assert.notEqual(userActivity, undefined, 'User activity should be created');
    assert.equal(
      userActivity?.transactionCount,
      1,
      'Transaction count should be 1'
    );
  });

  it('Fill should create a BridgeFill entity and track solver activity', async () => {
    const mockDbEmpty = MockDb.createMockDb();

    const fromAddress = Addresses.mockAddresses[0];
    const solverAddress = Addresses.mockAddresses[1];
    const requestHash =
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd';

    const mockFill = NexusVault.Fill.createMockEvent({
      requestHash: requestHash,
      from: fromAddress,
      solver: solverAddress,
    });

    const mockDbAfterFill = await NexusVault.Fill.processEvent({
      event: mockFill,
      mockDb: mockDbEmpty,
    });

    const fillId = `${mockFill.transaction.hash}-${mockFill.logIndex}`;
    const fill = mockDbAfterFill.entities.BridgeFill.get(fillId);

    assert.notEqual(
      fill,
      undefined,
      `Fill should be created with ID: ${fillId}`
    );
    assert.equal(
      fill?.solver.toLowerCase(),
      solverAddress.toLowerCase(),
      'Solver address should match'
    );
    assert.equal(
      fill?.from.toLowerCase(),
      fromAddress.toLowerCase(),
      'From address should match'
    );

    const solverActivity = mockDbAfterFill.entities.UserActivity.get(
      solverAddress.toLowerCase()
    );
    assert.notEqual(
      solverActivity,
      undefined,
      'Solver activity should be created'
    );
    assert.equal(
      solverActivity?.transactionCount,
      1,
      'Solver transaction count should be 1'
    );
  });

  it('Withdraw should create a BridgeWithdraw entity and update user balances', async () => {
    const mockDbEmpty = MockDb.createMockDb();

    const toAddress = Addresses.mockAddresses[0];
    const tokenAddress = Addresses.mockAddresses[1];
    const withdrawAmount = 1000000n;

    const mockWithdraw = NexusVault.Withdraw.createMockEvent({
      to: toAddress,
      token: tokenAddress,
      amount: withdrawAmount,
    });

    const mockDbAfterWithdraw = await NexusVault.Withdraw.processEvent({
      event: mockWithdraw,
      mockDb: mockDbEmpty,
    });

    const withdrawId = `${mockWithdraw.transaction.hash}-${mockWithdraw.logIndex}`;
    const withdraw =
      mockDbAfterWithdraw.entities.BridgeWithdraw.get(withdrawId);

    assert.notEqual(
      withdraw,
      undefined,
      `Withdraw should be created with ID: ${withdrawId}`
    );
    assert.equal(
      withdraw?.to.toLowerCase(),
      toAddress.toLowerCase(),
      'To address should match'
    );
    assert.equal(
      withdraw?.token.toLowerCase(),
      tokenAddress.toLowerCase(),
      'Token address should match'
    );
    assert.equal(
      withdraw?.amount,
      withdrawAmount,
      'Withdraw amount should match'
    );

    const userActivity = mockDbAfterWithdraw.entities.UserActivity.get(
      toAddress.toLowerCase()
    );
    assert.notEqual(userActivity, undefined, 'User activity should be created');
    assert.equal(
      userActivity?.totalReceivedUSD,
      withdrawAmount,
      'Total received USD should match withdraw amount'
    );
  });

  it('Settle should create a BridgeSettle entity with multiple solvers', async () => {
    const mockDbEmpty = MockDb.createMockDb();

    const solver1 = Addresses.mockAddresses[0];
    const solver2 = Addresses.mockAddresses[1];
    const token1 = Addresses.mockAddresses[2];
    const token2 = Addresses.mockAddresses[3];

    const mockSettle = NexusVault.Settle.createMockEvent({
      nonce: 123n,
      solver: [solver1, solver2],
      token: [token1, token2],
      amount: [500000n, 750000n],
    });

    const mockDbAfterSettle = await NexusVault.Settle.processEvent({
      event: mockSettle,
      mockDb: mockDbEmpty,
    });

    const settleId = `${mockSettle.transaction.hash}-${mockSettle.logIndex}`;
    const settle = mockDbAfterSettle.entities.BridgeSettle.get(settleId);

    assert.notEqual(
      settle,
      undefined,
      `Settle should be created with ID: ${settleId}`
    );
    assert.equal(settle?.nonce, 123n, 'Nonce should match');
    assert.equal(settle?.solvers.length, 2, 'Should have 2 solvers');
    assert.equal(settle?.tokens.length, 2, 'Should have 2 tokens');
    assert.equal(settle?.amounts.length, 2, 'Should have 2 amounts');
    assert.ok(
      settle?.solvers.includes(solver1.toLowerCase()),
      'Solver1 should be in solvers'
    );
    assert.ok(
      settle?.solvers.includes(solver2.toLowerCase()),
      'Solver2 should be in solvers'
    );

    const tx1Id = `${mockSettle.transaction.hash}-${mockSettle.logIndex}-settle-0`;
    const tx2Id = `${mockSettle.transaction.hash}-${mockSettle.logIndex}-settle-1`;
    const tx1 = mockDbAfterSettle.entities.Transaction.get(tx1Id);
    const tx2 = mockDbAfterSettle.entities.Transaction.get(tx2Id);

    assert.notEqual(
      tx1,
      undefined,
      `Transaction 1 should be created with ID: ${tx1Id}`
    );
    assert.notEqual(
      tx2,
      undefined,
      `Transaction 2 should be created with ID: ${tx2Id}`
    );
    assert.equal(
      tx1?.txType,
      'BridgeSettle',
      'Transaction type should be BridgeSettle'
    );
  });

  it('GasOverheadUpdate should update BridgeGasConfig', async () => {
    const mockDbEmpty = MockDb.createMockDb();

    const mockGasOverheadUpdate = NexusVault.GasOverheadUpdate.createMockEvent({
      _function: 1n,
      overhead: 21000n,
    });

    const mockDbAfterUpdate = await NexusVault.GasOverheadUpdate.processEvent({
      event: mockGasOverheadUpdate,
      mockDb: mockDbEmpty,
    });

    const gasConfigId = `${mockGasOverheadUpdate.chainId}-1`;
    const gasConfig =
      mockDbAfterUpdate.entities.BridgeGasConfig.get(gasConfigId);

    assert.notEqual(gasConfig, undefined, 'Gas config should be created');
    assert.equal(gasConfig?.functionType, 1, 'Function type should be 1');
    assert.equal(gasConfig?.overhead, 21000n, 'Overhead should match');
  });

  it('GasPriceUpdate should update BridgeGasPrice', async () => {
    const mockDbEmpty = MockDb.createMockDb();

    const mockGasPriceUpdate = NexusVault.GasPriceUpdate.createMockEvent({
      gasPrice: 50000000000n,
    });

    const mockDbAfterUpdate = await NexusVault.GasPriceUpdate.processEvent({
      event: mockGasPriceUpdate,
      mockDb: mockDbEmpty,
    });

    const gasPriceId = `${mockGasPriceUpdate.chainId}-latest`;
    const gasPrice = mockDbAfterUpdate.entities.BridgeGasPrice.get(gasPriceId);

    assert.notEqual(gasPrice, undefined, 'Gas price should be created');
    assert.equal(
      gasPrice?.gasPrice,
      50000000000n,
      'Gas price should match 50 gwei'
    );
  });

  it('ReceiveETH should track ETH received by the vault', async () => {
    const mockDbEmpty = MockDb.createMockDb();

    const senderAddress = Addresses.mockAddresses[0];
    const ethAmount = 5000000000000000000n; // 5 ETH

    const mockReceiveETH = NexusVault.ReceiveETH.createMockEvent({
      from: senderAddress,
      amount: ethAmount,
    });

    const mockDbAfterReceive = await NexusVault.ReceiveETH.processEvent({
      event: mockReceiveETH,
      mockDb: mockDbEmpty,
    });

    const ethReceiveId = `${mockReceiveETH.transaction.hash}-${mockReceiveETH.logIndex}`;
    const ethReceive =
      mockDbAfterReceive.entities.BridgeReceiveETH.get(ethReceiveId);

    assert.notEqual(
      ethReceive,
      undefined,
      `ETH receive should be created with ID: ${ethReceiveId}`
    );
    assert.equal(
      ethReceive?.from.toLowerCase(),
      senderAddress.toLowerCase(),
      'Sender address should match'
    );
    assert.equal(
      ethReceive?.amount,
      ethAmount,
      'ETH amount should match 5 ETH'
    );
  });
});
