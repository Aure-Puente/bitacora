import { memberColors } from '../theme/colors';

// Sin caracteres confusos (0/O, 1/I).
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateTripCode(length = 6) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return out;
}

export function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function pickMemberColor(uid) {
  return memberColors[hashString(uid) % memberColors.length];
}

export function initials(name) {
  const parts = String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0].charAt(0);
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + second).toUpperCase();
}
