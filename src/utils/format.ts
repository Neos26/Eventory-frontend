const pad = (value: number): string => String(value).padStart(2, '0');

function parse(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

// "Oct 12, 2026"
export function formatDate(iso: string): string {
  const date = parse(iso);
  if (!date) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// "9:00 AM"
export function formatTime(iso: string): string {
  const date = parse(iso);
  if (!date) return '—';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Local "YYYY-MM-DD" for <input type="date"> values.
export function toInputDate(iso: string): string {
  const date = parse(iso);
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Local "HH:MM" for <input type="time"> values.
export function toInputTime(iso: string): string {
  const date = parse(iso);
  if (!date) return '';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
