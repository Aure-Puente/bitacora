// Todo el cálculo se hace en centavos (enteros) para evitar errores de redondeo.
export const toCents = (n) => Math.round((Number(n) || 0) * 100);

// Reparte totalCents entre ids; el resto (centavos sueltos) se distribuye de a uno.
export function splitCents(totalCents, ids) {
  const n = ids.length;
  if (!n) return {};
  const base = Math.floor(totalCents / n);
  let rest = totalCents - base * n;
  const out = {};
  ids.forEach((id) => {
    out[id] = base + (rest > 0 ? 1 : 0);
    if (rest > 0) rest -= 1;
  });
  return out;
}

// Saldo neto por persona: positivo = le deben, negativo = debe.
// expenses: { amount, paidBy, splitBetween[] } | settlements: { from, to, amount } (from le pagó a to)
export function computeBalances(memberIds, expenses, settlements = []) {
  const bal = {};
  memberIds.forEach((id) => {
    bal[id] = 0;
  });
  const add = (id, v) => {
    bal[id] = (bal[id] || 0) + v;
  };

  expenses.forEach((e) => {
    const total = toCents(e.amount);
    const split = e.splitBetween && e.splitBetween.length ? e.splitBetween : memberIds;
    add(e.paidBy, total);
    const shares = splitCents(total, split);
    Object.keys(shares).forEach((id) => add(id, -shares[id]));
  });

  settlements.forEach((s) => {
    const v = toCents(s.amount);
    add(s.from, v);
    add(s.to, -v);
  });

  return bal;
}

// Reduce los saldos a pocas transferencias: [{ from, to, amount (centavos) }].
export function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];
  Object.entries(balances).forEach(([id, v]) => {
    if (v > 0) creditors.push({ id, v });
    else if (v < 0) debtors.push({ id, v: -v });
  });
  const byAmount = (a, b) => b.v - a.v || a.id.localeCompare(b.id);
  creditors.sort(byAmount);
  debtors.sort(byAmount);

  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i];
    const d = debtors[j];
    const amount = Math.min(c.v, d.v);
    transfers.push({ from: d.id, to: c.id, amount });
    c.v -= amount;
    d.v -= amount;
    if (c.v === 0) i += 1;
    if (d.v === 0) j += 1;
  }
  return transfers;
}

export function totalSpentCents(expenses) {
  return expenses.reduce((sum, e) => sum + toCents(e.amount), 0);
}
