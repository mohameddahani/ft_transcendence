export const shorten = (value: string) =>
  value && value.length > 10
    ? `${value.slice(0, 6)}…${value.slice(-4)}`
    : value || "";

export const dateFromTs = (ts: bigint) =>
  new Date(Number(ts) * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
