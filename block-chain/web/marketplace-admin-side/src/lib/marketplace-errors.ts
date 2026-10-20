export function parseError(error: unknown) {
  const err = error as {
    shortMessage?: string;
    reason?: string;
    message?: string;
  };
  const raw =
    err?.shortMessage || err?.reason || err?.message || "Transaction failed.";

  if (String(raw).includes("Price is not correct")) {
    return "You do not have enough G tokens for this transaction.";
  }

  if (String(raw).includes("Product Not Found")) {
    return "Product not found for this merchant.";
  }

  if (String(raw).includes("insufficient funds")) {
    return "Not enough Sepolia ETH to pay gas.";
  }

  return String(raw)
    .replace(/^execution reverted:\s*/i, "")
    .split("\n")[0];
}
