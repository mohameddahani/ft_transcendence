import { shorten } from "@/lib/blockchain/marketplace-format";
import type { Sale } from "@/types/marketplace";
import { EmptyState } from "./EmptyState";
import { Badge } from "@/components/marketplace/ui/badge";
import { Button } from "@/components/marketplace/ui/button";
import { Card } from "@/components/marketplace/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/marketplace/ui/table";
import { TabsContent } from "@/components/marketplace/ui/tabs";
import { formatUnits } from "ethers";

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
    <TabsContent value="sales" className="p-6">
      <SalesTable
        items={sales}
        decimals={tokenDecimals}
        symbol={tokenSymbol}
        onDeliver={markDelivered}
        busy={busy}
      />
    </TabsContent>
  );
}

function SalesTable({
  items,
  decimals,
  symbol,
  onDeliver,
  busy,
}: {
  items: Sale[];
  decimals: number;
  symbol: string;
  onDeliver: (id: bigint) => Promise<void>;
  busy: boolean;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Sales & Orders
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage orders from customers who purchased your products.
          </p>
        </div>
        <Badge variant="secondary">
          {items.length} {items.length === 1 ? "Order" : "Orders"}
        </Badge>
      </div>

      {items.length ? (
        <Card className="overflow-hidden border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id.toString()}>
                  <TableCell className="font-semibold text-foreground">
                    {item.productName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {shorten(item.client)}
                  </TableCell>
                  <TableCell>{item.quantity.toString()}</TableCell>
                  <TableCell className="font-bold text-primary">
                    {formatUnits(item.totalPrice, decimals)} {symbol}
                  </TableCell>
                  <TableCell>
                    {item.status ? (
                      <Badge variant="success">Delivered</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-amber-500"
                      >
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status ? (
                      <span className="text-xs text-muted-foreground">
                        Completed
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={busy}
                        onClick={() => void onDeliver(item.id)}
                      >
                        Mark delivered
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          title="No sales yet"
          body="Orders for your marketplace will appear here once customers purchase your items."
        />
      )}
    </div>
  );
}
