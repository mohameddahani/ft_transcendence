import { dateFromTs, shorten } from "@/lib/marketplace-format";
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
import { TabsContent } from "@/components/ui/tabs";
import { formatUnits } from "ethers";
import { ShoppingBag } from "lucide-react";

export function PurchasesTab({
  purchases,
  tokenDecimals,
  tokenSymbol,
}: {
  purchases: Purchase[];
  tokenDecimals: number;
  tokenSymbol: string;
}) {
  return (
    <TabsContent value="purchases" className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Purchase History
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable purchase receipts recorded by the GymToken smart contract.
          </p>
        </div>
        <Badge variant="secondary" className="font-mono">
          {purchases.length} {purchases.length === 1 ? "order" : "orders"}
        </Badge>
      </div>

      {purchases.length ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[80px]">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Gym Owner / Merchant</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Total Price</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((item) => (
                <TableRow key={item.id.toString()}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{item.id.toString()}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {item.productName}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {shorten(item.gymOwner)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.quantity.toString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatUnits(item.totalPrice, tokenDecimals)}{" "}
                    <span className="text-xs">{tokenSymbol}</span>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground font-mono">
                    {dateFromTs(item.time)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={<ShoppingBag className="size-8 text-muted-foreground" />}
          title="No purchases yet"
          body="Your completed purchases with G tokens will be permanently tracked here."
        />
      )}
    </TabsContent>
  );
}
