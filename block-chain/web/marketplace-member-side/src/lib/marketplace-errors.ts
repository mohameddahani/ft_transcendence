export function parseError(error: unknown) {
  const err = error as {
    shortMessage?: string;
    reason?: string;
    message?: string;
  };
  const raw =
    err?.shortMessage || err?.reason || err?.message || "Transaction failed.";

  if (String(raw).includes("Price is not correct"))
    return "Insufficient GymToken (G) balance for this transaction.";
  if (String(raw).includes("Product Not Found"))
    return "Product was not found for this merchant.";
  if (String(raw).includes("insufficient funds"))
    return "Not enough Sepolia ETH to cover gas fees.";
  if (
    String(raw).includes("user rejected") ||
    String(raw).includes("ACTION_REJECTED")
  )
    return "Transaction was cancelled in wallet.";

  return String(raw)
    .replace(/^execution reverted:\s*/i, "")
    .split("\n")[0];
}
