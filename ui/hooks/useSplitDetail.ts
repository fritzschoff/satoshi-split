import { useEffect, useState, useMemo } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useReadContract,
} from 'wagmi';
import { zeroAddress, parseUnits, encodeFunctionData, erc20Abi } from 'viem';
import { SPLIT_MANAGER_ABI } from '@/constants/contract-abi';
import { simulateContract } from 'viem/actions';
import { getTokenSymbol, getTokenDecimals } from '@/utils/token';
import { useSplitManagerData } from './useSplitManager';

const SPLIT_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS || zeroAddress) as `0x${string}`;

export function useSplitDetail(splitId: string) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const splitManagerData = useSplitManagerData(BigInt(splitId));

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [hasInitializedMembers, setHasInitializedMembers] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    creditor: string;
    amount: string;
    isETH: boolean;
  } | null>(null);

  const {
    writeContract: addExpense,
    data: expenseHash,
    isPending: isAddingExpense,
    error: expenseError,
  } = useWriteContract();
  const { isLoading: isConfirmingExpense, isSuccess: isExpenseSuccess } =
    useWaitForTransactionReceipt({
      hash: expenseHash,
    });

  const {
    writeContract: payDebtContract,
    data: paymentHash,
    isPending: isPayingDebt,
    error: paymentError,
  } = useWriteContract();
  const { isLoading: isConfirmingPayment, isSuccess: isPaymentSuccess } =
    useWaitForTransactionReceipt({
      hash: paymentHash,
    });

  const {
    writeContract: removeMemberContract,
    data: removeMemberHash,
    isPending: isRemovingMember,
    error: removeMemberError,
  } = useWriteContract();
  const {
    isLoading: isConfirmingRemoveMember,
    isSuccess: isRemoveMemberSuccess,
  } = useWaitForTransactionReceipt({
    hash: removeMemberHash,
  });

  const {
    writeContract: removeSpendingContract,
    data: removeSpendingHash,
    isPending: isRemovingSpending,
    error: removeSpendingError,
  } = useWriteContract();
  const {
    isLoading: isConfirmingRemoveSpending,
    isSuccess: isRemoveSpendingSuccess,
  } = useWaitForTransactionReceipt({
    hash: removeSpendingHash,
  });

  const {
    writeContract: addMemberToSpendingContract,
    data: addMemberToSpendingHash,
    isPending: isAddingMemberToSpending,
    error: addMemberToSpendingError,
  } = useWriteContract();
  const {
    isLoading: isConfirmingAddMemberToSpending,
    isSuccess: isAddMemberToSpendingSuccess,
  } = useWaitForTransactionReceipt({
    hash: addMemberToSpendingHash,
  });

  const defaultToken =
    splitManagerData.splitDetails.data?.defaultToken || zeroAddress;

  const { data: allowance } = useReadContract({
    address: defaultToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address as `0x${string}`, SPLIT_CONTRACT_ADDRESS],
    query: {
      enabled: !!address && defaultToken !== zeroAddress,
    },
  });

  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApprovingExpense,
    error: approveError,
  } = useWriteContract();
  const { isLoading: isConfirmingApproval, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  useEffect(() => {
    if (splitManagerData.splitDetails.data && !hasInitializedMembers) {
      setSelectedMembers(splitManagerData.splitDetails.data.members);
      setHasInitializedMembers(true);
    }
  }, [splitManagerData.splitDetails.data, hasInitializedMembers]);

  useEffect(() => {
    if (
      isExpenseSuccess ||
      isPaymentSuccess ||
      isRemoveMemberSuccess ||
      isRemoveSpendingSuccess ||
      isAddMemberToSpendingSuccess
    ) {
      setTimeout(() => {
        splitManagerData.refetch();
      }, 3000);
    }
  }, [
    isExpenseSuccess,
    isPaymentSuccess,
    isRemoveMemberSuccess,
    isRemoveSpendingSuccess,
    isAddMemberToSpendingSuccess,
    splitManagerData.refetch,
  ]);

  useEffect(() => {
    if (isExpenseSuccess) {
      setExpenseTitle('');
      setExpenseAmount('');
      if (splitManagerData.splitDetails.data) {
        setSelectedMembers(splitManagerData.splitDetails.data.members);
        setHasInitializedMembers(true);
      }
    }
  }, [isExpenseSuccess, splitManagerData.splitDetails.data]);

  useEffect(() => {
    if (isApprovalSuccess && pendingPayment) {
      const { creditor, amount, isETH } = pendingPayment;
      const amountInUnits = BigInt(amount);

      payDebtContract({
        address: SPLIT_CONTRACT_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'payDebt',
        args: [BigInt(splitId), creditor as `0x${string}`, amountInUnits],
        value: isETH ? amountInUnits : BigInt(0),
      });

      setPendingPayment(null);
    }
  }, [isApprovalSuccess, pendingPayment, payDebtContract, splitId, address]);

  const [tokenSymbol, tokenDecimals] = useMemo(
    () => [getTokenSymbol(defaultToken), getTokenDecimals(defaultToken)],
    [defaultToken]
  );

  const isCreator =
    splitManagerData.splitDetails.data &&
    address &&
    splitManagerData.splitDetails.data.creator?.toLowerCase() ===
      address.toLowerCase();
  const isMember =
    splitManagerData.splitDetails.data &&
    address &&
    splitManagerData.splitDetails.data.members.some(
      (member) => member.toLowerCase() === address.toLowerCase()
    );

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!splitManagerData.splitDetails.data || !address) {
      return;
    }

    if (!expenseTitle.trim()) {
      alert('Please enter an expense description');
      return;
    }

    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (selectedMembers.length === 0) {
      alert('Please select at least one member to split with');
      return;
    }

    try {
      const amountInUnits = parseUnits(expenseAmount, tokenDecimals);

      try {
        const [gas, simulationResult] = await Promise.all([
          publicClient!.estimateGas({
            account: address,
            to: SPLIT_CONTRACT_ADDRESS,
            data: encodeFunctionData({
              abi: SPLIT_MANAGER_ABI,
              functionName: 'addSpending',
              args: [
                BigInt(splitId),
                expenseTitle,
                amountInUnits,
                selectedMembers as `0x${string}`[],
              ],
            }),
          }),
          simulateContract(publicClient!, {
            account: address,
            address: SPLIT_CONTRACT_ADDRESS,
            abi: SPLIT_MANAGER_ABI,
            functionName: 'addSpending',
            args: [
              BigInt(splitId),
              expenseTitle,
              amountInUnits,
              selectedMembers as `0x${string}`[],
            ],
          }),
        ]);

        addExpense({
          account: address,
          address: SPLIT_CONTRACT_ADDRESS,
          abi: SPLIT_MANAGER_ABI,
          functionName: 'addSpending',
          args: [
            BigInt(splitId),
            expenseTitle,
            amountInUnits,
            selectedMembers as `0x${string}`[],
          ],
          gas: gas,
        });
      } catch (simulationError) {
        console.error('Simulation failed:', simulationError);
        alert(
          `Transaction would fail: ${
            simulationError instanceof Error
              ? simulationError.message
              : 'Unknown error'
          }`
        );
        return;
      }
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Error adding expense. Please try again.');
    }
  };

  const handlePayDebt = async (
    creditor: string,
    amount: string,
    isETH: boolean
  ) => {
    if (!splitManagerData.splitDetails.data || !address) return;

    try {
      const amountInUnits = BigInt(amount);

      if (
        defaultToken !== zeroAddress &&
        allowance !== undefined &&
        allowance < amountInUnits
      ) {
        setPendingPayment({ creditor, amount, isETH });

        approve({
          address: defaultToken as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [SPLIT_CONTRACT_ADDRESS, amountInUnits],
        });

        return;
      }

      payDebtContract({
        address: SPLIT_CONTRACT_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'payDebt',
        args: [BigInt(splitId), creditor as `0x${string}`, amountInUnits],
        value: isETH ? amountInUnits : BigInt(0),
      });
    } catch (err) {
      console.error('Error paying debt:', err);
      alert('Error paying debt. Please try again.');
    }
  };

  const handleMemberToggle = (member: string, checked: boolean) => {
    if (checked) {
      if (!selectedMembers.includes(member)) {
        setSelectedMembers([...selectedMembers, member]);
      }
    } else {
      setSelectedMembers(selectedMembers.filter((m) => m !== member));
    }
  };

  const handleRemoveMember = async (member: string) => {
    if (!splitManagerData.splitDetails.data || !address) return;

    try {
      removeMemberContract({
        address: SPLIT_CONTRACT_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'removeMember',
        args: [BigInt(splitId), member as `0x${string}`],
      });
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Error removing member. Please try again.');
    }
  };

  const handleRemoveSpending = async (spendingId: string) => {
    if (!splitManagerData.splitDetails.data || !address) return;

    try {
      removeSpendingContract({
        address: SPLIT_CONTRACT_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'removeSpending',
        args: [BigInt(splitId), BigInt(spendingId)],
      });
    } catch (err) {
      console.error('Error removing spending:', err);
      alert('Error removing spending. Please try again.');
    }
  };

  const handleAddMemberToSpending = async (
    spendingId: string,
    member: string
  ) => {
    if (!splitManagerData.splitDetails.data || !address) return;

    try {
      console.log('Adding member to spending:', {
        spendingId,
        member,
        splitId,
      });
      addMemberToSpendingContract({
        address: SPLIT_CONTRACT_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'addMemberToSpending',
        args: [BigInt(splitId), BigInt(spendingId), member as `0x${string}`],
      });
    } catch (err) {
      console.error('Error adding member to spending:', err);
    }
  };

  return {
    split: splitManagerData,
    isLoading: splitManagerData.isLoading,
    isConnected,
    address,
    expenseTitle,
    setExpenseTitle,
    expenseAmount,
    setExpenseAmount,
    selectedMembers,
    defaultToken,
    tokenSymbol,
    tokenDecimals,
    isCreator,
    isMember,
    isAddingExpense,
    isConfirmingExpense,
    expenseError,
    isExpenseSuccess,
    isPayingDebt,
    isApprovingExpense,
    isConfirmingApproval,
    approveError,
    isApprovalSuccess,
    isConfirmingPayment,
    paymentError,
    isPaymentSuccess,
    isRemovingMember,
    isConfirmingRemoveMember,
    removeMemberError,
    isRemoveMemberSuccess,
    isRemovingSpending,
    isConfirmingRemoveSpending,
    removeSpendingError,
    isRemoveSpendingSuccess,
    isAddingMemberToSpending,
    isConfirmingAddMemberToSpending,
    addMemberToSpendingError,
    isAddMemberToSpendingSuccess,
    handleAddExpense,
    handlePayDebt,
    handleMemberToggle,
    handleRemoveMember,
    handleRemoveSpending,
    handleAddMemberToSpending,
  };
}
