import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/marketplace/ui/dialog";
import type { Product } from "@/types/marketplace";
import { formatUnits } from "ethers";
import { Loader2, ShoppingBag, Sparkles, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PurchaseDialog({
  confirmBuyProduct,
  setConfirmBuyProduct,
  tokenDecimals,
  tokenSymbol,
  buyingId,
  buy,
}: {
  confirmBuyProduct: { product: Product; quantity: bigint };
  setConfirmBuyProduct: (value: null) => void;
  tokenDecimals: number;
  tokenSymbol: string;
  buyingId: bigint | null;
  buy: (product: Product, quantity: bigint) => Promise<void>;
}) {
  const { t } = useTranslation();
  const isBusy = buyingId === confirmBuyProduct.product.id;
  const unitPrice = formatUnits(confirmBuyProduct.product.price, tokenDecimals);
  const totalPrice = formatUnits(
    confirmBuyProduct.product.price * confirmBuyProduct.quantity,
    tokenDecimals,
  );

  return (
    <Dialog
      open={!!confirmBuyProduct}
      onOpenChange={(open) => !open && !isBusy && setConfirmBuyProduct(null)}
    >
      <DialogContent onClose={() => !isBusy && setConfirmBuyProduct(null)} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-toota-inner flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-2xs">
              <ShoppingBag className="size-5 text-toota-green" />
            </div>
            <div>
              <DialogTitle>{t("confirmOnChainOrder") || "Confirm On-Chain Order"}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {t("confirmOnChainOrderSubtitle") || "Review your order details before executing the gasless transaction."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Order Details Breakdown Card */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-toota-inner p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-toota-muted font-medium">{t("selectedItem") || "Selected Item:"}</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {confirmBuyProduct.product.name}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-toota-muted font-medium">{t("quantityLabel") || "Quantity:"}</span>
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              {confirmBuyProduct.quantity.toString()} {t("units") || "units"}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-toota-muted font-medium">{t("unitPrice") || "Unit Price:"}</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">
              {unitPrice} {tokenSymbol}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-toota-muted font-medium">{t("gasNetworkFee") || "Gas & Network Fee:"}</span>
            <span className="inline-flex items-center gap-1 text-toota-green font-semibold">
              <Sparkles className="size-3" />
              <span>{t("freeGas") || "0.00 ETH (Free)"}</span>
            </span>
          </div>

          <div className="border-t border-zinc-200/80 dark:border-zinc-800 pt-3 flex justify-between items-baseline">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              {t("totalAmount") || "Total Amount:"}
            </span>
            <div className="text-right">
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalPrice}
              </span>{" "}
              <span className="text-xs font-semibold text-toota-green">
                {tokenSymbol}
              </span>
            </div>
          </div>
        </div>

        {/* Sponsored Gasless note */}
        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-toota-green" />
          <span>
            {t("gaslessExplanation") || "This purchase uses meta-transactions (EIP-2771). You only sign the order with your wallet; zero ETH gas is spent."}
          </span>
        </div>

        <DialogFooter className="mt-4 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => setConfirmBuyProduct(null)}
            className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
          >
            {t("cancel") || "Cancel"}
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={isBusy}
            onClick={() =>
              buy(confirmBuyProduct.product, confirmBuyProduct.quantity)
            }
            className="toota-pill h-10 px-6 text-xs font-semibold cursor-pointer bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm"
          >
            {isBusy ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-2 rtl:mr-0 rtl:ml-2" />
                {t("authorizing") || "Authorizing…"}
              </>
            ) : (
              t("confirmAndSign") || "Confirm & Sign"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
