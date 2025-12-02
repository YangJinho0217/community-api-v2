// Simple date utils for formatting search date ranges
// Input: 'YYYY-MM-DD' -> Output: { start: 'YYYYMMDD0000', end: 'YYYYMMDD2359' }

export function toDateRangeFromYMD(dateStr?: string | null): { start: string; end: string } | null {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();
  const m = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
  if (!m) return null;
  const ymd = trimmed.replace(/-/g, '');
  return { start: `${ymd}0000`, end: `${ymd}2359` };
}

export function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
