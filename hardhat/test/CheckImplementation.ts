import assert from 'node:assert';
import { describe, it, before } from 'node:test';
import hre from 'hardhat';
import { encodeAbiParameters, parseAbiParameters } from 'viem';
import { getAddress } from 'viem';

describe('Check Implementation Script Tests', () => {
  let deployer: any;
  let publicClient: any;
  let viem: any;

  before(async () => {
    const network = await hre.network.connect();
    viem = network.viem;
    [deployer] = await viem.getWalletClients();
    publicClient = await viem.getPublicClient();
  });

  it('Should correctly read implementation address from proxy', async () => {
    const implementation = await viem.deployContract('SplitManager');
    const initializeData = encodeAbiParameters(parseAbiParameters('address'), [
      deployer.account.address,
    ]);
    const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
    const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
      implementation.address,
      initCalldata,
    ]);

    const implementationSlot =
      '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

    const implementationBytes = await publicClient.getStorageAt({
      address: proxy.address,
      slot: implementationSlot as `0x${string}`,
    });

    assert.ok(implementationBytes, 'Should be able to read storage slot');

    const implementationAddress = `0x${implementationBytes!.slice(-40)}`;

    assert.equal(
      getAddress(implementationAddress),
      getAddress(implementation.address),
      'Implementation address should match'
    );
  });

  it('Should read owner from proxy', async () => {
    const implementation = await viem.deployContract('SplitManager');
    const initializeData = encodeAbiParameters(parseAbiParameters('address'), [
      deployer.account.address,
    ]);
    const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
    const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
      implementation.address,
      initCalldata,
    ]);

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

  it('Should correctly identify when no splits exist', async () => {
    const implementation = await viem.deployContract('SplitManager');
    const initializeData = encodeAbiParameters(parseAbiParameters('address'), [
      deployer.account.address,
    ]);
    const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
    const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
      implementation.address,
      initCalldata,
    ]);

    const splitManager = await viem.getContractAt(
      'SplitManager',
      proxy.address
    );

    await assert.rejects(async () => {
      await splitManager.read.getSplitDetails([0n]);
    }, 'Should revert when split does not exist');
  });

  it('Should read implementation after upgrade', async () => {
    const implementation1 = await viem.deployContract('SplitManager');
    const initializeData = encodeAbiParameters(parseAbiParameters('address'), [
      deployer.account.address,
    ]);
    const initCalldata = `0xc4d66de8${initializeData.slice(2)}`;
    const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
      implementation1.address,
      initCalldata,
    ]);

    const implementation2 = await viem.deployContract('SplitManager');

    const splitManager = await viem.getContractAt(
      'SplitManager',
      proxy.address
    );
    await splitManager.write.upgradeToAndCall([implementation2.address, '0x']);

    const implementationSlot =
      '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

    const implementationBytes = await publicClient.getStorageAt({
      address: proxy.address,
      slot: implementationSlot as `0x${string}`,
    });

    const implementationAddress = `0x${implementationBytes!.slice(-40)}`;

    assert.equal(
      getAddress(implementationAddress),
      getAddress(implementation2.address),
      'Implementation should be updated to implementation2'
    );

    assert.notEqual(
      getAddress(implementationAddress),
      getAddress(implementation1.address),
      'Implementation should not be the old one'
    );
  });

  it('Should work with proxy that has splits created', async () => {
    const implementation = await viem.deployContract('SplitManager');
    const initializeData = encodeAbiParameters(parseAbiParameters('address'), [
      deployer.account.address,
    ]);
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
      ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'],
      mockUSDC.address,
    ]);

    const details = await splitManager.read.getSplitDetails([0n]);
    assert.ok(details[0], 'Split should exist');
    assert.equal(details[1].length, 2, 'Split should have 2 members');

    const implementationSlot =
      '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

    const implementationBytes = await publicClient.getStorageAt({
      address: proxy.address,
      slot: implementationSlot as `0x${string}`,
    });

    const implementationAddress = `0x${implementationBytes!.slice(-40)}`;

    assert.equal(
      getAddress(implementationAddress),
      getAddress(implementation.address),
      'Implementation address should still be correct'
    );

    const owner = await splitManager.read.owner();
    assert.equal(
      getAddress(owner),
      getAddress(deployer.account.address),
      'Owner should still be deployer'
    );
  });
});
