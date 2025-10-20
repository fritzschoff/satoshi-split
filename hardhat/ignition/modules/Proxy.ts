import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('ERC1967ProxyWrapper', (m) => {
  const erc1967ProxyWrapper = m.contract('ERC1967ProxyWrapper');

  return { erc1967ProxyWrapper };
});
