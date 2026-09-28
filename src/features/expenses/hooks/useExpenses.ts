import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteExpense,
  getExpenseCategories,
  getExpenses,
  saveExpense,
  type Expense,
  type ExpenseInput,
} from "../services/expenses.service";

export const expenseKeys = {
  root: ["expenses"] as const,
  categories: ["expenses", "categories"] as const,
  list: (vehicleId?: string) => ["expenses", "list", vehicleId ?? "all"] as const,
};

const noRetry = { retry: false } as const;

export function useExpenseCategories() {
  return useQuery({
    queryKey: expenseKeys.categories,
    queryFn: getExpenseCategories,
    ...noRetry,
  });
}

export function useExpenses(vehicleId?: string) {
  return useQuery({
    queryKey: expenseKeys.list(vehicleId),
    queryFn: () => getExpenses(vehicleId),
    ...noRetry,
  });
}

function invalidateExpenses(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: expenseKeys.root });
}

export function useSaveExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      input: ExpenseInput;
      opts: { id?: string | undefined; receipt?: File | null | undefined; removeReceipt?: boolean | undefined; oldReceipt?: string | null };
    }) => saveExpense(args.input, args.opts),
    onSuccess: () => invalidateExpenses(qc),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expense: Pick<Expense, "id" | "receipt_url" | "source">) => deleteExpense(expense),
    onSuccess: () => invalidateExpenses(qc),
  });
}
