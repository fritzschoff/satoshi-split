import hre from 'hardhat';
import { Address } from 'viem';

async function main() {
  const proxyAddress = process.env.PROXY_ADDRESS || process.argv[2];

  if (!proxyAddress) {
    throw new Error(
      'Please provide proxy address as argument or set PROXY_ADDRESS env variable'
    );
  }

  const { viem } = await hre.network.connect();
  const publicClient = await viem.getPublicClient();

  const implementationSlot =
    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

  const implementationBytes = await publicClient.getStorageAt({
    address: proxyAddress as Address,
    slot: implementationSlot as `0x${string}`,
  });

  if (!implementationBytes) {
    throw new Error('Could not read implementation address');
  }

  const implementationAddress = `0x${implementationBytes.slice(-40)}`;
  console.log('Implementation address:', implementationAddress);

  const proxy = await viem.getContractAt(
    'SplitManager',
    proxyAddress as Address
  );
  const owner = await proxy.read.owner();
  console.log('Owner:', owner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
