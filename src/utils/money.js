const SYMBOLS = { ARS: '$', USD: 'US$', BRL: 'R$', EUR: '€' };

export const CURRENCIES = [
  { value: 'ARS', label: 'ARS $' },
  { value: 'USD', label: 'USD' },
  { value: 'BRL', label: 'BRL' },
];

// 50000 -> "$ 50.000" | 1234.5 -> "$ 1.234,50"
export function formatMoney(amount, currency = 'ARS') {
  const symbol = SYMBOLS[currency] || '$';
  const n = Math.round((Number(amount) || 0) * 100) / 100;
  const sign = n < 0 ? '-' : '';
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = dec === '00' ? '' : ',' + dec;
  return `${sign}${symbol} ${intFmt}${decPart}`;
}

export function formatCents(cents, currency = 'ARS') {
  return formatMoney((Number(cents) || 0) / 100, currency);
}

// Acepta "50000", "50.000", "50000,50", "50.000,50" o "50.5". Devuelve un número o NaN.
export function parseAmount(text) {
  if (text === null || text === undefined) return NaN;
  let s = String(text).trim().replace(/[^\d.,-]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
