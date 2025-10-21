'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Split, Spending, Debt } from '@/types/web3';

interface PendingSplit extends Omit<Split, 'spendings' | 'debts'> {
  spendings: Spending[];
  debts: Debt[];
  isPending: true;
  tempId: string;
  txHash?: string;
}

interface PendingSpending extends Spending {
  isPending: true;
  splitId: string;
}

interface PendingDebt extends Debt {
  isPending: true;
  splitId: string;
}

interface LocalStorageState {
  splits: Record<string, PendingSplit>;
  spendings: Record<string, PendingSpending>;
  debts: Record<string, PendingDebt>;
  splitIdMapping: Record<string, string>; // tempId -> realId
}

interface LocalStorageContextType {
  addPendingSplit: (split: Omit<PendingSplit, 'isPending'>) => void;
  getPendingSplit: (id: string) => PendingSplit | null;
  removePendingSplit: (id: string) => void;
  updateSplitId: (tempId: string, realId: string) => void;
  getAllPendingSplits: () => PendingSplit[];

  addPendingSpending: (spending: Omit<PendingSpending, 'isPending'>) => void;
  getPendingSpendings: (splitId: string) => PendingSpending[];
  removePendingSpending: (id: string) => void;

  addPendingDebt: (debt: Omit<PendingDebt, 'isPending'>) => void;
  getPendingDebts: (splitId: string) => PendingDebt[];
  removePendingDebt: (id: string) => void;

  clearAll: () => void;
  isReady: boolean;
}

const LocalStorageContext = createContext<LocalStorageContextType | undefined>(
  undefined
);

const STORAGE_KEY = 'satoshi-split-pending-state';

const getInitialState = (): LocalStorageState => {
  if (typeof window === 'undefined') {
    return {
      splits: {},
      spendings: {},
      debts: {},
      splitIdMapping: {},
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }

  return {
    splits: {},
    spendings: {},
    debts: {},
    splitIdMapping: {},
  };
};

export function LocalStorageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<LocalStorageState>(getInitialState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setState(getInitialState());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [state, isReady]);

  const addPendingSplit = useCallback(
    (split: Omit<PendingSplit, 'isPending'>) => {
      setState((prev) => ({
        ...prev,
        splits: {
          ...prev.splits,
          [split.tempId]: { ...split, isPending: true },
        },
      }));
    },
    []
  );

  const getPendingSplit = useCallback(
    (id: string): PendingSplit | null => {
      const tempId = Object.entries(state.splitIdMapping).find(
        ([_, realId]) => realId === id
      )?.[0];

      if (tempId) {
        return state.splits[tempId] || null;
      }

      return state.splits[id] || null;
    },
    [state.splits, state.splitIdMapping]
  );

  const removePendingSplit = useCallback((id: string) => {
    setState((prev) => {
      const newSplits = { ...prev.splits };
      const newMapping = { ...prev.splitIdMapping };

      delete newSplits[id];

      const tempId = Object.entries(prev.splitIdMapping).find(
        ([_, realId]) => realId === id
      )?.[0];

      if (tempId) {
        delete newSplits[tempId];
        delete newMapping[tempId];
      }

      return {
        ...prev,
        splits: newSplits,
        splitIdMapping: newMapping,
      };
    });
  }, []);

  const updateSplitId = useCallback((tempId: string, realId: string) => {
    setState((prev) => {
      const split = prev.splits[tempId];
      if (!split) return prev;

      const updatedSplit = { ...split, id: realId };

      return {
        ...prev,
        splits: {
          ...prev.splits,
          [tempId]: updatedSplit,
        },
        splitIdMapping: {
          ...prev.splitIdMapping,
          [tempId]: realId,
        },
      };
    });
  }, []);

  const getAllPendingSplits = useCallback((): PendingSplit[] => {
    return Object.values(state.splits);
  }, [state.splits]);

  const addPendingSpending = useCallback(
    (spending: Omit<PendingSpending, 'isPending'>) => {
      setState((prev) => ({
        ...prev,
        spendings: {
          ...prev.spendings,
          [spending.id]: { ...spending, isPending: true },
        },
      }));
    },
    []
  );

  const getPendingSpendings = useCallback(
    (splitId: string): PendingSpending[] => {
      return Object.values(state.spendings).filter(
        (spending) => spending.splitId === splitId
      );
    },
    [state.spendings]
  );

  const removePendingSpending = useCallback((id: string) => {
    setState((prev) => {
      const newSpendings = { ...prev.spendings };
      delete newSpendings[id];
      return {
        ...prev,
        spendings: newSpendings,
      };
    });
  }, []);

  const addPendingDebt = useCallback((debt: Omit<PendingDebt, 'isPending'>) => {
    setState((prev) => ({
      ...prev,
      debts: {
        ...prev.debts,
        [debt.id]: { ...debt, isPending: true },
      },
    }));
  }, []);

  const getPendingDebts = useCallback(
    (splitId: string): PendingDebt[] => {
      const tempId = Object.entries(state.splitIdMapping).find(
        ([_, realId]) => realId === splitId
      )?.[0];

      const idToCheck = tempId || splitId;
      return Object.values(state.debts).filter(
        (debt) => debt.splitId === idToCheck
      );
    },
    [state.debts, state.splitIdMapping]
  );

  const removePendingDebt = useCallback((id: string) => {
    setState((prev) => {
      const newDebts = { ...prev.debts };
      delete newDebts[id];
      return {
        ...prev,
        debts: newDebts,
      };
    });
  }, []);

  const clearAll = useCallback(() => {
    setState({
      splits: {},
      spendings: {},
      debts: {},
      splitIdMapping: {},
    });
  }, []);

  const contextValue: LocalStorageContextType = {
    addPendingSplit,
    getPendingSplit,
    removePendingSplit,
    updateSplitId,
    getAllPendingSplits,
    addPendingSpending,
    getPendingSpendings,
    removePendingSpending,
    addPendingDebt,
    getPendingDebts,
    removePendingDebt,
    clearAll,
    isReady,
  };

  return (
    <LocalStorageContext.Provider value={contextValue}>
      {children}
    </LocalStorageContext.Provider>
  );
}

export function useLocalStorage() {
  const context = useContext(LocalStorageContext);
  if (context === undefined) {
    throw new Error(
      'useLocalStorage must be used within a LocalStorageProvider'
    );
  }
  return context;
}
