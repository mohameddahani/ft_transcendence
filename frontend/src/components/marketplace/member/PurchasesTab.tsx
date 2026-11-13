import { dateFromTs, shorten } from "@/lib/blockchain/marketplace-format";
import type { Purchase } from "@/types/marketplace";
import { EmptyState } from "./EmptyState";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/marketplace/ui/tabs";
import { formatUnits } from "ethers";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PurchasesTab({
  purchases,
  tokenDecimals,
  tokenSymbol,
}: {
  purchases: Purchase[];
  tokenDecimals: number;
  tokenSymbol: string;
}) {
  const { t } = useTranslation();

  return (
    <TabsContent value="purchases" className="p-4 sm:p-7">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t("orderPurchaseHistory") || "Order & Purchase History"}
          </h2>
          <p className="text-xs text-toota-muted mt-0.5">
            {t("orderPurchaseHistorySubtitle") || "Immutable purchase receipts recorded permanently on the Ethereum Sepolia smart contract."}
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs px-3 py-1 rounded-full w-fit">
          {purchases.length} {purchases.length === 1 ? (t("recordedOrder") || "Recorded Order") : (t("recordedOrdersCount") || "Recorded Orders")}
        </Badge>
      </div>

      {purchases.length ? (
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/40">
              <TableRow className="border-b border-zinc-200/60 dark:border-zinc-800">
                <TableHead className="w-[80px] text-xs font-semibold text-toota-muted">{t("orderCol") || "Order"}</TableHead>
                <TableHead className="text-xs font-semibold text-toota-muted">{t("productCol") || "Product"}</TableHead>
                <TableHead className="text-xs font-semibold text-toota-muted">{t("merchantWalletCol") || "Merchant Wallet"}</TableHead>
                <TableHead className="text-center text-xs font-semibold text-toota-muted">{t("qtyCol") || "Qty"}</TableHead>
                <TableHead className="text-right text-xs font-semibold text-toota-muted">{t("totalPriceCol") || "Total Price"}</TableHead>
                <TableHead className="text-right text-xs font-semibold text-toota-muted">{t("timestampCol") || "Timestamp"}</TableHead>
                <TableHead className="text-center text-xs font-semibold text-toota-muted">{t("verificationCol") || "Verification"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((item) => (
                <TableRow
                  key={item.id.toString()}
                  className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <TableCell className="font-mono text-xs text-toota-muted">
                    #{item.id.toString()}
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {item.productName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {shorten(item.gymOwner)}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {item.quantity.toString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100">
                    {formatUnits(item.totalPrice, tokenDecimals)}{" "}
                    <span className="text-xs font-semibold text-toota-green">
                      {tokenSymbol}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs text-toota-muted font-mono">
                    {dateFromTs(item.time)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                      <CheckCircle2 className="size-3 text-toota-green" />
                      {t("verifiedBadge") || "Verified"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={<ShoppingBag className="size-6 text-zinc-500 dark:text-zinc-400" />}
          title={t("noPurchasesYet") || "No purchases yet"}
          body={t("noPurchasesYetBody") || "Your completed purchases with G tokens will be permanently and immutably recorded here on the blockchain."}
        />
      )}
    </TabsContent>
  );
}
