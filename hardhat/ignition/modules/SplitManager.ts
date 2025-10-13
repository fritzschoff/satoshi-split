import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('SplitManagerModule', (m) => {
  const splitManager = m.contract('SplitManager');

  return { splitManager };
});
