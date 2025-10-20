import { useEffect, useState, useMemo } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useReadContract,
} from 'wagmi';
import { zeroAddress, parseUnits, encodeFunctionData } from 'viem';
import { ERC20_ABI, SPLIT_MANAGER_ABI } from '@/constants/contract-abi';
import { simulateContract } from 'viem/actions';
import { getTokenSymbol, getTokenDecimals } from '@/utils/token';
import {
  useGetSplit,
  useOptimisticAddExpense,
  useOptimisticPayDebt,
} from './useGraphQLQueries';

const SPLIT_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS || zeroAddress) as `0x${string}`;

export function useSplitDetail(splitId: string) {
  const { address, isConnected } = useAccount();
  const { data: split, isLoading, refetch } = useGetSplit(splitId);
  const publicClient = usePublicClient();

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [pendingPayment, setPendingPayment] = useState<{
    creditor: string;
    amount: string;
    isETH: boolean;
  } | null>(null);

  const addExpenseMutation = useOptimisticAddExpense(splitId);
  const payDebtMutation = useOptimisticPayDebt(splitId);

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

  const defaultToken = split?.defaultToken || zeroAddress;

  const { data: allowance } = useReadContract({
    address: defaultToken as `0x${string}`,
    abi: ERC20_ABI,
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
    if (split) {
      setSelectedMembers(split.members);
    }
  }, [split]);

  useEffect(() => {
    if (isExpenseSuccess || isPaymentSuccess) {
      setTimeout(() => {
        refetch();
      }, 3000);
    }
  }, [isExpenseSuccess, isPaymentSuccess, refetch]);

  useEffect(() => {
    if (isExpenseSuccess) {
      setExpenseTitle('');
      setExpenseAmount('');
      if (split) {
        setSelectedMembers(split.members);
      }
    }
  }, [isExpenseSuccess, split]);

  useEffect(() => {
    if (isApprovalSuccess && pendingPayment) {
      const { creditor, amount, isETH } = pendingPayment;
      const amountInUnits = BigInt(amount);

      payDebtMutation.mutate({
        creditor,
        debtor: address!,
        amount,
      });

      payDebtContract({
        address: SPLIT_CONTRACT_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'payDebt',
        args: [BigInt(splitId), creditor as `0x${string}`, amountInUnits],
        value: isETH ? amountInUnits : BigInt(0),
      });

      setPendingPayment(null);
    }
  }, [
    isApprovalSuccess,
    pendingPayment,
    payDebtMutation,
    payDebtContract,
    splitId,
    address,
  ]);

  const [tokenSymbol, tokenDecimals] = useMemo(
    () => [getTokenSymbol(defaultToken), getTokenDecimals(defaultToken)],
    [defaultToken]
  );

  const isCreator =
    split && address && split.creator.toLowerCase() === address.toLowerCase();
  const isMember =
    split &&
    address &&
    split.members.some(
      (member) => member.toLowerCase() === address.toLowerCase()
    );
  const userDebts = split?.debts.filter(
    (debt) =>
      debt.debtor.toLowerCase() === address?.toLowerCase() && !debt.isPaid
  );

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!split || !address) {
      console.log('No split or address:', { split, address });
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

      addExpenseMutation.mutate({
        title: expenseTitle,
        amount: amountInUnits.toString(),
        payer: address,
        token: defaultToken,
        forWho: selectedMembers,
      });

      try {
        const [gas] = await Promise.all([
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
    if (!split || !address) return;

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
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [SPLIT_CONTRACT_ADDRESS, amountInUnits],
        });

        return;
      }

      payDebtMutation.mutate({
        creditor,
        debtor: address,
        amount,
      });

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
      setSelectedMembers([...selectedMembers, member]);
    } else {
      setSelectedMembers(selectedMembers.filter((m) => m !== member));
    }
  };

  return {
    split,
    isLoading,
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
    userDebts,
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
    handleAddExpense,
    handlePayDebt,
    handleMemberToggle,
  };
}
