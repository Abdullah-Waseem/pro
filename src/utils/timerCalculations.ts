export const formatTimerText = (remainingMs: number): string => {
  // Ensure we don't have negative time.
  const remaining = Math.max(0, remainingMs + 1000);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  if (hours > 0) {
    return `${hours.toString()}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

export const getCandleStickInterval = (period: any, baseInterval: number) => {
  switch (period.timespan) {
    case "second":
      return period.multiplier * baseInterval;
    case "minute":
      return period.multiplier * baseInterval * 60;
    case "hour":
      return period.multiplier * baseInterval * 60 * 60;
    case "day":
      return period.multiplier * baseInterval * 60 * 60 * 24;
    default:
      return baseInterval;
  }
};
