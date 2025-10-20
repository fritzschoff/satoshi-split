import hre from 'hardhat';
import { encodeAbiParameters, parseAbiParameters } from 'viem';

async function main() {
  const { viem } = await hre.network.connect();

  const [deployer] = await viem.getWalletClients();
  const implementation = await viem.deployContract('SplitManager');
  const initializeData = encodeAbiParameters(parseAbiParameters('address'), [
    deployer.account.address,
  ]);
  const initCalldata = `0xc4d66de8${initializeData.slice(2)}` as `0x${string}`;

  const proxy = await viem.deployContract('ERC1967ProxyWrapper', [
    implementation.address,
    initCalldata,
  ]);
  console.log('Proxy deployed to:', proxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
