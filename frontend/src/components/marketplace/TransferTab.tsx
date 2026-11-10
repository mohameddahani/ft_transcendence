"use client";

import { Loader2, Send } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { TabsContent } from "./ui/tabs";
import { EXPLORER_BASE } from "@/lib/blockchain/contract";
import type { useTokenTransfer } from "./hooks/useTokenTransfer";

export function TransferTab({
  transfer,
  tokenSymbol,
  balanceLabel,
  account,
  isSepolia,
}: {
  transfer: ReturnType<typeof useTokenTransfer>;
  tokenSymbol: string;
  balanceLabel: string;
  account: string;
  isSepolia: boolean;
}) {
  const hash = transfer.pendingHash ?? transfer.lastHash;
  return (
    <TabsContent value="transfer" className="p-4 sm:p-6">
      <Card className="mx-auto max-w-xl border-border bg-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="size-5" />
            Send {tokenSymbol}
          </CardTitle>
          <CardDescription>
            Send GymToken to any wallet on Sepolia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Available:{" "}
            <strong>
              {balanceLabel} {tokenSymbol}
            </strong>
          </p>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (
                !transfer.sending &&
                !transfer.pendingHash &&
                !transfer.review
              )
                transfer.prepare();
            }}
          >
            <div className="space-y-1.5">
              <label
                htmlFor="transfer-recipient"
                className="text-sm font-medium"
              >
                Recipient wallet
              </label>
              <Input
                id="transfer-recipient"
                placeholder="0x..."
                value={transfer.recipient}
                onChange={(event) => transfer.setRecipient(event.target.value)}
                disabled={
                  transfer.sending ||
                  !!transfer.review ||
                  !!transfer.pendingHash
                }
                autoComplete="off"
                spellCheck={false}
                required
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="transfer-amount" className="text-sm font-medium">
                Amount ({tokenSymbol})
              </label>
              <Input
                id="transfer-amount"
                placeholder="0.00"
                inputMode="decimal"
                value={transfer.amount}
                onChange={(event) => transfer.setAmount(event.target.value)}
                disabled={
                  transfer.sending ||
                  !!transfer.review ||
                  !!transfer.pendingHash
                }
                autoComplete="off"
                required
              />
            </div>
            {transfer.error && (
              <p role="alert" className="text-sm text-destructive">
                {transfer.error}
              </p>
            )}
            {!account && (
              <p className="text-sm text-muted-foreground">
                Connect your wallet to send G.
              </p>
            )}
            {account && !isSepolia && (
              <p className="text-sm text-muted-foreground">
                Switch your wallet to Sepolia to continue.
              </p>
            )}
            {transfer.review && !transfer.pendingHash ? (
              <div className="space-y-3 rounded-xl border border-border p-4">
                <p className="font-semibold">
                  Send {transfer.review.amount} {tokenSymbol}
                </p>
                <p className="break-all font-mono text-xs">
                  To: {transfer.review.recipient}
                </p>
                <p className="text-xs text-muted-foreground">
                  Check the address carefully. Confirm this transfer in your
                  wallet.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={transfer.sending}
                    onClick={transfer.cancelReview}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={transfer.sending || !account || !isSepolia}
                    onClick={() => void transfer.send()}
                  >
                    {transfer.sending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {transfer.sending ? "Sending…" : "Confirm and send"}
                  </Button>
                </div>
              </div>
            ) : transfer.pendingHash ? (
              <Button
                type="button"
                disabled={transfer.sending || !isSepolia}
                onClick={() => void transfer.checkStatus()}
              >
                {transfer.sending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Check transfer status
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full"
                disabled={
                  !account ||
                  !isSepolia ||
                  !transfer.recipient.trim() ||
                  !transfer.amount.trim()
                }
              >
                Review transfer
              </Button>
            )}
          </form>
          {hash && (
            <a
              className="block break-all text-xs text-primary underline"
              href={`${EXPLORER_BASE}/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {transfer.pendingHash
                ? "View pending transfer"
                : "View confirmed transfer"}
            </a>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
