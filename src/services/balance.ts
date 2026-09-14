import { supabase } from '@/lib/supabase';

export interface UserBalance {
  userId: string;
  name: string;
  totalOwed: number;
  totalOwing: number;
  net: number;
}

export interface PairwiseDebt {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface GroupBalanceSummary {
  groupId: string;
  balances: UserBalance[];
  simplifiedDebts: PairwiseDebt[];
}

export async function getGroupBalances(groupId: string): Promise<GroupBalanceSummary> {
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, splits:expense_splits(*)')
    .eq('group_id', groupId);

  const { data: settlements } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'confirmed');

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profile:profiles(full_name)')
    .eq('group_id', groupId);

  const nameMap = new Map<string, string>();
  for (const m of members ?? []) {
    const profile = m.profile as unknown as { full_name: string } | null;
    nameMap.set(m.user_id, profile?.full_name ?? 'Unknown');
  }

  const netBalances = new Map<string, number>();
  for (const uid of nameMap.keys()) {
    netBalances.set(uid, 0);
  }

  for (const expense of expenses ?? []) {
    const splits =
      (expense as { splits?: { user_id: string; amount: number; is_settled: boolean }[] }).splits ??
      [];
    for (const split of splits) {
      if (split.user_id === expense.paid_by) continue;
      if (split.is_settled) continue;

      netBalances.set(expense.paid_by, (netBalances.get(expense.paid_by) ?? 0) + split.amount);
      netBalances.set(split.user_id, (netBalances.get(split.user_id) ?? 0) - split.amount);
    }
  }

  for (const settlement of settlements ?? []) {
    netBalances.set(
      settlement.from_user,
      (netBalances.get(settlement.from_user) ?? 0) + settlement.amount,
    );
    netBalances.set(
      settlement.to_user,
      (netBalances.get(settlement.to_user) ?? 0) - settlement.amount,
    );
  }

  const balances: UserBalance[] = [];
  for (const [userId, net] of netBalances) {
    balances.push({
      userId,
      name: nameMap.get(userId) ?? 'Unknown',
      totalOwed: Math.max(0, net),
      totalOwing: Math.max(0, -net),
      net,
    });
  }

  const simplifiedDebts = minimizeTransactions(netBalances, nameMap);

  return { groupId, balances, simplifiedDebts };
}

/**
 * Greedy algorithm: repeatedly match the largest creditor with the largest debtor.
 * Produces an optimal or near-optimal set of transfers to settle all debts.
 */
export function minimizeTransactions(
  netBalances: Map<string, number>,
  nameMap: Map<string, string>,
): PairwiseDebt[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, net] of netBalances) {
    const rounded = Math.round(net * 100) / 100;
    if (rounded > 0) creditors.push({ id, amount: rounded });
    else if (rounded < 0) debtors.push({ id, amount: -rounded });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const debts: PairwiseDebt[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const transfer = Math.min(creditors[ci].amount, debtors[di].amount);
    if (transfer > 0.01) {
      debts.push({
        from: debtors[di].id,
        fromName: nameMap.get(debtors[di].id) ?? 'Unknown',
        to: creditors[ci].id,
        toName: nameMap.get(creditors[ci].id) ?? 'Unknown',
        amount: Math.round(transfer * 100) / 100,
      });
    }

    creditors[ci].amount -= transfer;
    debtors[di].amount -= transfer;

    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount < 0.01) di++;
  }

  return debts;
}

export async function getUserOverallBalance(
  userId: string,
): Promise<{ totalOwed: number; totalOwing: number; net: number }> {
  const { data: splits } = await supabase
    .from('expense_splits')
    .select('amount, is_settled, expense:expenses!inner(paid_by)')
    .eq('user_id', userId)
    .eq('is_settled', false);

  const { data: paidExpenses } = await supabase
    .from('expenses')
    .select('id, splits:expense_splits(user_id, amount, is_settled)')
    .eq('paid_by', userId);

  let totalOwing = 0;
  let totalOwed = 0;

  for (const split of splits ?? []) {
    const expense = split.expense as unknown as { paid_by: string };
    if (expense.paid_by !== userId) {
      totalOwing += split.amount;
    }
  }

  for (const expense of paidExpenses ?? []) {
    const expenseSplits =
      (expense as { splits?: { user_id: string; amount: number; is_settled: boolean }[] }).splits ??
      [];
    for (const s of expenseSplits) {
      if (s.user_id !== userId && !s.is_settled) {
        totalOwed += s.amount;
      }
    }
  }

  return {
    totalOwed: Math.round(totalOwed * 100) / 100,
    totalOwing: Math.round(totalOwing * 100) / 100,
    net: Math.round((totalOwed - totalOwing) * 100) / 100,
  };
}
