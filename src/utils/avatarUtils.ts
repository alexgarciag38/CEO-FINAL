export const EMPLOYEE_AVATAR_COLORS = [
  'bg-blue-200',
  'bg-purple-200',
  'bg-green-200',
  'bg-red-200',
  'bg-yellow-200',
  'bg-indigo-200',
  'bg-pink-200',
  'bg-gray-200',
] as const;

// Tailwind 200 hex approximations for validation against <input type="color">
const RESERVED_HEX = new Set<string>([
  '#BFDBFE', // blue-200
  '#E9D5FF', // purple-200
  '#BBF7D0', // green-200
  '#FECACA', // red-200
  '#FEF08A', // yellow-200
  '#C7D2FE', // indigo-200
  '#FBCFE8', // pink-200
  '#E5E7EB', // gray-200
].map(h => h.toUpperCase()));

export function normalizeHex(hex: string): string {
  const v = (hex || '').trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(v)) return v;
  if (/^[0-9A-F]{6}$/.test(v)) return `#${v}`;
  return v;
}

export function isReservedAvatarHex(hex: string): boolean {
  return RESERVED_HEX.has(normalizeHex(hex));
}

function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateAvatarColorClasses(name: string): string {
  const idx = simpleHash(name || 'user') % EMPLOYEE_AVATAR_COLORS.length;
  return `${EMPLOYEE_AVATAR_COLORS[idx]} text-gray-800`;
}

export function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}


