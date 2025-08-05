// -------------------------
// helpers
// -------------------------

import { KLineData } from "klinecharts";

export type Timespan = "second" | "minute" | "hour" | "day";

export const NATIVE_MULTIPLIERS: Record<Timespan, number> = {
  second: 5, // backend gives 5-second bars
  minute: 1, // backend gives 1-minute bars
  hour: 1, // backend gives 1-hour bars
  day: 1, // backend gives 1-day bars
};

/** Milliseconds per unit */
export const UNIT_MS: Record<Timespan, number> = {
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
};
export function toKLineData(d: any): KLineData {
  return {
    timestamp: d.date,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume,
  };
}

export function aggregateData(
  data: any[],
  period: any,
  startMs: number,
  ts: Timespan
): KLineData[] {
  const windowMs = period.multiplier * UNIT_MS[ts];
  const buckets = new Map<number, any[]>();
  // group into buckets
  for (const d of data) {
    const tsMs = d.date;
    const index = Math.floor((tsMs - startMs) / windowMs);
    const bucketStart = startMs + index * windowMs;

    if (!buckets.has(bucketStart)) {
      buckets.set(bucketStart, []);
    }
    buckets.get(bucketStart)!.push(d);
  }

  // turn each bucket into an OHLCV candle
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucketStart, items]) => {
      // ensure chronological order within the bucket
      items.sort((x, y) => x.date - y.date);

      const open = items[0].open;
      const close = items[items.length - 1].close;
      const high = Math.max(...items.map((x) => x.high));
      const low = Math.min(...items.map((x) => x.low));
      const volume = items.reduce((sum, x) => sum + x.volume, 0);

      return {
        timestamp: bucketStart,
        open,
        high,
        low,
        close,
        volume,
      };
    });
}
