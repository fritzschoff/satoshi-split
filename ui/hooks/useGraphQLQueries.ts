import { useQuery } from '@tanstack/react-query';
import {
  graphqlClient,
  getSplitQuery,
  getUserSplitsQuery,
  getAllSplitsQuery,
  getUserActivityQuery,
  getUserBridgeActivityQuery,
} from '@/lib/graphql-client';
import { Split, UserActivity, BridgeActivity } from '@/types/web3';
import { useLocalStorage } from '@/components/providers/LocalStorageProvider';
import { useEffect } from 'react';

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
  const {
    getPendingSplit,
    removePendingSplit,
    getPendingSpendings,
    removePendingSpending,
    getPendingDebts,
    isReady,
  } = useLocalStorage();

  const query = useQuery({
    queryKey: splitKeys.detail(id),
    queryFn: async () => {
      const data: Record<'Split', Split[]> = await graphqlClient.request(
        getSplitQuery,
        { id }
      );
      return data.Split?.[0] || null;
    },
    enabled: !!id && isReady,
  });

  useEffect(() => {
    if (query.data && id && isReady) {
      const pendingSplit = getPendingSplit(id);
      if (pendingSplit) {
        removePendingSplit(id);
      }

      const pendingSpendings = getPendingSpendings(id);
      if (pendingSpendings.length > 0) {
        const indexedSpendingSignatures = new Map(
          query.data.spendings.map((s) => {
            const signature = `${s.title}-${s.payer.toLowerCase()}-${s.amount}`;
            return [signature, s];
          })
        );

        pendingSpendings.forEach((pendingSpending) => {
          const pendingSignature = `${
            pendingSpending.title
          }-${pendingSpending.payer.toLowerCase()}-${pendingSpending.amount}`;

          if (indexedSpendingSignatures.has(pendingSignature)) {
            removePendingSpending(pendingSpending.id);
          }
        });
      }
    }
  }, [
    query.data,
    id,
    getPendingSplit,
    removePendingSplit,
    getPendingSpendings,
    removePendingSpending,
    isReady,
  ]);

  const pendingSplit = !query.data && id ? getPendingSplit(id) : null;
  const pendingSpendings = id ? getPendingSpendings(id) : [];
  const pendingDebts = id ? getPendingDebts(id) : [];

  const mergedData = query.data
    ? {
        ...query.data,
        spendings: [...query.data.spendings, ...pendingSpendings],
        debts: [...query.data.debts, ...pendingDebts],
      }
    : pendingSplit
    ? {
        ...pendingSplit,
        spendings: [...pendingSplit.spendings, ...pendingSpendings],
        debts: [...pendingSplit.debts, ...pendingDebts],
      }
    : null;

  return {
    ...query,
    data: mergedData,
  };
}

export function useGetUserSplits(address?: string) {
  const { getAllPendingSplits, removePendingSplit, isReady } =
    useLocalStorage();

  const query = useQuery({
    queryKey: splitKeys.userSplits(address || ''),
    queryFn: async () => {
      const data: Record<'Split', Split[]> = await graphqlClient.request(
        getUserSplitsQuery,
        { address: address!.toLowerCase() }
      );
      return data.Split || [];
    },
    enabled: !!address && isReady,
  });

  useEffect(() => {
    if (query.data && address && isReady) {
      const pendingSplits = getAllPendingSplits();
      const indexedIds = new Set(query.data.map((split) => split.id));

      pendingSplits.forEach((pendingSplit) => {
        if (
          indexedIds.has(pendingSplit.id) ||
          indexedIds.has(pendingSplit.tempId)
        ) {
          console.log(
            'Split found in indexer, removing from localStorage:',
            pendingSplit.id
          );
          removePendingSplit(pendingSplit.tempId);
        }
      });
    }
  }, [query.data, address, getAllPendingSplits, removePendingSplit, isReady]);

  const pendingSplits = address
    ? getAllPendingSplits().filter((split) =>
        split.members.some(
          (member) => member.toLowerCase() === address.toLowerCase()
        )
      )
    : [];

  const mergedData = query.data
    ? [...query.data, ...pendingSplits]
    : pendingSplits;

  return {
    ...query,
    data: mergedData,
  };
}

export function useGetAllSplits(limit = 100, offset = 0) {
  const { getAllPendingSplits, removePendingSplit, isReady } =
    useLocalStorage();

  const query = useQuery({
    queryKey: splitKeys.list({ limit, offset }),
    queryFn: async () => {
      const data: Record<'Split', Split[]> = await graphqlClient.request(
        getAllSplitsQuery,
        { limit, offset }
      );
      return data.Split || [];
    },
    enabled: isReady,
  });

  useEffect(() => {
    if (query.data && isReady) {
      const pendingSplits = getAllPendingSplits();
      const indexedIds = new Set(query.data.map((split) => split.id));

      pendingSplits.forEach((pendingSplit) => {
        if (
          indexedIds.has(pendingSplit.id) ||
          indexedIds.has(pendingSplit.tempId)
        ) {
          console.log(
            'Split found in indexer, removing from localStorage:',
            pendingSplit.id
          );
          removePendingSplit(pendingSplit.tempId);
        }
      });
    }
  }, [query.data, getAllPendingSplits, removePendingSplit, isReady]);

  const pendingSplits = getAllPendingSplits();
  const mergedData = query.data
    ? [...query.data, ...pendingSplits]
    : pendingSplits;

  return {
    ...query,
    data: mergedData,
  };
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
