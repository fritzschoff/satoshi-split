import { useState, useEffect, useRef } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { SPLIT_MANAGER_ABI } from '@/constants/contract-abi';
import { useRouter } from 'next/navigation';
import { sepolia } from 'wagmi/chains';
import { zeroAddress, decodeEventLog } from 'viem';
import {
  useOptimisticCreateSplit,
  useUpdateSplitIdAfterCreation,
} from './useGraphQLQueries';
import { TOKENS } from '@/constants/tokens';

const SPLIT_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS || zeroAddress) as `0x${string}`;

export function useCreateSplit() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const router = useRouter();

  const [members, setMembers] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0].address);
  const [validationError, setValidationError] = useState<string>('');
  const [createdSplitId, setCreatedSplitId] = useState<string | null>(null);
  const tempSplitIdRef = useRef<string | null>(null);

  const createSplitMutation = useOptimisticCreateSplit();
  const updateSplitId = useUpdateSplitIdAfterCreation();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const isOnSepolia = chainId === sepolia.id;

  useEffect(() => {
    if (isSuccess && receipt) {
      const splitCreatedEvent = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: SPLIT_MANAGER_ABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'SplitCreated';
        } catch {
          return false;
        }
      });

      if (splitCreatedEvent) {
        try {
          const decoded = decodeEventLog({
            abi: SPLIT_MANAGER_ABI,
            data: splitCreatedEvent.data,
            topics: splitCreatedEvent.topics,
          });

          if (decoded.eventName === 'SplitCreated') {
            const splitId = decoded.args.splitId.toString();
            setCreatedSplitId(splitId);

            if (tempSplitIdRef.current) {
              updateSplitId(tempSplitIdRef.current, splitId);
            }

            setTimeout(() => {
              router.push(`/split/${splitId}`);
            }, 2000);
          }
        } catch (error) {
          console.error('Error decoding event:', error);
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      }
    }
  }, [isSuccess, receipt, router, updateSplitId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!isConnected || !address) {
      setValidationError('Please connect your wallet');
      return;
    }

    if (!isOnSepolia) {
      setValidationError('Please switch to Sepolia network to create a split');
      return;
    }

    const memberAddresses = members
      .split(',')
      .map((addr) => addr.trim().toLowerCase())
      .filter((addr) => addr.length > 0 && addr.startsWith('0x'));

    if (memberAddresses.length === 0) {
      setValidationError('Please add at least one member address');
      return;
    }

    const creatorAddress = address.toLowerCase();
    if (memberAddresses.includes(creatorAddress)) {
      setValidationError(
        'You cannot add yourself as a member. You are automatically added as the admin.'
      );
      return;
    }

    const uniqueAddresses = new Set(memberAddresses);
    if (uniqueAddresses.size !== memberAddresses.length) {
      setValidationError(
        'Duplicate addresses detected. Each member can only be added once.'
      );
      return;
    }

    try {
      const allMembers = [address, ...memberAddresses];

      const tempSplitId = `temp-${Date.now()}`;
      tempSplitIdRef.current = tempSplitId;

      createSplitMutation.mutate({
        id: tempSplitId,
        creator: address,
        members: allMembers,
        defaultToken: selectedToken,
      });

      await writeContract({
        address: SPLIT_CONTRACT_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'createSplit',
        args: [
          memberAddresses as `0x${string}`[],
          selectedToken as `0x${string}`,
        ],
      });
    } catch (err) {
      console.error('Error creating split:', err);
    }
  };

  return {
    isConnected,
    address,
    chainId,
    members,
    setMembers,
    selectedToken,
    setSelectedToken,
    validationError,
    createdSplitId,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isOnSepolia,
    switchChain,
    handleSubmit,
    TOKENS,
  };
}
