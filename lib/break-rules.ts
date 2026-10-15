export const BREAK_MINUTES = 60;
export const BREAK_RED_MINUTES = 90;
export type StaffBreak = { attendance: string; employee: string; startedAt: string; resumedAt?: string };

export function breakSummary(value: StaffBreak | null | undefined, now = Date.now()) {
  if (!value) return null;
  const start = Date.parse(value.startedAt);
  if (!Number.isFinite(start)) return null;
  const finish = value.resumedAt ? Date.parse(value.resumedAt) : now;
  const elapsedMinutes = Math.max(0, (finish - start) / 60000);
  return { ...value, elapsedMinutes, active: !value.resumedAt,
    dueAt: new Date(start + BREAK_MINUTES * 60000).toISOString(),
    redAt: new Date(start + BREAK_RED_MINUTES * 60000).toISOString(),
    late: elapsedMinutes > BREAK_RED_MINUTES,
    status: value.resumedAt ? (elapsedMinutes > BREAK_RED_MINUTES ? 'Returned late' : 'Returned') : (elapsedMinutes > BREAK_RED_MINUTES ? 'Late returning' : 'On paid break') };
}
