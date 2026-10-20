import type { Product } from "@/types/marketplace";
import { EmptyState } from "./EmptyState";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
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
            Your marketplace products are keyed by your connected wallet
            address.
          </p>
        </div>

        <Button variant="default" onClick={() => setShowAdd(true)}>
          <Plus className="size-4 mr-1.5" />
          Add product
        </Button>
      </div>

      <div className="border-t border-border pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Your Products
          </h3>
          <span className="text-xs text-muted-foreground">
            {products.length} items total
          </span>
        </div>

        {products.length ? (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id.toString()}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                    {product &&
                    JSON.stringify(product?.images) != "[]" &&
                    product.images?.[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        className="h-full w-full object-cover"
                        src={product.images[0]}
                        alt={product.name}
                      />
                    ) : (
                      <Package className="size-5" />
                    )}
                  </div>

                  <div>
                    <strong className="block text-sm font-medium text-foreground">
                      {product.name}
                    </strong>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        ID #{product.id.toString()}
                      </Badge>
                      <span>·</span>
                      <span>{product.stock.toString()} in stock</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-bold text-primary">
                      {formatUnits(product.price, tokenDecimals)} {tokenSymbol}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditProduct(product);
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteProduct(product)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your inventory is empty"
            body="Add your first product to make it available on-chain."
            compact
          />
        )}
      </div>
    </TabsContent>
  );
}
