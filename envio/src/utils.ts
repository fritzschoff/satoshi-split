import { S, experimental_createEffect } from 'envio';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

export const getLatestEthPrice = experimental_createEffect(
  {
    name: 'getLatestEthPrice',
    input: {
      chainId: S.number,
    },
    output: S.union([S.bigint, null]),
  },
  async ({ input }) => {
    if (input.chainId !== 1) {
      return null;
    }

    try {
      const priceFeedAddress = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';

      const abi = [
        {
          inputs: [],
          name: 'latestAnswer',
          outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ];

      const result = await publicClient.readContract({
        abi,
        address: priceFeedAddress,
        functionName: 'latestAnswer',
        args: [],
      });

      return result as bigint;
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      return null;
    }
  }
);
