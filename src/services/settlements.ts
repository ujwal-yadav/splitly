import { supabase } from '@/lib/supabase';
import type { Settlement, SettlementStatus } from '@/types/database';

export async function getGroupSettlements(groupId: string): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getUserSettlements(userId: string): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .or(`from_user.eq.${userId},to_user.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createSettlement(input: {
  groupId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  method: string;
  note?: string;
}): Promise<Settlement> {
  const { data, error } = await supabase
    .from('settlements')
    .insert({
      group_id: input.groupId,
      from_user: input.fromUser,
      to_user: input.toUser,
      amount: input.amount,
      method: input.method,
      note: input.note ?? null,
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error('Failed to create settlement');
  return data;
}

export async function updateSettlementStatus(
  settlementId: string,
  status: SettlementStatus,
): Promise<void> {
  const { error } = await supabase.from('settlements').update({ status }).eq('id', settlementId);

  if (error) throw error;

  if (status === 'confirmed') {
    await markRelatedSplitsSettled(settlementId);
  }
}

async function markRelatedSplitsSettled(settlementId: string): Promise<void> {
  const { data: settlement } = await supabase
    .from('settlements')
    .select('*')
    .eq('id', settlementId)
    .single();

  if (!settlement) return;

  const { data: splits } = await supabase
    .from('expense_splits')
    .select('*, expense:expenses!inner(group_id, paid_by)')
    .eq('user_id', settlement.from_user)
    .eq('is_settled', false);

  if (!splits) return;

  const relevantSplits = splits.filter(
    (s: { expense: { group_id: string; paid_by: string } }) =>
      s.expense.group_id === settlement.group_id && s.expense.paid_by === settlement.to_user,
  );

  let remaining = settlement.amount;
  for (const split of relevantSplits) {
    if (remaining <= 0) break;
    if (split.amount <= remaining) {
      await supabase.from('expense_splits').update({ is_settled: true }).eq('id', split.id);
      remaining -= split.amount;
    }
  }
}
