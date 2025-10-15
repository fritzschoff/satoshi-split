import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { network } from 'hardhat';
import { parseUnits } from 'viem';

describe('SplitManager Integration Tests', async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [creator, alice, bob] = await viem.getWalletClients();

  it('Should create a split with initial members and emit event', async function () {
    const mockUSDC = await viem.deployContract('MockERC20', [
      'Mock USDC',
      'USDC',
      6,
    ]);

    const splitManager = await viem.deployContract('SplitManager');
    const deploymentBlock = await publicClient.getBlockNumber();

    const initialMembers = [alice.account.address, bob.account.address];
    await splitManager.write.createSplit([initialMembers, mockUSDC.address]);

    const logs = await publicClient.getContractEvents({
      address: splitManager.address,
      abi: splitManager.abi,
      eventName: 'SplitCreated',
      fromBlock: deploymentBlock,
    });

    assert.equal(logs.length, 1, 'Should emit one SplitCreated event');
    assert.equal(
      logs[0].args.creator?.toLowerCase(),
      creator.account.address.toLowerCase(),
      'Creator should match'
    );
    assert.equal(
      logs[0].args.defaultToken?.toLowerCase(),
      mockUSDC.address.toLowerCase(),
      'Default token should be USDC'
    );

    const splitId = logs[0].args.splitId;
    const details = await splitManager.read.getSplitDetails([splitId!]);

    assert.equal(
      details[0].toLowerCase(),
      creator.account.address.toLowerCase(),
      'Creator should match'
    );
    assert.equal(details[1].length, 3, 'Should have 3 members');
    assert.equal(
      details[4].toLowerCase(),
      mockUSDC.address.toLowerCase(),
      'Default token should be USDC'
    );
  });

  it('Should handle end-to-end flow: create split -> add expense -> pay debt', async function () {
    const mockUSDC = await viem.deployContract('MockERC20', [
      'Mock USDC',
      'USDC',
      6,
    ]);
    const splitManager = await viem.deployContract('SplitManager');
    const deploymentBlock = await publicClient.getBlockNumber();

    await mockUSDC.write.mint([
      creator.account.address,
      parseUnits('10000', 6),
    ]);
    await mockUSDC.write.mint([alice.account.address, parseUnits('10000', 6)]);

    await splitManager.write.createSplit([
      [alice.account.address],
      mockUSDC.address,
    ]);

    const createLogs = await publicClient.getContractEvents({
      address: splitManager.address,
      abi: splitManager.abi,
      eventName: 'SplitCreated',
      fromBlock: deploymentBlock,
    });

    const splitId = createLogs[0].args.splitId!;

    const amount = parseUnits('200', 6);
    const forWho = [creator.account.address, alice.account.address];

    await splitManager.write.addSpending([
      splitId,
      'Dinner at Restaurant',
      amount,
      forWho,
    ]);

    const debt = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    assert.equal(
      debt.amount,
      parseUnits('100', 6),
      'Alice should owe 100 USDC'
    );

    const mockUSDCAsAlice = await viem.getContractAt(
      'MockERC20',
      mockUSDC.address,
      {
        client: { wallet: alice },
      }
    );
    const splitManagerAsAlice = await viem.getContractAt(
      'SplitManager',
      splitManager.address,
      { client: { wallet: alice } }
    );

    await mockUSDCAsAlice.write.approve([
      splitManager.address,
      parseUnits('100', 6),
    ]);

    const creatorBalanceBefore = await mockUSDC.read.balanceOf([
      creator.account.address,
    ]);

    await splitManagerAsAlice.write.payDebt([
      splitId,
      creator.account.address,
      parseUnits('100', 6),
    ]);

    const updatedDebt = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    assert.equal(updatedDebt.amount, 0n, 'Debt should be fully paid');
    assert.equal(updatedDebt.isPaid, true, 'Debt should be marked as paid');

    const creatorBalanceAfter = await mockUSDC.read.balanceOf([
      creator.account.address,
    ]);
    assert.equal(
      creatorBalanceAfter - creatorBalanceBefore,
      parseUnits('100', 6),
      'Creator should receive 100 USDC'
    );
  });

  it('Should handle multiple expenses and accumulate debts correctly', async function () {
    const mockUSDC = await viem.deployContract('MockERC20', [
      'Mock USDC',
      'USDC',
      6,
    ]);
    const splitManager = await viem.deployContract('SplitManager');

    await splitManager.write.createSplit([
      [alice.account.address, bob.account.address],
      mockUSDC.address,
    ]);

    const deploymentBlock = await publicClient.getBlockNumber();
    const createLogs = await publicClient.getContractEvents({
      address: splitManager.address,
      abi: splitManager.abi,
      eventName: 'SplitCreated',
      fromBlock: deploymentBlock,
    });

    const splitId = createLogs[0].args.splitId!;

    await splitManager.write.addSpending([
      splitId,
      'Expense 1',
      parseUnits('300', 6),
      [],
    ]);
    await splitManager.write.addSpending([
      splitId,
      'Expense 2',
      parseUnits('150', 6),
      [],
    ]);

    const spendings = await splitManager.read.getSpendings([splitId]);
    assert.equal(spendings.length, 2, 'Should have 2 spendings');

    const aliceDebt = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    const bobDebt = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      creator.account.address,
    ]);

    assert.equal(
      aliceDebt.amount,
      parseUnits('150', 6),
      'Alice should owe 150 USDC'
    );
    assert.equal(
      bobDebt.amount,
      parseUnits('150', 6),
      'Bob should owe 150 USDC'
    );
  });

  it('Should handle member exclusion in expenses', async function () {
    const mockUSDC = await viem.deployContract('MockERC20', [
      'Mock USDC',
      'USDC',
      6,
    ]);
    const splitManager = await viem.deployContract('SplitManager');

    await splitManager.write.createSplit([
      [alice.account.address, bob.account.address],
      mockUSDC.address,
    ]);

    const deploymentBlock = await publicClient.getBlockNumber();
    const createLogs = await publicClient.getContractEvents({
      address: splitManager.address,
      abi: splitManager.abi,
      eventName: 'SplitCreated',
      fromBlock: deploymentBlock,
    });

    const splitId = createLogs[0].args.splitId!;

    await splitManager.write.addSpending([
      splitId,
      'Lunch',
      parseUnits('200', 6),
      [creator.account.address, alice.account.address],
    ]);

    const aliceDebt = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    assert.equal(
      aliceDebt.amount,
      parseUnits('100', 6),
      'Alice should owe 100 USDC'
    );

    const bobDebt = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      creator.account.address,
    ]);
    assert.equal(bobDebt.amount, 0n, 'Bob should owe nothing');
  });

  it('Should handle ETH payments', async function () {
    const splitManager = await viem.deployContract('SplitManager');

    await splitManager.write.createSplit([
      [alice.account.address],
      '0x0000000000000000000000000000000000000000',
    ]);

    const deploymentBlock = await publicClient.getBlockNumber();
    const createLogs = await publicClient.getContractEvents({
      address: splitManager.address,
      abi: splitManager.abi,
      eventName: 'SplitCreated',
      fromBlock: deploymentBlock,
    });

    const splitId = createLogs[0].args.splitId!;

    await splitManager.write.addSpending([
      splitId,
      'Dinner',
      parseUnits('2', 18),
      [creator.account.address, alice.account.address],
    ]);

    const splitManagerAsAlice = await viem.getContractAt(
      'SplitManager',
      splitManager.address,
      { client: { wallet: alice } }
    );

    const creatorBalanceBefore = await publicClient.getBalance({
      address: creator.account.address,
    });

    await splitManagerAsAlice.write.payDebt(
      [splitId, creator.account.address, parseUnits('1', 18)],
      { value: parseUnits('1', 18) }
    );

    const creatorBalanceAfter = await publicClient.getBalance({
      address: creator.account.address,
    });

    assert.ok(
      creatorBalanceAfter > creatorBalanceBefore,
      'Creator should receive ETH'
    );
  });

  it('Should only allow creator to add/remove members', async function () {
    const mockUSDC = await viem.deployContract('MockERC20', [
      'Mock USDC',
      'USDC',
      6,
    ]);
    const splitManager = await viem.deployContract('SplitManager');

    await splitManager.write.createSplit([
      [alice.account.address],
      mockUSDC.address,
    ]);

    const deploymentBlock = await publicClient.getBlockNumber();
    const createLogs = await publicClient.getContractEvents({
      address: splitManager.address,
      abi: splitManager.abi,
      eventName: 'SplitCreated',
      fromBlock: deploymentBlock,
    });

    const splitId = createLogs[0].args.splitId!;

    const splitManagerAsAlice = await viem.getContractAt(
      'SplitManager',
      splitManager.address,
      { client: { wallet: alice } }
    );

    await assert.rejects(
      async () => {
        await splitManagerAsAlice.write.addMember([
          splitId,
          bob.account.address,
        ]);
      },
      /Not the split creator/,
      'Should revert when non-creator tries to add member'
    );

    await splitManager.write.addMember([splitId, bob.account.address]);
    const details = await splitManager.read.getSplitDetails([splitId]);
    assert.equal(
      details[1].length,
      3,
      'Should have 3 members after adding bob'
    );
  });

  it('Should allow Alice to create a split', async function () {
    const mockUSDC = await viem.deployContract('MockERC20', [
      'Mock USDC',
      'USDC',
      6,
    ]);
    const splitManager = await viem.deployContract('SplitManager');
    const deploymentBlock = await publicClient.getBlockNumber();

    const splitManagerAsAlice = await viem.getContractAt(
      'SplitManager',
      splitManager.address,
      { client: { wallet: alice } }
    );

    await splitManagerAsAlice.write.createSplit([
      [creator.account.address, bob.account.address],
      mockUSDC.address,
    ]);

    const logs = await publicClient.getContractEvents({
      address: splitManager.address,
      abi: splitManager.abi,
      eventName: 'SplitCreated',
      fromBlock: deploymentBlock,
    });

    assert.equal(logs.length, 1, 'Should emit one SplitCreated event');
    assert.equal(
      logs[0].args.creator?.toLowerCase(),
      alice.account.address.toLowerCase(),
      'Alice should be the creator'
    );

    const splitId = logs[0].args.splitId!;
    const details = await splitManager.read.getSplitDetails([splitId]);

    assert.equal(
      details[0].toLowerCase(),
      alice.account.address.toLowerCase(),
      'Alice should be the creator in split details'
    );
    assert.equal(details[1].length, 3, 'Should have 3 members including Alice');
  });

  it('Should revert with "Not a member" when non-member tries to add spending', async function () {
    const mockUSDC = await viem.deployContract('MockERC20', [
      'Mock USDC',
      'USDC',
      6,
    ]);
    const splitManager = await viem.deployContract('SplitManager');
    const deploymentBlock = await publicClient.getBlockNumber();

    await splitManager.write.createSplit([
      [alice.account.address],
      mockUSDC.address,
    ]);

    const createLogs = await publicClient.getContractEvents({
      address: splitManager.address,
      abi: splitManager.abi,
      eventName: 'SplitCreated',
      fromBlock: deploymentBlock,
    });

    const splitId = createLogs[0].args.splitId!;

    const splitManagerAsBob = await viem.getContractAt(
      'SplitManager',
      splitManager.address,
      { client: { wallet: bob } }
    );

    await assert.rejects(
      async () => {
        await splitManagerAsBob.write.addSpending([
          splitId,
          'Unauthorized expense',
          parseUnits('100', 6),
          [],
        ]);
      },
      /Not a member/,
      'Should revert when non-member tries to add spending'
    );
  });
});
