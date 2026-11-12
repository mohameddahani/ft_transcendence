import { shorten } from "@/lib/blockchain/marketplace-format";
import type { Sale } from "@/types/marketplace";
import { EmptyState } from "./EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { CheckCircle2, Clock, Loader2, PackageCheck } from "lucide-react";

export function SalesTab({
  sales,
  tokenDecimals,
  tokenSymbol,
  markDelivered,
  busy,
}: {
  sales: Sale[];
  tokenDecimals: number;
  tokenSymbol: string;
  markDelivered: (id: bigint) => Promise<void>;
  busy: boolean;
}) {
  return (
    <TabsContent value="sales" className="p-4 sm:p-7">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sales & Order Fulfillment
          </h2>
          <p className="text-xs text-toota-muted mt-0.5">
            Monitor incoming member purchases and mark physical items as delivered.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs px-3 py-1 rounded-full w-fit">
          {sales.length} {sales.length === 1 ? "Recorded Order" : "Recorded Orders"}
        </Badge>
      </div>

      {sales.length ? (
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/40">
              <TableRow className="border-b border-zinc-200/60 dark:border-zinc-800">
                <TableHead className="w-[80px] text-xs font-semibold text-toota-muted">Order</TableHead>
                <TableHead className="text-xs font-semibold text-toota-muted">Product</TableHead>
                <TableHead className="text-xs font-semibold text-toota-muted">Client Wallet</TableHead>
                <TableHead className="text-center text-xs font-semibold text-toota-muted">Qty</TableHead>
                <TableHead className="text-right text-xs font-semibold text-toota-muted">Total Price</TableHead>
                <TableHead className="text-center text-xs font-semibold text-toota-muted">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold text-toota-muted">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((item) => (
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
                    {shorten(item.client)}
                  </TableCell>
                  <TableCell className="text-center">
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
                  <TableCell className="text-center">
                    {item.status ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                        <CheckCircle2 className="size-3" />
                        Delivered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20">
                        <Clock className="size-3" />
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status ? (
                      <span className="text-xs text-toota-muted font-medium">
                        Completed
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={busy}
                        onClick={() => void markDelivered(item.id)}
                        className="toota-pill h-8 px-3 text-xs font-semibold cursor-pointer bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-2xs"
                      >
                        {busy ? (
                          <Loader2 className="size-3 animate-spin mr-1.5" />
                        ) : (
                          <PackageCheck className="size-3 mr-1.5" />
                        )}
                        Mark Delivered
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={<PackageCheck className="size-6 text-zinc-500 dark:text-zinc-400" />}
          title="No sales yet"
          body="Customer orders for your gym products will appear here once purchases are made on-chain."
        />
      )}
    </TabsContent>
  );
}
