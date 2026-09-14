const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync('src/domain/ledger.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exportsObject = {};
new Function('exports', compiled)(exportsObject);
const {
  equalSplit,
  percentageSplit,
  parseMoney,
  debts,
  totals,
  validateExpense,
  validatePayment,
  today,
} = exportsObject;
const group = () => ({
  id: 'g',
  name: 'Dinner',
  currency: 'INR',
  owner: 'a',
  revision: 0,
  archived: false,
  members: [
    { id: 'a', name: 'You', userId: 'a' },
    { id: 'b', name: 'Rohan' },
    { id: 'c', name: 'Priya' },
  ],
  expenses: [],
  payments: [],
  events: [],
});
const expense = (id, paidBy, amount, splits) => ({
  id,
  title: 'Dinner',
  paidBy,
  amount,
  splits,
  method: 'amount',
  date: today(),
  note: '',
  createdAt: '2026-09-12T00:00:00Z',
  updatedAt: '2026-09-12T00:00:00Z',
});
test('integer currency parsing rejects malformed, negative, nonfinite and sub-minor-unit amounts', () => {
  assert.equal(parseMoney('123.45', 'INR'), 12345);
  assert.equal(parseMoney('123', 'JPY'), 123);
  for (const v of ['', '1e3', '-1', 'Infinity', '12.345', '1,000', '0', '1.'])
    assert.throws(() => parseMoney(v, 'INR'));
  assert.throws(() => parseMoney('1.20', 'JPY'));
});
test('equal splits preserve every minor unit across many totals and participant counts', () => {
  for (let people = 1; people <= 30; people++)
    for (let total = 1; total <= 2003; total += 7) {
      const s = equalSplit(
        total,
        Array.from({ length: people }, (_, i) => String(i)),
      );
      assert.equal(
        s.reduce((n, x) => n + x.amount, 0),
        total,
      );
      assert.ok(Math.max(...s.map((x) => x.amount)) - Math.min(...s.map((x) => x.amount)) <= 1);
    }
});
test('percentage rounding totals correctly and zero-percent people receive zero', () => {
  assert.deepEqual(percentageSplit(1, ['a', 'b', 'c'], ['0', '50', '50']), [
    { memberId: 'a', amount: 0 },
    { memberId: 'b', amount: 1 },
    { memberId: 'c', amount: 0 },
  ]);
  assert.equal(
    percentageSplit(1001, ['a', 'b', 'c'], ['33.33', '33.33', '33.34']).reduce(
      (n, s) => n + s.amount,
      0,
    ),
    1001,
  );
  assert.throws(() => percentageSplit(100, ['a', 'b'], ['50', '49.9']));
});
test('zero net does not erase debts to different people', () => {
  const g = group();
  g.expenses = [
    expense('1', 'b', 10000, [{ memberId: 'a', amount: 10000 }]),
    expense('2', 'a', 10000, [{ memberId: 'c', amount: 10000 }]),
  ];
  assert.equal(debts(g).length, 2);
  assert.deepEqual(totals([g], 'a').INR, { owe: 10000, owed: 10000 });
});
test('partial settlements reduce each pair once; undo and deletion are reversible', () => {
  const g = group();
  g.expenses = [expense('1', 'b', 10000, [{ memberId: 'a', amount: 10000 }])];
  const p = { id: 'p', from: 'a', to: 'b', amount: 2500, method: 'Cash', note: '', createdAt: '' };
  validatePayment(g, p);
  g.payments.push(p);
  assert.deepEqual(debts(g), [{ from: 'a', to: 'b', amount: 7500 }]);
  assert.throws(() => validatePayment(g, { ...p, amount: 7501 }));
  assert.throws(() => validatePayment(g, { ...p, from: 'b', to: 'a' }));
  g.payments[0].reversed = true;
  assert.equal(debts(g)[0].amount, 10000);
  g.expenses[0].deleted = true;
  assert.deepEqual(debts(g), []);
  g.expenses[0].deleted = false;
  assert.equal(debts(g)[0].amount, 10000);
});
test('deleting an expense preserves real payment records and exposes the resulting reverse balance', () => {
  const g = group();
  g.expenses = [expense('1', 'b', 10000, [{ memberId: 'a', amount: 10000 }])];
  g.payments = [{ id: 'p', from: 'a', to: 'b', amount: 10000 }];
  g.expenses[0].deleted = true;
  assert.deepEqual(debts(g), [{ from: 'b', to: 'a', amount: 10000 }]);
});
test('payer can be excluded; invalid participants and mismatched splits are rejected', () => {
  const g = group();
  const e = expense('1', 'a', 101, [{ memberId: 'b', amount: 101 }]);
  assert.doesNotThrow(() => validateExpense(g, e));
  assert.throws(() => validateExpense(g, { ...e, splits: [{ memberId: 'unknown', amount: 101 }] }));
  assert.throws(() => validateExpense(g, { ...e, splits: [{ memberId: 'b', amount: 100 }] }));
  assert.throws(() => validateExpense(g, { ...e, date: '2026-02-30' }));
});
test('currencies and groups remain separate, including one minor-unit debts', () => {
  const g = group();
  g.expenses = [expense('1', 'a', 1, [{ memberId: 'b', amount: 1 }])];
  const other = {
    ...group(),
    id: 'h',
    currency: 'USD',
    expenses: [expense('2', 'b', 1, [{ memberId: 'a', amount: 1 }])],
  };
  assert.deepEqual(totals([g, other], 'a'), { INR: { owe: 0, owed: 1 }, USD: { owe: 1, owed: 0 } });
  assert.equal(debts(g)[0].amount, 1);
});
