/** Shift a timezone-naive wall clock between UTC offsets without changing the instant. */

export function parseOffsetMinutes(
  offset: string | undefined | null,
): number | null {
  if (!offset) return null;
  const match = offset.trim().match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  const sign = match[1] === "+" ? 1 : -1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

export function normalizeWallClock(value: string): string | undefined {
  const match = value
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!match) return undefined;
  const time = match[2] && match[3] ? `${match[2]}:${match[3]}` : "08:00";
  return `${match[1]}T${time}`;
}

function formatUtcMsAsWallClock(ms: number): string {
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function convertWallClockBetweenOffsets(
  wallClock: string,
  fromOffset: string,
  toOffset: string,
): string {
  const normalized = normalizeWallClock(wallClock);
  if (!normalized) return wallClock;
  const from = parseOffsetMinutes(fromOffset);
  const to = parseOffsetMinutes(toOffset);
  if (from == null || to == null || from === to) return normalized;

  const [datePart, timePart] = normalized.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const utcMs = Date.UTC(year, month - 1, day, hours, minutes) - from * 60_000;
  return formatUtcMsAsWallClock(utcMs + to * 60_000);
}

export function instantToWallClock(
  iso: string,
  offset: string,
): string | undefined {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  const minutes = parseOffsetMinutes(offset);
  if (minutes == null) return undefined;
  return formatUtcMsAsWallClock(date.getTime() + minutes * 60_000);
}

export function shiftClockTime(
  time: string,
  anchorDate: string,
  fromOffset: string,
  toOffset: string,
): string {
  const clock = time.slice(0, 5);
  const converted = convertWallClockBetweenOffsets(
    `${anchorDate}T${clock}`,
    fromOffset,
    toOffset,
  );
  return converted.split("T")[1] || clock;
}
