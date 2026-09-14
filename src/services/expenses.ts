import { supabase } from '@/lib/supabase';
import type { Expense, ExpenseSplit, SplitMethod } from '@/types/database';

export interface ExpenseWithSplits extends Expense {
  splits: ExpenseSplit[];
}

export async function getGroupExpenses(groupId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getExpense(expenseId: string): Promise<ExpenseWithSplits | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, splits:expense_splits(*)')
    .eq('id', expenseId)
    .single();

  if (error) throw error;
  return data as ExpenseWithSplits | null;
}

export interface CreateExpenseInput {
  groupId: string;
  title: string;
  amount: number;
  category: string;
  paidBy: string;
  splitMethod: SplitMethod;
  date: string;
  notes?: string;
  receiptUrl?: string;
  splits: { userId: string; amount: number; percentage?: number }[];
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      group_id: input.groupId,
      title: input.title,
      amount: input.amount,
      category: input.category,
      paid_by: input.paidBy,
      split_method: input.splitMethod,
      date: input.date,
      notes: input.notes ?? null,
      receipt_url: input.receiptUrl ?? null,
    })
    .select()
    .single();

  if (expenseError || !expense) throw expenseError ?? new Error('Failed to create expense');

  const splits = input.splits.map((s) => ({
    expense_id: expense.id,
    user_id: s.userId,
    amount: s.amount,
    percentage: s.percentage ?? null,
    is_settled: false,
  }));

  const { error: splitError } = await supabase.from('expense_splits').insert(splits);
  if (splitError) throw splitError;

  return expense;
}

export async function updateExpense(
  expenseId: string,
  updates: Partial<Pick<Expense, 'title' | 'amount' | 'category' | 'date' | 'notes'>>,
): Promise<void> {
  const { error } = await supabase.from('expenses').update(updates).eq('id', expenseId);
  if (error) throw error;
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

export async function getUserExpenses(userId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_splits!inner(user_id)')
    .eq('expense_splits.user_id', userId)
    .order('date', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}
