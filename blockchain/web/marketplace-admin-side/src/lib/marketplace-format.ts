export const shorten = (value: string) =>
  `${value.slice(0, 6)}…${value.slice(-4)}`;
