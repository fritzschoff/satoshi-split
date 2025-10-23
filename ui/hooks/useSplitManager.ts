import { useQuery } from '@tanstack/react-query';
import { SPLIT_MANAGER_ABI } from '@/constants/contract-abi';
import { Address, createPublicClient, http, zeroAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { Split } from '@/types/web3';

const SPLIT_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS ||
  zeroAddress) as `0x${string}`;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export interface SplitDetails {
  creator: Address;
  members: Address[];
  createdAt: bigint;
  totalDebt: bigint;
  defaultToken: Address;
  spendingCounter: bigint;
}

export interface Spending {
  id: bigint;
  title: string;
  payer: Address;
  amount: bigint;
  forWho: Address[];
  timestamp: bigint;
  token: Address;
}

export interface Debt {
  debtor: Address;
  creditor: Address;
  amount: bigint;
  token: Address;
  isPaid: boolean;
}

export type DebtorDebts = [Address[], bigint[]];

export function useSplitDetails(splitId: bigint | undefined) {
  return useQuery({
    queryKey: ['splitDetails', splitId?.toString()],
    queryFn: async () => {
      if (splitId === undefined) return null;
      const result = await publicClient.readContract({
        address: SPLIT_MANAGER_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'getSplitDetails',
        args: [splitId],
      });
      return {
        creator: result[0],
        members: result[1],
        createdAt: result[2],
        totalDebt: result[3],
        defaultToken: result[4],
        spendingCounter: result[5],
      } as unknown as SplitDetails;
    },
    enabled: splitId !== undefined,
  });
}

export function useSplitSpendings(splitId: bigint | undefined) {
  return useQuery({
    queryKey: ['splitSpendings', splitId?.toString()],
    queryFn: async () => {
      if (splitId === undefined) return [];
      const result = await publicClient.readContract({
        address: SPLIT_MANAGER_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'getSpendings',
        args: [splitId],
      });
      return result as Spending[];
    },
    enabled: splitId !== undefined,
  });
}

export function useDebt(
  splitId: bigint | undefined,
  debtor: Address | undefined,
  creditor: Address | undefined
) {
  return useQuery({
    queryKey: ['debt', splitId?.toString(), debtor, creditor],
    queryFn: async () => {
      if (
        splitId === undefined ||
        debtor === undefined ||
        creditor === undefined
      )
        return null;
      const result = await publicClient.readContract({
        address: SPLIT_MANAGER_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'getDebt',
        args: [splitId, debtor, creditor],
      });
      return result as Debt;
    },
    enabled: !!(splitId && debtor && creditor),
  });
}

export function useDebtorDebts(
  splitId: bigint | undefined,
  debtor: Address | undefined
) {
  return useQuery({
    queryKey: ['debtorDebts', splitId?.toString(), debtor],
    queryFn: async () => {
      if (splitId === undefined || debtor === undefined) return null;
      const result = await publicClient.readContract({
        address: SPLIT_MANAGER_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'getDebtorDebts',
        args: [splitId, debtor],
      });
      return result as unknown as DebtorDebts;
    },
    enabled: splitId !== undefined && debtor !== undefined,
  });
}

export function useSplitIdCounter() {
  return useQuery({
    queryKey: ['splitIdCounter'],
    queryFn: async () => {
      const result = await publicClient.readContract({
        address: SPLIT_MANAGER_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'splitIdCounter',
      });
      return result as bigint;
    },
  });
}

export function useGetAllSplits() {
  return useQuery({
    queryKey: ['getAllSplits'],
    queryFn: async () => {
      const splitCounter = await publicClient.readContract({
        address: SPLIT_MANAGER_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'splitIdCounter',
      });

      const splits = await Promise.all(
        Array.from({ length: Number(splitCounter) }, async (_, index) => {
          const result = await publicClient.readContract({
            address: SPLIT_MANAGER_ADDRESS,
            abi: SPLIT_MANAGER_ABI,
            functionName: 'splits',
            args: [BigInt(index)],
          });
          return result as unknown as Split;
        })
      );
      return splits;
    },
  });
}

export function useSplitManagerData(splitId: bigint | undefined) {
  const splitDetails = useSplitDetails(splitId);
  const spendings = useSplitSpendings(splitId);
  const splitIdCounter = useSplitIdCounter();

  return {
    splitDetails,
    spendings,
    splitIdCounter,
    isLoading:
      splitDetails.isLoading || spendings.isLoading || splitIdCounter.isLoading,
    isError:
      splitDetails.isError || spendings.isError || splitIdCounter.isError,
    error: splitDetails.error || spendings.error || splitIdCounter.error,
    refetch: () => {
      splitDetails.refetch();
      spendings.refetch();
      splitIdCounter.refetch();
    },
  };
}

export function useSplitDebts(splitId: bigint | undefined) {
  const splitDetails = useSplitDetails(splitId);

  const members = (splitDetails.data as unknown as SplitDetails)?.members || [];

  return useQuery({
    queryKey: ['splitDebts', splitId?.toString()],
    queryFn: async () => {
      if (splitId === undefined || members.length === 0) return [];

      const debtPromises = members.flatMap((debtor: Address) =>
        members.map(async (creditor: Address) => {
          const result = await publicClient.readContract({
            address: SPLIT_MANAGER_ADDRESS,
            abi: SPLIT_MANAGER_ABI,
            functionName: 'getDebt',
            args: [splitId, debtor, creditor],
          });
          return result as Debt;
        })
      );

      return Promise.all(debtPromises);
    },
    enabled: !!(splitId && members.length > 0),
  });
}

export function useMemberDebts(
  splitIds: bigint[],
  member: Address | undefined
) {
  return useQuery({
    queryKey: ['memberDebts', splitIds.map((id) => id.toString()), member],
    queryFn: async () => {
      if (member === undefined || splitIds.length === 0) return [];

      const debtPromises = splitIds.map(async (splitId) => {
        const result = await publicClient.readContract({
          address: SPLIT_MANAGER_ADDRESS,
          abi: SPLIT_MANAGER_ABI,
          functionName: 'getDebtorDebts',
          args: [splitId, member],
        });
        return { splitId, debts: result as unknown as DebtorDebts };
      });

      return Promise.all(debtPromises);
    },
    enabled: !!(member && splitIds.length > 0),
  });
}

export function useSpendingDetails(
  splitId: bigint | undefined,
  spendingId: bigint | undefined
) {
  const spendings = useSplitSpendings(splitId);

  return useQuery({
    queryKey: ['spendingDetails', splitId?.toString(), spendingId?.toString()],
    queryFn: async () => {
      if (spendingId === undefined) return null;
      const spending = spendings.data?.find((s) => s.id === spendingId);
      return spending || null;
    },
    enabled: !!(splitId && spendingId && spendings.data),
  });
}

export function useSplitExists(splitId: bigint | undefined) {
  const splitIdCounter = useSplitIdCounter();

  return useQuery({
    queryKey: ['splitExists', splitId?.toString()],
    queryFn: async () => {
      if (!splitId) return false;
      return (splitIdCounter.data || BigInt(0)) > splitId;
    },
    enabled: !!splitId && !!splitIdCounter.data,
  });
}

export { SPLIT_MANAGER_ADDRESS };
