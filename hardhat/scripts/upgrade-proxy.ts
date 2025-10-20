import hre from 'hardhat';
import { Address } from 'viem';

async function main() {
  const proxyAddress = process.env.PROXY_ADDRESS;

  if (!proxyAddress) {
    throw new Error(
      'Please provide proxy address as argument or set PROXY_ADDRESS env variable'
    );
  }

  console.log('Upgrading proxy at:', proxyAddress);

  const { viem } = await hre.network.connect();
  const [deployer] = await viem.getWalletClients();

  const newImplementation = await viem.deployContract('SplitManager');
  console.log('New implementation deployed to:', newImplementation.address);

  const splitManager = await viem.getContractAt(
    'SplitManager',
    proxyAddress as Address
  );

  const owner = (await splitManager.read.owner()) as Address;
  console.log('Owner:', owner);

  if (owner.toLowerCase() !== deployer.account.address.toLowerCase()) {
    throw new Error(
      `Deployer (${deployer.account.address}) is not the owner (${owner})`
    );
  }

  const upgradeHash = await splitManager.write.upgradeToAndCall([
    newImplementation.address,
    '0x',
  ]);

  console.log('Upgrade transaction hash:', upgradeHash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
