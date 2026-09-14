/** Money is stored in integer minor units. Never combine different currencies. */
export const CURRENCIES = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SGD',
  'AUD',
  'CAD',
  'JPY',
  'THB',
] as const;
export type Currency = (typeof CURRENCIES)[number];
export type Member = { id: string; name: string; userId?: string };
export type Split = { memberId: string; amount: number };
export type Expense = {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  splits: Split[];
  method: 'equal' | 'amount' | 'percentage';
  date: string;
  note: string;
  receipt?: string;
  deleted?: boolean;
  createdAt: string;
  updatedAt: string;
};
export type Payment = {
  id: string;
  from: string;
  to: string;
  amount: number;
  method: string;
  note: string;
  createdAt: string;
  reversed?: boolean;
};
export type LedgerEvent = {
  id: string;
  type: 'expense' | 'payment' | 'group';
  title: string;
  detail: string;
  at: string;
  targetId?: string;
  actorName?: string;
};
export type Group = {
  id: string;
  name: string;
  currency: Currency;
  members: Member[];
  expenses: Expense[];
  payments: Payment[];
  events: LedgerEvent[];
  revision: number;
  archived: boolean;
  owner: string;
};
export type Debt = { from: string; to: string; amount: number };
export type Draft = {
  id: string;
  groupId: string;
  expenseId?: string;
  baseUpdatedAt?: string;
  title: string;
  amount: string;
  paidBy: string;
  participants: string[];
  method: Expense['method'];
  splits: Split[];
  date: string;
  note: string;
  receipt?: string;
};
export type Preferences = {
  name: string;
  currency: Currency;
  hideAmounts: boolean;
  paymentMethod: string;
  photo?: string;
};
export const defaults: Preferences = {
  name: 'You',
  currency: 'INR',
  hideAmounts: false,
  paymentMethod: 'Bank transfer',
};
export function id(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });
}
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function scale(currency: Currency) {
  return currency === 'JPY' ? 1 : 100;
}
export function parseMoney(value: string, currency: Currency): number {
  const pattern = currency === 'JPY' ? /^\d+$/ : /^\d+(\.\d{1,2})?$/;
  if (!pattern.test(value.trim()))
    throw new Error(
      currency === 'JPY'
        ? 'Enter a whole yen amount.'
        : 'Enter an amount with up to two decimal places.',
    );
  const amount = Math.round(Number(value) * scale(currency));
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 99999999999)
    throw new Error('Enter an amount greater than zero and below 1 billion.');
  return amount;
}
export function money(amount: number, currency: Currency): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount / scale(currency));
}
export function equalSplit(amount: number, members: string[]): Split[] {
  if (!members.length) return [];
  return members.map((memberId, i) => ({
    memberId,
    amount: Math.floor(amount / members.length) + (i < amount % members.length ? 1 : 0),
  }));
}
export function percentageSplit(amount: number, members: string[], values: string[]): Split[] {
  const weights = values.map((v) =>
    /^\d+(\.\d{1,2})?$/.test(v) ? Math.round(Number(v) * 100) : NaN,
  );
  if (
    weights.some((v) => !Number.isFinite(v) || v < 0) ||
    weights.reduce((a, b) => a + b, 0) !== 10000
  )
    throw new Error('Percentages must add up to 100%.');
  const result = members.map((memberId, i) => ({
    memberId,
    amount: Math.floor((amount * weights[i]) / 10000),
  }));
  let remainder = amount - result.reduce((sum, s) => sum + s.amount, 0);
  const order = weights
    .map((w, i) => ({ i, fraction: (amount * w) % 10000 }))
    .sort((a, b) => b.fraction - a.fraction);
  for (const { i } of order) {
    if (remainder-- <= 0) break;
    result[i].amount++;
  }
  return result;
}
export function validateExpense(group: Group, expense: Expense) {
  const memberIds = new Set(group.members.map((m) => m.id));
  if (!expense.title.trim() || expense.title.length > 120)
    throw new Error('Add a description of up to 120 characters.');
  if (!Number.isSafeInteger(expense.amount) || expense.amount <= 0 || expense.amount > 99999999999)
    throw new Error('Enter a valid positive amount.');
  if (!memberIds.has(expense.paidBy)) throw new Error('Choose someone in this group as the payer.');
  if (
    !expense.splits.length ||
    new Set(expense.splits.map((s) => s.memberId)).size !== expense.splits.length
  )
    throw new Error('Choose at least one person, without duplicates.');
  if (
    expense.splits.some(
      (s) => !memberIds.has(s.memberId) || !Number.isSafeInteger(s.amount) || s.amount < 0,
    ) ||
    expense.splits.reduce((sum, s) => sum + s.amount, 0) !== expense.amount
  )
    throw new Error('Shares must add up to the expense total.');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(expense.date) ||
    !Number.isFinite(Date.parse(expense.date)) ||
    new Date(expense.date).toISOString().slice(0, 10) !== expense.date ||
    expense.date > today()
  )
    throw new Error('Enter a valid date on or before today (YYYY-MM-DD).');
}
/** Net only reciprocal debts between the SAME two people, within a single group. */
export function debts(group: Group): Debt[] {
  const pairs = new Map<string, { a: string; b: string; amount: number }>();
  const add = (from: string, to: string, amount: number) => {
    if (from === to) return;
    const [a, b] = [from, to].sort();
    const key = `${a}:${b}`;
    const old = pairs.get(key)?.amount ?? 0;
    pairs.set(key, { a, b, amount: old + (from === a ? amount : -amount) });
  };
  group.expenses
    .filter((e) => !e.deleted)
    .forEach((e) => e.splits.forEach((s) => add(s.memberId, e.paidBy, s.amount)));
  group.payments.filter((p) => !p.reversed).forEach((p) => add(p.from, p.to, -p.amount));
  return [...pairs.values()]
    .filter((p) => p.amount !== 0)
    .map((p) => ({
      from: p.amount > 0 ? p.a : p.b,
      to: p.amount > 0 ? p.b : p.a,
      amount: Math.abs(p.amount),
    }));
}
export function validatePayment(group: Group, payment: Payment) {
  const balance = debts(group).find((d) => d.from === payment.from && d.to === payment.to);
  if (
    !balance ||
    !Number.isSafeInteger(payment.amount) ||
    payment.amount <= 0 ||
    payment.amount > balance.amount
  )
    throw new Error('Record an amount up to the outstanding balance.');
}
export function selfId(group: Group, userId: string) {
  return group.members.find((m) => m.userId === userId)?.id;
}
export function memberName(group: Group, memberId: string) {
  return group.members.find((m) => m.id === memberId)?.name ?? 'Unknown person';
}
export function totals(groups: Group[], userId: string) {
  const byCurrency: Partial<Record<Currency, { owe: number; owed: number }>> = {};
  groups.forEach((g) => {
    const me = selfId(g, userId);
    const total = byCurrency[g.currency] ?? { owe: 0, owed: 0 };
    debts(g).forEach((d) => {
      if (d.from === me) total.owe += d.amount;
      if (d.to === me) total.owed += d.amount;
    });
    byCurrency[g.currency] = total;
  });
  return byCurrency;
}
export function makeDraft(group?: Group, userId = 'local'): Draft {
  return {
    id: id(),
    groupId: group?.id ?? '',
    title: '',
    amount: '',
    paidBy: group ? (selfId(group, userId) ?? group.members[0].id) : '',
    participants: group?.members.map((m) => m.id) ?? [],
    method: 'equal',
    splits: [],
    date: today(),
    note: '',
  };
}
