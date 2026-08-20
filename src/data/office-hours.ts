// Single source of truth for the NRP's bi-weekly office hours.
//
// Consumed by src/components/common/OfficeHoursBar.astro on both sides of the
// wire: Astro renders the next session at build time so the rail is legible
// without JavaScript, and the same functions run in the browser to correct a
// stale build and drive the countdown. Previously this schedule was hardcoded
// twice -- once in a client-only widget, once as a literal in the homepage
// announcement list -- and the two could disagree.
export const OFFICE_HOURS = {
  /** Sessions are announced in Pacific time, so that is the authoritative zone. */
  timeZone: 'America/Los_Angeles',
  /** A known session, as a wall-clock time in `timeZone`. Every other date derives from it. */
  anchor: { year: 2026, month: 3, day: 17, hour: 10, minute: 0 },
  /** Bi-weekly. Counted in calendar days, not milliseconds -- see nextSession(). */
  intervalDays: 14,
  /** Assumed session length; only affects how long the rail reads "in session now". */
  durationMinutes: 60,
  joinUrl: 'https://ucsd.zoom.us/j/96377381436',
  /** Recurring VEVENT, generated from the values above. See static/nrp-office-hours.ics. */
  calendarUrl: '/nrp-office-hours.ics',
};

export interface Session {
  start: Date;
  end: Date;
  /** True between start and start + durationMinutes. */
  isLive: boolean;
}

const DAY_MS = 86_400_000;

/**
 * How far `timeZone` is from UTC at a given instant, in ms. Derived from Intl
 * rather than a table, so DST transitions are handled by the platform.
 */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const field: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') field[part.type] = Number(part.value);
  }

  // `hour` comes back as 24 rather than 0 at midnight in some engines.
  const asIfUtc = Date.UTC(field.year, field.month - 1, field.day, field.hour % 24, field.minute, field.second);
  return asIfUtc - instant.getTime();
}

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * The instant at which a wall-clock time occurs in `timeZone`. Two passes: the
 * first offset lookup uses the naive instant, the second uses the corrected one,
 * which is enough to converge for every real-world zone.
 */
function wallClockToInstant({ year, month, day, hour, minute }: WallClock, timeZone: string): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  let instant = new Date(naive - zoneOffsetMs(new Date(naive), timeZone));
  instant = new Date(naive - zoneOffsetMs(instant, timeZone));
  return instant;
}

/**
 * The next session that has not finished yet.
 *
 * Steps in calendar days from the anchor date and re-resolves 10:00 local time
 * on each candidate, so a session never drifts to 9:00 or 11:00 across a DST
 * boundary. Adding a fixed 14 * 24h to a UTC instant -- the obvious shortcut,
 * and what this replaced -- displayed "9:00 AM PT" for the whole winter.
 */
export function nextSession(now: Date = new Date()): Session {
  const { timeZone, anchor, intervalDays, durationMinutes } = OFFICE_HOURS;
  const durationMs = durationMinutes * 60_000;
  const anchorInstant = wallClockToInstant(anchor, timeZone);

  // Estimate the period, then walk forward. The estimate can be off by one
  // around a DST boundary, hence the walk rather than a direct index.
  const estimate = Math.floor((now.getTime() - anchorInstant.getTime()) / (intervalDays * DAY_MS)) - 1;

  for (let period = estimate; period < estimate + 4; period++) {
    // Calendar-day arithmetic in the UTC frame, which has no DST to trip over.
    const date = new Date(Date.UTC(anchor.year, anchor.month - 1, anchor.day + period * intervalDays));
    const start = wallClockToInstant(
      {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: anchor.hour,
        minute: anchor.minute,
      },
      timeZone
    );
    const end = new Date(start.getTime() + durationMs);
    if (end.getTime() > now.getTime()) {
      return { start, end, isLive: start.getTime() <= now.getTime() };
    }
  }

  // Unreachable: the loop spans four periods either side of the estimate.
  const start = new Date(anchorInstant.getTime() + (estimate + 4) * intervalDays * DAY_MS);
  return { start, end: new Date(start.getTime() + durationMs), isLive: false };
}

/**
 * The zone to *display* in, which is not the zone the schedule is defined in.
 *
 * Sessions are announced as 10:00 Pacific, so `OFFICE_HOURS.timeZone` is what
 * decides when they occur -- but a reader in Chicago wants to see noon, not
 * "10:00 AM PDT" plus mental arithmetic. Every formatter below therefore takes
 * a display zone, defaulting to the schedule's own so the build-time render is
 * honest without a browser to ask. The client pass re-renders in the reader's
 * zone; the Pacific time stays reachable through formatLong().
 */
export const viewerTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || OFFICE_HOURS.timeZone;
  } catch {
    return OFFICE_HOURS.timeZone;
  }
};

// Intl.DateTimeFormat construction is the expensive part, so cache per zone.
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(kind: 'date' | 'time' | 'long', timeZone: string): Intl.DateTimeFormat {
  const key = `${kind}:${timeZone}`;
  let cached = formatterCache.get(key);
  if (!cached) {
    const options: Intl.DateTimeFormatOptions =
      kind === 'date'
        ? { timeZone, weekday: 'short', month: 'short', day: 'numeric' }
        : kind === 'time'
          ? { timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }
          : {
              timeZone,
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short',
            };
    cached = new Intl.DateTimeFormat('en-US', options);
    formatterCache.set(key, cached);
  }
  return cached;
}

/** "Tue, Sep 1" -- the date in the reader's zone, which east of the date line is not the Pacific one. */
export const formatDate = (session: Session, timeZone: string = OFFICE_HOURS.timeZone) =>
  formatter('date', timeZone).format(session.start);

/** "12:00 PM CDT" -- always with the zone abbreviation, so the reading is never ambiguous. */
export const formatTime = (session: Session, timeZone: string = OFFICE_HOURS.timeZone) =>
  formatter('time', timeZone).format(session.start);

/**
 * Spelled out for the title attribute, and the one place the Pacific time is
 * always available: the schedule is published as 10:00 Pacific, so a reader in
 * another zone can still line the strip up against the announcement.
 */
export function formatLong(session: Session, timeZone: string = OFFICE_HOURS.timeZone): string {
  const local = formatter('long', timeZone).format(session.start);
  if (timeZone === OFFICE_HOURS.timeZone) return local;
  return `${local} (${formatter('time', OFFICE_HOURS.timeZone).format(session.start)})`;
}

/** Which calendar day an instant falls on in `timeZone`, as a day number. */
function zonedDayIndex(instant: Date, timeZone: string): number {
  return Math.floor((instant.getTime() + zoneOffsetMs(instant, timeZone)) / DAY_MS);
}

/**
 * How far off the session is, in the coarsest unit that is still useful:
 * minutes within the hour, hours and minutes within the day, days beyond it.
 *
 * "tomorrow" has to mean tomorrow where the reader is, so the day difference is
 * counted in the display zone rather than the schedule's.
 */
export function formatCountdown(
  session: Session,
  now: Date = new Date(),
  timeZone: string = OFFICE_HOURS.timeZone
): string {
  if (session.isLive) return 'In session now';

  const minutes = Math.max(1, Math.round((session.start.getTime() - now.getTime()) / 60_000));
  if (minutes < 60) return `in ${minutes} min`;

  const days = zonedDayIndex(session.start, timeZone) - zonedDayIndex(now, timeZone);
  if (days === 0) return `in ${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}
