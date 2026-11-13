"use client";

import { Loader2, Send, ExternalLink, ArrowRight, Wallet, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/marketplace/ui/tabs";
import { EXPLORER_BASE } from "@/lib/blockchain/contract";
import type { useTokenTransfer } from "./hooks/useTokenTransfer";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const hash = transfer.pendingHash ?? transfer.lastHash;

  const handleMaxClick = () => {
    // Fill full clean balance amount
    const cleanBalance = balanceLabel.replace(/,/g, "");
    if (!isNaN(Number(cleanBalance)) && Number(cleanBalance) > 0) {
      transfer.setAmount(cleanBalance);
    }
  };

  return (
    <TabsContent value="transfer" className="p-4 sm:p-7">
      <Card className="mx-auto max-w-xl rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-2 sm:p-3">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-toota-inner flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-2xs">
              <Send className="size-5 text-toota-green" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("sendTokensTitle", { symbol: tokenSymbol, defaultValue: `Send ${tokenSymbol} Tokens` })}
              </CardTitle>
              <CardDescription className="text-xs text-toota-muted mt-0.5">
                {t("sendTokensSubtitle") || "Transfer GymTokens to any wallet address on Ethereum Sepolia."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Available balance banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-toota-inner border border-zinc-200/60 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-toota-muted" />
              <span className="text-xs text-toota-muted">{t("availableInWallet") || "Available in wallet:"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {balanceLabel}
              </span>
              <span className="text-xs font-semibold text-toota-green">
                {tokenSymbol}
              </span>
              <button
                type="button"
                onClick={handleMaxClick}
                className="ms-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-200/70 hover:bg-zinc-300/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                {t("max") || "Max"}
              </button>
            </div>
          </div>

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
              <Label
                htmlFor="transfer-recipient"
                className="text-xs font-semibold uppercase tracking-wider text-toota-muted"
              >
                {t("recipientWalletAddress") || "Recipient Wallet Address"}
              </Label>
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
                className="font-mono text-xs sm:text-sm border-zinc-200/80 dark:border-zinc-800 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="transfer-amount"
                className="text-xs font-semibold uppercase tracking-wider text-toota-muted"
              >
                {t("amountToSend", { symbol: tokenSymbol, defaultValue: `Amount to Send (${tokenSymbol})` })}
              </Label>
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
                className="text-xs sm:text-sm font-semibold border-zinc-200/80 dark:border-zinc-800 rounded-xl"
              />
            </div>

            {transfer.error && (
              <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {transfer.error}
              </div>
            )}

            {!account && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {t("connectWalletToTransfer") || "Please connect your Web3 wallet first to initiate transfers."}
              </p>
            )}

            {account && !isSepolia && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {t("switchNetworkToTransfer") || "Please switch your wallet network to Sepolia to continue."}
              </p>
            )}

            {transfer.review && !transfer.pendingHash ? (
              <div className="space-y-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-toota-inner p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
                    {t("transferSummary") || "Transfer Summary"}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-toota-muted">{t("transferAmountLabel") || "Amount:"}</span>
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {transfer.review.amount} {tokenSymbol}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-toota-muted shrink-0">{t("recipient") || "Recipient:"}</span>
                    <span className="break-all font-mono text-end text-zinc-800 dark:text-zinc-200">
                      {transfer.review.recipient}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-toota-muted leading-relaxed">
                  {t("transferWarning") || "Verify the recipient wallet carefully. This action triggers an on-chain ERC20 transaction that will be confirmed in your wallet."}
                </p>

                <div className="flex gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={transfer.sending}
                    onClick={transfer.cancelReview}
                    className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
                  >
                    {t("back") || "Back"}
                  </Button>
                  <Button
                    type="button"
                    disabled={transfer.sending || !account || !isSepolia}
                    onClick={() => void transfer.send()}
                    className="toota-pill flex-1 h-10 px-6 text-xs font-semibold cursor-pointer bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm"
                  >
                    {transfer.sending ? (
                      <Loader2 className="size-3.5 animate-spin mr-2 rtl:mr-0 rtl:ml-2" />
                    ) : (
                      <ArrowRight className="size-3.5 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
                    )}
                    {transfer.sending ? (t("authorizingTransfer") || "Authorizing Transfer…") : (t("confirmAndSend") || "Confirm and Send")}
                  </Button>
                </div>
              </div>
            ) : transfer.pendingHash ? (
              <Button
                type="button"
                disabled={transfer.sending || !isSepolia}
                onClick={() => void transfer.checkStatus()}
                className="toota-pill w-full h-11 text-xs font-semibold cursor-pointer bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm"
              >
                {transfer.sending && (
                  <Loader2 className="size-4 animate-spin mr-2 rtl:mr-0 rtl:ml-2" />
                )}
                {t("checkTxStatus") || "Check Transaction Status"}
              </Button>
            ) : (
              <Button
                type="submit"
                className="toota-pill w-full h-11 text-xs font-semibold cursor-pointer bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm"
                disabled={
                  !account ||
                  !isSepolia ||
                  !transfer.recipient.trim() ||
                  !transfer.amount.trim()
                }
              >
                <ArrowRight className="size-3.5 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
                {t("reviewTransfer") || "Review Transfer"}
              </Button>
            )}
          </form>

          {hash && (
            <div className="p-3.5 rounded-2xl bg-toota-inner border border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-toota-green shrink-0" />
                <span className="text-xs text-toota-muted font-mono truncate max-w-[280px]">
                  Tx: {hash}
                </span>
              </div>
              <a
                className="inline-flex items-center gap-1 text-xs font-semibold text-toota-green hover:underline shrink-0"
                href={`${EXPLORER_BASE}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{t("viewOnExplorer") || "View on Explorer"}</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
