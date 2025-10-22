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
  const query = useQuery({
    queryKey: splitKeys.detail(id),
    queryFn: async () => {
      const data: Record<'Split', Split[]> = await graphqlClient.request(
        getSplitQuery,
        { id }
      );
      return data.Split?.[0] || null;
    },
    enabled: !!id,
  });

  return query;
}

export function useGetUserSplits(address?: string) {
  const query = useQuery({
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

  return query;
}

export function useGetAllSplits(limit = 100, offset = 0) {
  const query = useQuery({
    queryKey: splitKeys.list({ limit, offset }),
    queryFn: async () => {
      const data: Record<'Split', Split[]> = await graphqlClient.request(
        getAllSplitsQuery,
        { limit, offset }
      );
      return data.Split || [];
    },
    enabled: true,
  });

  return query;
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
