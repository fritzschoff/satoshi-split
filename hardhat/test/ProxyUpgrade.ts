import assert from 'node:assert';
import { describe, it, before } from 'node:test';
import hre from 'hardhat';
import { parseUnits, encodeAbiParameters, parseAbiParameters } from 'viem';
import { getAddress } from 'viem';

describe('Proxy Deployment and Upgrade Tests', () => {
  let deployer: any;
  let alice: any;
  let bob: any;
  let publicClient: any;
  let viem: any;

  before(async () => {
    const network = await hre.network.connect();
    viem = network.viem;
    [deployer, alice, bob] = await viem.getWalletClients();
    publicClient = await viem.getPublicClient();
  });

  describe('Proxy Deployment', () => {
    it('Should deploy implementation and proxy correctly', async function () {
      const implementation = await viem.deployContract('SplitManager');
      assert.ok(implementation.address, 'Implementation should be deployed');

      const initializeData = encodeAbiParameters(
        parseAbiParameters('address'),
        [deployer.account.address]
      );
      const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;

      const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
        implementation.address,
        initCalldata,
      ]);
      assert.ok(proxy.address, 'Proxy should be deployed');

      const splitManager = await viem.getContractAt(
        'SplitManager',
        proxy.address
      );

      const owner = await splitManager.read.owner();
      assert.equal(
        getAddress(owner),
        getAddress(deployer.account.address),
        'Owner should be deployer'
      );
    });

    it('Should allow SplitManager functions through proxy', async function () {
      const implementation = await viem.deployContract('SplitManager');
      const initializeData = encodeAbiParameters(
        parseAbiParameters('address'),
        [deployer.account.address]
      );
      const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
      const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
        implementation.address,
        initCalldata,
      ]);

      const splitManager = await viem.getContractAt(
        'SplitManager',
        proxy.address
      );

      const mockUSDC = await viem.deployContract('MockERC20', [
        'Mock USDC',
        'USDC',
        6,
      ]);

      const hash = await splitManager.write.createSplit([
        [alice.account.address],
        mockUSDC.address,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assert.ok(receipt.status === 'success', 'Split creation should succeed');

      const details = await splitManager.read.getSplitDetails([0n]);
      assert.equal(
        getAddress(details[0]),
        getAddress(deployer.account.address),
        'Creator should be deployer'
      );
      assert.equal(details[1].length, 2, 'Should have 2 members');
    });

    it('Should prevent double initialization', async () => {
      const implementation = await viem.deployContract('SplitManager');
      const initializeData = encodeAbiParameters(
        parseAbiParameters('address'),
        [deployer.account.address]
      );
      const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
      const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
        implementation.address,
        initCalldata,
      ]);

      const splitManager = await viem.getContractAt(
        'SplitManager',
        proxy.address
      );

      await assert.rejects(
        async () => {
          await splitManager.write.initialize([alice.account.address]);
        },
        (error: any) => {
          return (
            error.message.includes('initialized') ||
            error.name === 'ContractFunctionExecutionError'
          );
        },
        'Should not allow double initialization'
      );
    });

    it('Should store state in proxy, not implementation', async () => {
      const implementation = await viem.deployContract('SplitManager');
      const initializeData = encodeAbiParameters(
        parseAbiParameters('address'),
        [deployer.account.address]
      );
      const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
      const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
        implementation.address,
        initCalldata,
      ]);

      const splitManager = await viem.getContractAt(
        'SplitManager',
        proxy.address
      );

      const mockUSDC = await viem.deployContract('MockERC20', [
        'Mock USDC',
        'USDC',
        6,
      ]);

      await splitManager.write.createSplit([
        [alice.account.address],
        mockUSDC.address,
      ]);

      const proxyDetails = await splitManager.read.getSplitDetails([0n]);
      assert.ok(proxyDetails[0], 'Split should exist in proxy');

      const implContract = await viem.getContractAt(
        'SplitManager',
        implementation.address
      );

      await assert.rejects(async () => {
        await implContract.read.getSplitDetails([0n]);
      }, 'Implementation should not have split data');
    });
  });

  describe('Proxy Upgrade', () => {
    it('Should upgrade to new implementation', async () => {
      const implementation = await viem.deployContract('SplitManager');
      const initializeData = encodeAbiParameters(
        parseAbiParameters('address'),
        [deployer.account.address]
      );
      const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
      const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
        implementation.address,
        initCalldata,
      ]);

      const splitManager = await viem.getContractAt(
        'SplitManager',
        proxy.address
      );

      const newImplementation = await viem.deployContract('SplitManager');

      const upgradeHash = await splitManager.write.upgradeToAndCall([
        newImplementation.address,
        '0x',
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: upgradeHash,
      });
      assert.ok(receipt.status === 'success', 'Upgrade should succeed');

      const implementationSlot =
        '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
      const implBytes = await publicClient.getStorageAt({
        address: proxy.address,
        slot: implementationSlot as `0x${string}`,
      });

      const implAddress = `0x${implBytes!.slice(-40)}`;
      assert.equal(
        getAddress(implAddress),
        getAddress(newImplementation.address),
        'Implementation should be updated'
      );
    });

    it('Should preserve data after upgrade', async () => {
      const implementation = await viem.deployContract('SplitManager');
      const initializeData = encodeAbiParameters(
        parseAbiParameters('address'),
        [deployer.account.address]
      );
      const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
      const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
        implementation.address,
        initCalldata,
      ]);

      const splitManager = await viem.getContractAt(
        'SplitManager',
        proxy.address
      );

      const mockUSDC = await viem.deployContract('MockERC20', [
        'Mock USDC',
        'USDC',
        6,
      ]);

      await splitManager.write.createSplit([
        [alice.account.address, bob.account.address],
        mockUSDC.address,
      ]);

      await splitManager.write.addSpending([
        0n,
        'Test expense',
        parseUnits('300', 6),
        [],
      ]);

      const detailsBefore = await splitManager.read.getSplitDetails([0n]);
      const spendingsBefore = await splitManager.read.getSpendings([0n]);
      const debtBefore = await splitManager.read.getDebt([
        0n,
        alice.account.address,
        deployer.account.address,
      ]);

      const newImplementation = await viem.deployContract('SplitManager');
      await splitManager.write.upgradeToAndCall([
        newImplementation.address,
        '0x',
      ]);

      const detailsAfter = await splitManager.read.getSplitDetails([0n]);
      const spendingsAfter = await splitManager.read.getSpendings([0n]);
      const debtAfter = await splitManager.read.getDebt([
        0n,
        alice.account.address,
        deployer.account.address,
      ]);

      assert.equal(
        detailsBefore[1].length,
        detailsAfter[1].length,
        'Members should be preserved'
      );
      assert.equal(
        spendingsBefore.length,
        spendingsAfter.length,
        'Spendings should be preserved'
      );
      assert.equal(
        debtBefore.amount,
        debtAfter.amount,
        'Debts should be preserved'
      );
    });

    it('Should only allow owner to upgrade', async () => {
      const implementation = await viem.deployContract('SplitManager');
      const initializeData = encodeAbiParameters(
        parseAbiParameters('address'),
        [deployer.account.address]
      );
      const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
      const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
        implementation.address,
        initCalldata,
      ]);

      const splitManagerAsAlice = await viem.getContractAt(
        'SplitManager',
        proxy.address,
        { client: { wallet: alice } }
      );

      const newImplementation = await viem.deployContract('SplitManager');

      await assert.rejects(
        async () => {
          await splitManagerAsAlice.write.upgradeToAndCall([
            newImplementation.address,
            '0x',
          ]);
        },
        /OwnableUnauthorizedAccount/,
        'Non-owner should not be able to upgrade'
      );
    });

    it('Should allow functionality after upgrade', async () => {
      const implementation = await viem.deployContract('SplitManager');
      const initializeData = encodeAbiParameters(
        parseAbiParameters('address'),
        [deployer.account.address]
      );
      const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
      const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
        implementation.address,
        initCalldata,
      ]);

      const splitManager = await viem.getContractAt(
        'SplitManager',
        proxy.address
      );

      const mockUSDC = await viem.deployContract('MockERC20', [
        'Mock USDC',
        'USDC',
        6,
      ]);

      const newImplementation = await viem.deployContract('SplitManager');
      await splitManager.write.upgradeToAndCall([
        newImplementation.address,
        '0x',
      ]);

      const hash = await splitManager.write.createSplit([
        [alice.account.address],
        mockUSDC.address,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assert.ok(
        receipt.status === 'success',
        'Should be able to create split after upgrade'
      );

      const details = await splitManager.read.getSplitDetails([0n]);
      assert.equal(details[1].length, 2, 'Split should have 2 members');
    });

    it('Should maintain ownership after upgrade', async () => {
      const implementation = await viem.deployContract('SplitManager');
      const initializeData = encodeAbiParameters(
        parseAbiParameters('address'),
        [deployer.account.address]
      );
      const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
      const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
        implementation.address,
        initCalldata,
      ]);

      const splitManager = await viem.getContractAt(
        'SplitManager',
        proxy.address
      );

      const ownerBefore = await splitManager.read.owner();

      const newImplementation = await viem.deployContract('SplitManager');
      await splitManager.write.upgradeToAndCall([
        newImplementation.address,
        '0x',
      ]);

      const ownerAfter = await splitManager.read.owner();

      assert.equal(
        getAddress(ownerBefore),
        getAddress(ownerAfter),
        'Owner should remain the same after upgrade'
      );
      assert.equal(
        getAddress(ownerAfter),
        getAddress(deployer.account.address),
        'Owner should still be deployer'
      );
    });

    it('Should handle multiple upgrades', async () => {
      const implementation1 = await viem.deployContract('SplitManager');
      const initializeData = encodeAbiParameters(
        parseAbiParameters('address'),
        [deployer.account.address]
      );
      const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
      const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
        implementation1.address,
        initCalldata,
      ]);

      const splitManager = await viem.getContractAt(
        'SplitManager',
        proxy.address
      );

      const mockUSDC = await viem.deployContract('MockERC20', [
        'Mock USDC',
        'USDC',
        6,
      ]);

      await splitManager.write.createSplit([
        [alice.account.address],
        mockUSDC.address,
      ]);

      const implementation2 = await viem.deployContract('SplitManager');
      await splitManager.write.upgradeToAndCall([
        implementation2.address,
        '0x',
      ]);

      await splitManager.write.createSplit([
        [bob.account.address],
        mockUSDC.address,
      ]);

      const implementation3 = await viem.deployContract('SplitManager');
      await splitManager.write.upgradeToAndCall([
        implementation3.address,
        '0x',
      ]);

      const split0 = await splitManager.read.getSplitDetails([0n]);
      const split1 = await splitManager.read.getSplitDetails([1n]);

      assert.ok(split0[0], 'First split should exist');
      assert.ok(split1[0], 'Second split should exist');
    });
  });
});
