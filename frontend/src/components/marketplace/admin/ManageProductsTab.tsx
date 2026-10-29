import type { Product } from "@/types/marketplace";
import { EmptyState } from "./EmptyState";
import { Badge } from "@/components/marketplace/ui/badge";
import { Button } from "@/components/marketplace/ui/button";
import { TabsContent } from "@/components/marketplace/ui/tabs";
import { formatUnits } from "ethers";
import { Package, Plus, Trash2 } from "lucide-react";

export function ManageProductsTab({
  products,
  tokenDecimals,
  tokenSymbol,
  setShowAdd,
  setEditProduct,
  setDeleteProduct,
}: {
  products: Product[];
  tokenDecimals: number;
  tokenSymbol: string;
  setShowAdd: (value: boolean) => void;
  setEditProduct: (value: Product) => void;
  setDeleteProduct: (value: Product) => void;
}) {
  return (
    <TabsContent value="manage" className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Merchant Tools
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your marketplace products are keyed by your connected wallet address.
          </p>
        </div>

        <Button variant="default" onClick={() => setShowAdd(true)}>
          <Plus className="size-4 mr-1.5" />
          Add product
        </Button>
      </div>

      {products.length ? (
        <div className="space-y-3">
          {products.map((product) => {
            const price = formatUnits(product.price, tokenDecimals);
            return (
              <div
                key={product.id.toString()}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted/60">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Package className="size-5" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {product.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px]"
                      >
                        #{product.id.toString()}
                      </Badge>
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {product.description || "No description"}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="font-bold text-primary">
                        {price} {tokenSymbol}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {product.stock.toString()} in stock
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditProduct(product)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteProduct(product)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No products yet"
          body="Start selling by listing your first product on the decentralized store."
        />
      )}
    </TabsContent>
  );
}
