import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  graphqlClient,
  getSplitQuery,
  getUserSplitsQuery,
  getAllSplitsQuery,
  getUserActivityQuery,
  getUserBridgeActivityQuery,
} from '@/lib/graphql-client';
import {
  Split,
  UserActivity,
  BridgeActivity,
  Spending,
  Debt,
} from '@/types/web3';

export const splitKeys = {
  all: ['splits'] as const,
  lists: () => [...splitKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...splitKeys.lists(), filters] as const,
  details: () => [...splitKeys.all, 'detail'] as const,
  detail: (id: string) => [...splitKeys.details(), id] as const,
  userSplits: (address: string) => [...splitKeys.all, 'user', address] as const,
};

export const activityKeys = {
  all: ['activity'] as const,
  user: (address: string) => [...activityKeys.all, 'user', address] as const,
  bridge: (address: string) =>
    [...activityKeys.all, 'bridge', address] as const,
};

export function useGetSplit(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: splitKeys.detail(id),
    queryFn: async () => {
      const data: Record<'Split', Split[]> = await graphqlClient.request(
        getSplitQuery,
        { id }
      );
      return data.Split?.[0] || null;
    },
    enabled: !!id,
    initialData: () => {
      const cachedSplit = queryClient.getQueryData<Split>(splitKeys.detail(id));
      if (cachedSplit) {
        return cachedSplit;
      }

      const allSplits = queryClient.getQueryData<Split[]>(splitKeys.list());
      if (allSplits) {
        return allSplits.find((split) => split.id === id) || undefined;
      }

      return undefined;
    },
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(splitKeys.detail(id))?.dataUpdatedAt;
    },
  });
}

export function useGetUserSplits(address?: string) {
  return useQuery({
    queryKey: splitKeys.userSplits(address || ''),
    queryFn: async () => {
      const data: Record<'Split', Split[]> = await graphqlClient.request(
        getUserSplitsQuery,
        { address: address!.toLowerCase() }
      );
      return data.Split || [];
    },
    enabled: !!address,
  });
}

export function useGetAllSplits(limit = 100, offset = 0) {
  return useQuery({
    queryKey: splitKeys.list({ limit, offset }),
    queryFn: async () => {
      const data: Record<'Split', Split[]> = await graphqlClient.request(
        getAllSplitsQuery,
        { limit, offset }
      );
      return data.Split || [];
    },
  });
}

export function useGetUserActivity(address?: string) {
  return useQuery({
    queryKey: activityKeys.user(address || ''),
    queryFn: async () => {
      const data: Record<'UserActivity', UserActivity[]> =
        await graphqlClient.request(getUserActivityQuery, {
          address: address!.toLowerCase(),
        });
      return data.UserActivity?.[0] || null;
    },
    enabled: !!address,
  });
}

export function useGetBridgeActivity(address?: string) {
  return useQuery({
    queryKey: activityKeys.bridge(address || ''),
    queryFn: async () => {
      const data: BridgeActivity = await graphqlClient.request(
        getUserBridgeActivityQuery,
        {
          address: address!.toLowerCase(),
          limit: 1000,
        }
      );
      return data;
    },
    enabled: !!address,
  });
}

export function useOptimisticAddExpense(splitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: {
      title: string;
      amount: string;
      payer: string;
      token: string;
      forWho: string[];
    }) => {
      return expense;
    },
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: splitKeys.detail(splitId) });

      const previousSplit = queryClient.getQueryData<Split>(
        splitKeys.detail(splitId)
      );

      if (previousSplit) {
        const optimisticSpending: Spending = {
          id: `temp-${Date.now()}`,
          spendingId: `temp-${Date.now()}`,
          title: newExpense.title,
          payer: newExpense.payer,
          amount: newExpense.amount,
          forWho: newExpense.forWho,
          timestamp: String(Math.floor(Date.now() / 1000)),
          token: newExpense.token,
          txHash: '',
          chainId: 11155111,
        };

        queryClient.setQueryData<Split>(splitKeys.detail(splitId), {
          ...previousSplit,
          spendings: [...previousSplit.spendings, optimisticSpending],
        });
      }

      return { previousSplit };
    },
    onError: (err, newExpense, context) => {
      if (context?.previousSplit) {
        queryClient.setQueryData(
          splitKeys.detail(splitId),
          context.previousSplit
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: splitKeys.detail(splitId) });
      }, 3000);
    },
  });
}

export function useOptimisticPayDebt(splitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: {
      creditor: string;
      debtor: string;
      amount: string;
    }) => {
      return payment;
    },
    onMutate: async (payment) => {
      await queryClient.cancelQueries({ queryKey: splitKeys.detail(splitId) });

      const previousSplit = queryClient.getQueryData<Split>(
        splitKeys.detail(splitId)
      );

      if (previousSplit) {
        const updatedDebts = previousSplit.debts.map((debt) => {
          if (
            debt.creditor.toLowerCase() === payment.creditor.toLowerCase() &&
            debt.debtor.toLowerCase() === payment.debtor.toLowerCase() &&
            debt.amount === payment.amount
          ) {
            return {
              ...debt,
              isPaid: true,
              paidAt: String(Math.floor(Date.now() / 1000)),
            };
          }
          return debt;
        });

        queryClient.setQueryData<Split>(splitKeys.detail(splitId), {
          ...previousSplit,
          debts: updatedDebts,
        });
      }

      return { previousSplit };
    },
    onError: (err, payment, context) => {
      if (context?.previousSplit) {
        queryClient.setQueryData(
          splitKeys.detail(splitId),
          context.previousSplit
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: splitKeys.detail(splitId) });
      }, 3000);
    },
  });
}

export function useOptimisticCreateSplit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (split: {
      id: string;
      creator: string;
      members: string[];
      defaultToken: string;
    }) => {
      return split;
    },
    onMutate: async (newSplit) => {
      await queryClient.cancelQueries({ queryKey: splitKeys.lists() });

      const previousSplits = queryClient.getQueryData<Split[]>(
        splitKeys.list()
      );

      const optimisticSplit: Split = {
        id: newSplit.id,
        creator: newSplit.creator,
        members: newSplit.members,
        defaultToken: newSplit.defaultToken,
        createdAt: String(Math.floor(Date.now() / 1000)),
        totalDebt: '0',
        spendings: [],
        debts: [],
      };

      if (previousSplits) {
        queryClient.setQueryData<Split[]>(splitKeys.list(), [
          optimisticSplit,
          ...previousSplits,
        ]);
      }

      queryClient.setQueryData<Split>(
        splitKeys.detail(newSplit.id),
        optimisticSplit
      );

      return { previousSplits, tempId: newSplit.id };
    },
    onError: (err, newSplit, context) => {
      if (context?.previousSplits) {
        queryClient.setQueryData(splitKeys.list(), context.previousSplits);
      }
      queryClient.removeQueries({ queryKey: splitKeys.detail(newSplit.id) });
    },
    onSuccess: (split, variables, context) => {
      if (context?.tempId && context.tempId !== split.id) {
        queryClient.removeQueries({
          queryKey: splitKeys.detail(context.tempId),
        });
      }
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: splitKeys.lists() });
      }, 3000);
    },
  });
}

export function useUpdateSplitIdAfterCreation() {
  const queryClient = useQueryClient();

  return (tempId: string, realId: string) => {
    const tempSplit = queryClient.getQueryData<Split>(splitKeys.detail(tempId));

    if (tempSplit) {
      queryClient.setQueryData<Split>(splitKeys.detail(realId), {
        ...tempSplit,
        id: realId,
      });

      const allSplits = queryClient.getQueryData<Split[]>(splitKeys.list());
      if (allSplits) {
        const updatedSplits = allSplits.map((split) =>
          split.id === tempId ? { ...split, id: realId } : split
        );
        queryClient.setQueryData<Split[]>(splitKeys.list(), updatedSplits);
      }

      queryClient.removeQueries({ queryKey: splitKeys.detail(tempId) });
    }

    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: splitKeys.detail(realId) });
      queryClient.invalidateQueries({ queryKey: splitKeys.lists() });
    }, 3000);
  };
}
