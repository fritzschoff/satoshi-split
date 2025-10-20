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

  it('Should revert when creator includes themselves in initialMembers', async function () {
    const mockUSDC = await viem.deployContract('MockERC20', [
      'Mock USDC',
      'USDC',
      6,
    ]);
    const splitManager = await viem.deployContract('SplitManager');

    await assert.rejects(
      async () => {
        await splitManager.write.createSplit([
          [creator.account.address, alice.account.address],
          mockUSDC.address,
        ]);
      },
      /Creator cannot be in members list/,
      'Should revert when creator is included in initialMembers'
    );
  });

  it('Should revert when duplicate members are provided', async function () {
    const mockUSDC = await viem.deployContract('MockERC20', [
      'Mock USDC',
      'USDC',
      6,
    ]);
    const splitManager = await viem.deployContract('SplitManager');

    await assert.rejects(
      async () => {
        await splitManager.write.createSplit([
          [alice.account.address, bob.account.address, alice.account.address],
          mockUSDC.address,
        ]);
      },
      /Duplicate member address/,
      'Should revert when duplicate members are provided'
    );
  });

  it('Should allow split creator to remove any spending', async function () {
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

    const splitManagerAsAlice = await viem.getContractAt(
      'SplitManager',
      splitManager.address,
      { client: { wallet: alice } }
    );

    await splitManagerAsAlice.write.addSpending([
      splitId,
      'Alice Expense',
      parseUnits('300', 6),
      [],
    ]);

    const debtBefore = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      alice.account.address,
    ]);
    assert.equal(
      debtBefore.amount,
      parseUnits('100', 6),
      'Bob should owe 100 USDC before removal'
    );

    await splitManager.write.removeSpending([splitId, 0n]);

    const removeLogs = await publicClient.getContractEvents({
      address: splitManager.address,
      abi: splitManager.abi,
      eventName: 'SpendingRemoved',
      fromBlock: deploymentBlock,
    });

    assert.equal(removeLogs.length, 1, 'Should emit one SpendingRemoved event');
    assert.equal(
      removeLogs[0].args.splitId,
      splitId,
      'Event should have correct splitId'
    );
    assert.equal(
      removeLogs[0].args.spendingId,
      0n,
      'Event should have correct spendingId'
    );
    assert.equal(
      removeLogs[0].args.removedBy?.toLowerCase(),
      creator.account.address.toLowerCase(),
      'Event should have correct removedBy'
    );

    const debtAfter = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      alice.account.address,
    ]);
    assert.equal(
      debtAfter.amount,
      0n,
      'Debt should be reversed after spending removal'
    );
  });

  it('Should allow spending creator to remove their own spending', async function () {
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

    const splitManagerAsAlice = await viem.getContractAt(
      'SplitManager',
      splitManager.address,
      { client: { wallet: alice } }
    );

    await splitManagerAsAlice.write.addSpending([
      splitId,
      'Alice Expense',
      parseUnits('300', 6),
      [],
    ]);

    const splitDetails = await splitManager.read.getSplitDetails([splitId]);
    const totalDebtBefore = splitDetails[3];
    assert.ok(totalDebtBefore > 0n, 'Total debt should be greater than 0');

    await splitManagerAsAlice.write.removeSpending([splitId, 0n]);

    const splitDetailsAfter = await splitManager.read.getSplitDetails([
      splitId,
    ]);
    const totalDebtAfter = splitDetailsAfter[3];
    assert.equal(
      totalDebtAfter,
      0n,
      'Total debt should be 0 after spending removal'
    );
  });

  it('Should revert when non-creator/non-payer tries to remove spending', async function () {
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
      'Creator Expense',
      parseUnits('300', 6),
      [],
    ]);

    const splitManagerAsBob = await viem.getContractAt(
      'SplitManager',
      splitManager.address,
      { client: { wallet: bob } }
    );

    await assert.rejects(
      async () => {
        await splitManagerAsBob.write.removeSpending([splitId, 0n]);
      },
      /Not authorized to remove this spending/,
      'Should revert when non-authorized member tries to remove spending'
    );
  });

  it('Should correctly reverse debts when spending is removed', async function () {
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

    const aliceDebtBefore = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    assert.equal(
      aliceDebtBefore.amount,
      parseUnits('150', 6),
      'Alice should owe 150 USDC'
    );

    await splitManager.write.removeSpending([splitId, 0n]);

    const aliceDebtAfter = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    assert.equal(
      aliceDebtAfter.amount,
      parseUnits('50', 6),
      'Alice should owe 50 USDC after first expense removed'
    );
  });

  it('Should revert when trying to remove invalid spending ID', async function () {
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

    await splitManager.write.addSpending([
      splitId,
      'Expense 1',
      parseUnits('100', 6),
      [],
    ]);

    await assert.rejects(
      async () => {
        await splitManager.write.removeSpending([splitId, 99n]);
      },
      /Invalid spending ID/,
      'Should revert when trying to remove non-existent spending'
    );
  });

  it('Should handle spending removal with partial participants', async function () {
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
      'Lunch with Alice only',
      parseUnits('200', 6),
      [creator.account.address, alice.account.address],
    ]);

    const aliceDebtBefore = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    assert.equal(
      aliceDebtBefore.amount,
      parseUnits('100', 6),
      'Alice should owe 100 USDC'
    );

    const bobDebtBefore = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      creator.account.address,
    ]);
    assert.equal(bobDebtBefore.amount, 0n, 'Bob should owe nothing');

    await splitManager.write.removeSpending([splitId, 0n]);

    const aliceDebtAfter = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    assert.equal(
      aliceDebtAfter.amount,
      0n,
      'Alice debt should be reversed to 0'
    );

    const bobDebtAfter = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      creator.account.address,
    ]);
    assert.equal(bobDebtAfter.amount, 0n, 'Bob should still owe nothing');
  });

  it('Stress test: Should handle many spendings without gas/stack issues', async function () {
    console.log('\n=== Starting Stress Test ===\n');

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
    console.log(`Created split with ID: ${splitId}\n`);

    const numSpendings = 100;
    const gasUsed: bigint[] = [];

    console.log(`Adding ${numSpendings} spendings...`);
    for (let i = 0; i < numSpendings; i++) {
      const amount = parseUnits(String(100 + i), 6);
      const hash = await splitManager.write.addSpending([
        splitId,
        `Expense ${i + 1}`,
        amount,
        [],
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      gasUsed.push(receipt.gasUsed);

      if ((i + 1) % 10 === 0) {
        console.log(`  - Added ${i + 1}/${numSpendings} spendings`);
      }
    }

    const avgGas = gasUsed.reduce((a, b) => a + b, 0n) / BigInt(gasUsed.length);
    const maxGas = gasUsed.reduce((a, b) => (a > b ? a : b), 0n);
    const minGas = gasUsed.reduce((a, b) => (a < b ? a : b), gasUsed[0]);

    console.log(`\nGas Usage Statistics for addSpending:`);
    console.log(`  - Average: ${avgGas.toLocaleString()} gas`);
    console.log(`  - Min: ${minGas.toLocaleString()} gas`);
    console.log(`  - Max: ${maxGas.toLocaleString()} gas`);
    console.log(`  - Gas increase: ${((maxGas - minGas) * 100n) / minGas}%\n`);

    console.log('Testing getSpendings with many entries...');
    const startTime = Date.now();
    const spendings = await splitManager.read.getSpendings([splitId]);
    const getSpendingsTime = Date.now() - startTime;

    console.log(
      `  - Retrieved ${spendings.length} spendings in ${getSpendingsTime}ms`
    );
    assert.equal(spendings.length, numSpendings, 'Should have all spendings');

    console.log('\nTesting debt calculation with many spendings...');
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

    let expectedDebtPerPerson = 0n;
    for (let i = 0; i < numSpendings; i++) {
      const amount = parseUnits(String(100 + i), 6);
      expectedDebtPerPerson += amount / 3n;
    }

    console.log(`  - Alice debt: ${aliceDebt.amount.toLocaleString()}`);
    console.log(`  - Bob debt: ${bobDebt.amount.toLocaleString()}`);
    console.log(
      `  - Expected per person: ${expectedDebtPerPerson.toLocaleString()}`
    );

    assert.equal(
      aliceDebt.amount,
      expectedDebtPerPerson,
      'Alice debt should match expected'
    );
    assert.equal(
      bobDebt.amount,
      expectedDebtPerPerson,
      'Bob debt should match expected'
    );

    console.log('\nTesting split details retrieval...');
    const details = await splitManager.read.getSplitDetails([splitId]);
    console.log(`  - Total debt: ${details[3].toLocaleString()}`);
    console.log(`  - Spending counter: ${details[5].toString()}`);

    assert.equal(
      details[5],
      BigInt(numSpendings),
      'Spending counter should match'
    );

    console.log('\nTesting spending removal with many spendings...');
    const removeHash = await splitManager.write.removeSpending([splitId, 0n]);
    const removeReceipt = await publicClient.waitForTransactionReceipt({
      hash: removeHash,
    });
    console.log(
      `  - Remove spending gas used: ${removeReceipt.gasUsed.toLocaleString()}`
    );

    const spendingsAfterRemove = await splitManager.read.getSpendings([
      splitId,
    ]);
    console.log(
      `  - Spendings count after removal: ${spendingsAfterRemove.length}`
    );

    console.log('\nTesting random spending removals...');
    const randomIndexes = [25, 50, 75];
    for (const idx of randomIndexes) {
      const randomRemoveHash = await splitManager.write.removeSpending([
        splitId,
        BigInt(idx),
      ]);
      const randomRemoveReceipt = await publicClient.waitForTransactionReceipt({
        hash: randomRemoveHash,
      });
      console.log(
        `  - Removed spending #${idx}: ${randomRemoveReceipt.gasUsed.toLocaleString()} gas`
      );
    }

    console.log('\nTesting member removal with debt redistribution...');
    const detailsBeforeRemoval = await splitManager.read.getSplitDetails([
      splitId,
    ]);
    console.log(
      `  - Total debt before removal: ${detailsBeforeRemoval[3].toLocaleString()}`
    );
    console.log(`  - Members before: ${detailsBeforeRemoval[1].length}`);

    const bobDebtBefore = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      creator.account.address,
    ]);
    console.log(
      `  - Bob's debt before: ${bobDebtBefore.amount.toLocaleString()}`
    );

    console.log(`  - Removing Bob and redistributing his debts...`);
    const removeBobHash = await splitManager.write.removeMember([
      splitId,
      bob.account.address,
    ]);
    const removeBobReceipt = await publicClient.waitForTransactionReceipt({
      hash: removeBobHash,
    });
    console.log(
      `  - Member removal gas: ${removeBobReceipt.gasUsed.toLocaleString()}`
    );

    const detailsAfterRemoval = await splitManager.read.getSplitDetails([
      splitId,
    ]);
    console.log(
      `  - Members after: ${detailsAfterRemoval[1].length} (removed 1)`
    );
    console.log(
      `  - Total debt after: ${detailsAfterRemoval[3].toLocaleString()}`
    );

    const aliceDebtAfterRemoval = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    console.log(
      `  - Alice's debt after Bob removal: ${aliceDebtAfterRemoval.amount.toLocaleString()} (absorbed Bob's share)`
    );

    console.log('\nAdding new spending with reduced member count...');
    const newSpendingHash = await splitManager.write.addSpending([
      splitId,
      'Post-removal expense',
      parseUnits('300', 6),
      [],
    ]);
    const newSpendingReceipt = await publicClient.waitForTransactionReceipt({
      hash: newSpendingHash,
    });
    console.log(
      `  - New spending gas: ${newSpendingReceipt.gasUsed.toLocaleString()}`
    );

    const finalAliceDebt = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    console.log(
      `  - Alice's final debt: ${finalAliceDebt.amount.toLocaleString()}`
    );

    console.log('\nTesting getDebtorDebts with many debts...');
    const [creditors, amounts] = await splitManager.read.getDebtorDebts([
      splitId,
      alice.account.address,
    ]);
    console.log(`  - Number of creditors: ${creditors.length}`);
    console.log(
      `  - Total debt to creator: ${amounts[0]?.toLocaleString() || '0'}`
    );

    console.log('\n=== Stress Test Completed Successfully ===\n');

    assert.ok(true, 'All operations completed without errors');
  });

  it('Extreme stress test: 500 spendings', async function () {
    console.log('\n=== Starting EXTREME Stress Test (500 spendings) ===\n');

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

    const numSpendings = 500;
    const batchSize = 50;
    const gasUsed: bigint[] = [];

    console.log(
      `Adding ${numSpendings} spendings in batches of ${batchSize}...`
    );

    for (let batch = 0; batch < numSpendings / batchSize; batch++) {
      const batchStart = Date.now();

      for (let i = 0; i < batchSize; i++) {
        const spendingNum = batch * batchSize + i;
        const amount = parseUnits(String(50 + spendingNum), 6);
        const hash = await splitManager.write.addSpending([
          splitId,
          `Expense ${spendingNum + 1}`,
          amount,
          [],
        ]);

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        gasUsed.push(receipt.gasUsed);
      }

      const batchTime = Date.now() - batchStart;
      console.log(
        `  - Batch ${batch + 1}/${
          numSpendings / batchSize
        }: ${batchSize} spendings added in ${batchTime}ms`
      );
    }

    const avgGas = gasUsed.reduce((a, b) => a + b, 0n) / BigInt(gasUsed.length);
    const maxGas = gasUsed.reduce((a, b) => (a > b ? a : b), 0n);
    const minGas = gasUsed.reduce((a, b) => (a < b ? a : b), gasUsed[0]);

    console.log(`\nGas Usage Statistics:`);
    console.log(`  - First spending: ${gasUsed[0].toLocaleString()} gas`);
    console.log(
      `  - Last spending: ${gasUsed[gasUsed.length - 1].toLocaleString()} gas`
    );
    console.log(`  - Average: ${avgGas.toLocaleString()} gas`);
    console.log(`  - Min: ${minGas.toLocaleString()} gas`);
    console.log(`  - Max: ${maxGas.toLocaleString()} gas`);
    console.log(
      `  - Total gas: ${gasUsed.reduce((a, b) => a + b, 0n).toLocaleString()}`
    );

    console.log('\nTesting read operations with 500 spendings...');
    const startTime = Date.now();
    const spendings = await splitManager.read.getSpendings([splitId]);
    const readTime = Date.now() - startTime;

    console.log(`  - Retrieved ${spendings.length} spendings in ${readTime}ms`);
    assert.equal(
      spendings.length,
      numSpendings,
      'Should have all 500 spendings'
    );

    const details = await splitManager.read.getSplitDetails([splitId]);
    console.log(`  - Total debt: ${details[3].toLocaleString()}`);
    console.log(`  - Spending counter: ${details[5].toString()}`);

    console.log('\nTesting removal from middle of array...');
    const removeHash = await splitManager.write.removeSpending([splitId, 250n]);
    const removeReceipt = await publicClient.waitForTransactionReceipt({
      hash: removeHash,
    });
    console.log(
      `  - Remove spending #250 gas: ${removeReceipt.gasUsed.toLocaleString()}`
    );

    console.log('\nTesting multiple random removals...');
    const randomIndexesToRemove = [50, 100, 150, 200, 300, 400, 450];
    const removalGasCosts: bigint[] = [];

    for (const idx of randomIndexesToRemove) {
      try {
        const randomRemoveHash = await splitManager.write.removeSpending([
          splitId,
          BigInt(idx),
        ]);
        const randomRemoveReceipt =
          await publicClient.waitForTransactionReceipt({
            hash: randomRemoveHash,
          });
        removalGasCosts.push(randomRemoveReceipt.gasUsed);
        console.log(
          `  - Removed spending #${idx}: ${randomRemoveReceipt.gasUsed.toLocaleString()} gas`
        );
      } catch (error) {
        console.log(`  - Spending #${idx} already removed or doesn't exist`);
      }
    }

    const avgRemovalGas =
      removalGasCosts.reduce((a, b) => a + b, 0n) /
      BigInt(removalGasCosts.length);
    console.log(
      `  - Average removal gas: ${avgRemovalGas.toLocaleString()} gas`
    );

    console.log('\nTesting member removal with debt redistribution...');
    const aliceDebtBefore = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    console.log(
      `  - Alice's debt before: ${aliceDebtBefore.amount.toLocaleString()}`
    );

    const detailsBefore = await splitManager.read.getSplitDetails([splitId]);
    console.log(`  - Members before: ${detailsBefore[1].length}`);
    console.log(`  - Total debt before: ${detailsBefore[3].toLocaleString()}`);

    console.log(`  - Removing Alice and redistributing her debts...`);
    const removeAliceHash = await splitManager.write.removeMember([
      splitId,
      alice.account.address,
    ]);
    const removeAliceReceipt = await publicClient.waitForTransactionReceipt({
      hash: removeAliceHash,
    });
    console.log(
      `  - Member removal gas: ${removeAliceReceipt.gasUsed.toLocaleString()}`
    );

    const detailsAfter = await splitManager.read.getSplitDetails([splitId]);
    console.log(`  - Members after: ${detailsAfter[1].length} (removed 1)`);
    console.log(`  - Total debt after: ${detailsAfter[3].toLocaleString()}`);

    console.log('\nAdding spending with reduced member count...');
    const postRemovalHash = await splitManager.write.addSpending([
      splitId,
      'Post-removal expense',
      parseUnits('200', 6),
      [],
    ]);
    const postRemovalReceipt = await publicClient.waitForTransactionReceipt({
      hash: postRemovalHash,
    });
    console.log(
      `  - New spending gas with 1 member: ${postRemovalReceipt.gasUsed.toLocaleString()}`
    );

    const finalDetails = await splitManager.read.getSplitDetails([splitId]);
    console.log(`  - Final total debt: ${finalDetails[3].toLocaleString()}`);
    console.log(`  - Final spending count: ${finalDetails[5].toString()}`);

    console.log('\n=== EXTREME Stress Test Completed ===\n');

    assert.ok(true, 'Contract handled 500 spendings without issues');
  });

  it('Should redistribute debts when removing member with outstanding debts', async function () {
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
      parseUnits('300', 6),
      [],
    ]);

    const aliceDebtBefore = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    const bobDebtBefore = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      creator.account.address,
    ]);

    assert.equal(
      aliceDebtBefore.amount,
      parseUnits('100', 6),
      'Alice should owe 100 USDC (300/3)'
    );
    assert.equal(
      bobDebtBefore.amount,
      parseUnits('100', 6),
      'Bob should owe 100 USDC (300/3)'
    );

    await splitManager.write.removeMember([splitId, alice.account.address]);

    const aliceDebtAfter = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    assert.equal(aliceDebtAfter.amount, 0n, "Alice's debt should be cleared");
    assert.ok(aliceDebtAfter.isPaid, "Alice's debt should be marked as paid");

    const bobDebtAfter = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      creator.account.address,
    ]);
    assert.equal(
      bobDebtAfter.amount,
      parseUnits('200', 6),
      'Bob should now owe 200 USDC (his 100 + Alice redistributed 100)'
    );

    const details = await splitManager.read.getSplitDetails([splitId]);
    assert.equal(details[1].length, 2, 'Should have 2 members after removal');
  });

  it('Should forgive debts owed to removed member', async function () {
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

    const splitManagerAsAlice = await viem.getContractAt(
      'SplitManager',
      splitManager.address,
      { client: { wallet: alice } }
    );

    await splitManagerAsAlice.write.addSpending([
      splitId,
      'Dinner paid by Alice',
      parseUnits('300', 6),
      [],
    ]);

    const creatorDebtToAliceBefore = await splitManager.read.getDebt([
      splitId,
      creator.account.address,
      alice.account.address,
    ]);
    const bobDebtToAliceBefore = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      alice.account.address,
    ]);

    assert.equal(
      creatorDebtToAliceBefore.amount,
      parseUnits('100', 6),
      'Creator should owe Alice 100 USDC'
    );
    assert.equal(
      bobDebtToAliceBefore.amount,
      parseUnits('100', 6),
      'Bob should owe Alice 100 USDC'
    );

    const totalDebtBefore = (
      await splitManager.read.getSplitDetails([splitId])
    )[3];

    await splitManager.write.removeMember([splitId, alice.account.address]);

    const creatorDebtToAliceAfter = await splitManager.read.getDebt([
      splitId,
      creator.account.address,
      alice.account.address,
    ]);
    const bobDebtToAliceAfter = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      alice.account.address,
    ]);

    assert.equal(
      creatorDebtToAliceAfter.amount,
      0n,
      'Creator debt to Alice should be forgiven'
    );
    assert.ok(
      creatorDebtToAliceAfter.isPaid,
      'Creator debt should be marked as paid'
    );
    assert.equal(
      bobDebtToAliceAfter.amount,
      0n,
      'Bob debt to Alice should be forgiven'
    );
    assert.ok(bobDebtToAliceAfter.isPaid, 'Bob debt should be marked as paid');

    const totalDebtAfter = (
      await splitManager.read.getSplitDetails([splitId])
    )[3];
    assert.equal(
      totalDebtAfter,
      0n,
      'Total debt should be 0 after forgiving all debts'
    );
  });

  it('Should allow member removal after all debts are paid', async function () {
    const mockUSDC = await viem.deployContract('MockERC20', [
      'Mock USDC',
      'USDC',
      6,
    ]);
    const splitManager = await viem.deployContract('SplitManager');

    await mockUSDC.write.mint([alice.account.address, parseUnits('10000', 6)]);

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

    await splitManager.write.addSpending([
      splitId,
      'Expense',
      parseUnits('200', 6),
      [],
    ]);

    const mockUSDCAsAlice = await viem.getContractAt(
      'MockERC20',
      mockUSDC.address,
      { client: { wallet: alice } }
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

    await splitManagerAsAlice.write.payDebt([
      splitId,
      creator.account.address,
      parseUnits('100', 6),
    ]);

    await splitManager.write.removeMember([splitId, alice.account.address]);

    const details = await splitManager.read.getSplitDetails([splitId]);
    assert.equal(details[1].length, 1, 'Should have 1 member after removal');
  });

  it('Should add participant to existing spending and recalculate debts', async function () {
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
      'Dinner',
      parseUnits('300', 6),
      [creator.account.address, alice.account.address],
    ]);

    const aliceDebtBefore = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    assert.equal(
      aliceDebtBefore.amount,
      parseUnits('150', 6),
      'Alice should owe 150 USDC (300/2)'
    );

    const bobDebtBefore = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      creator.account.address,
    ]);
    assert.equal(bobDebtBefore.amount, 0n, 'Bob should owe nothing initially');

    await splitManager.write.addMemberToSpending([
      splitId,
      0n,
      bob.account.address,
    ]);

    const addedLogs = await publicClient.getContractEvents({
      address: splitManager.address,
      abi: splitManager.abi,
      eventName: 'MemberAddedToSpending',
      fromBlock: deploymentBlock,
    });

    assert.equal(
      addedLogs.length,
      1,
      'Should emit MemberAddedToSpending event'
    );
    assert.equal(
      addedLogs[0].args.member?.toLowerCase(),
      bob.account.address.toLowerCase(),
      'Event should have correct member'
    );

    const aliceDebtAfter = await splitManager.read.getDebt([
      splitId,
      alice.account.address,
      creator.account.address,
    ]);
    assert.equal(
      aliceDebtAfter.amount,
      parseUnits('100', 6),
      'Alice should now owe 100 USDC (300/3)'
    );

    const bobDebtAfter = await splitManager.read.getDebt([
      splitId,
      bob.account.address,
      creator.account.address,
    ]);
    assert.equal(
      bobDebtAfter.amount,
      parseUnits('100', 6),
      'Bob should now owe 100 USDC (300/3)'
    );

    const spendings = await splitManager.read.getSpendings([splitId]);
    assert.equal(
      spendings[0].forWho.length,
      3,
      'Spending should have 3 participants'
    );
  });

  it('Should only allow creator or payer to add participants', async function () {
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
      'Expense',
      parseUnits('300', 6),
      [creator.account.address, alice.account.address],
    ]);

    const splitManagerAsBob = await viem.getContractAt(
      'SplitManager',
      splitManager.address,
      { client: { wallet: bob } }
    );

    await assert.rejects(
      async () => {
        await splitManagerAsBob.write.addMemberToSpending([
          splitId,
          0n,
          bob.account.address,
        ]);
      },
      /Not authorized to modify this spending/,
      'Bob should not be able to add participant to spending he did not create'
    );
  });

  it('Should prevent adding same participant twice', async function () {
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
      'Expense',
      parseUnits('300', 6),
      [creator.account.address, alice.account.address],
    ]);

    await assert.rejects(
      async () => {
        await splitManager.write.addMemberToSpending([
          splitId,
          0n,
          alice.account.address,
        ]);
      },
      /Member already in spending/,
      'Should not allow adding same member twice'
    );
  });
});
