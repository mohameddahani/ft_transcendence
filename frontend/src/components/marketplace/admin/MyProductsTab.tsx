import { shorten } from "@/lib/blockchain/marketplace-format";
import type { Product } from "@/types/marketplace";
import { EmptyState } from "./EmptyState";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/marketplace/ui/tabs";
import { formatUnits } from "ethers";
import { ShoppingBag } from "lucide-react";

export function MyProductsTab({
  products,
  tokenDecimals,
  tokenSymbol,
  merchantMode,
}: {
  products: Product[];
  tokenDecimals: number;
  tokenSymbol: string;
  merchantMode: string;
}) {
  return (
    <TabsContent value="MyProducts" className="p-4 sm:p-7">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Storefront Catalog
          </h2>
          <p className="text-xs text-toota-muted mt-0.5">
            Active products and inventory stored directly on the smart contract.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs px-3 py-1 rounded-full w-fit">
          {products.length} {products.length === 1 ? "Listed Item" : "Listed Items"}
        </Badge>
      </div>

      {products.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={`${product.merchant}-${product.id.toString()}`}
              product={product}
              decimals={tokenDecimals}
              symbol={tokenSymbol}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No products listed"
          body={
            merchantMode
              ? `No inventory items are registered on-chain for ${shorten(merchantMode)}.`
              : "Connect your Web3 wallet or add products in the Manage Inventory tab."
          }
        />
      )}
    </TabsContent>
  );
}

function ProductCard({
  product,
  decimals,
  symbol,
}: {
  product: Product;
  decimals: number;
  symbol: string;
}) {
  const price = formatUnits(product.price, decimals);
  const isOutOfStock = product.stock === 0n;

  return (
    <Card className="group overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition-all duration-200">
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/60">
        {product &&
        JSON.stringify(product?.images) !== "[]" &&
        product.images?.[0] ? (
          <img
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={product.images[0]}
            alt={product.name}
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400">
            <ShoppingBag className="size-9 opacity-50" />
          </div>
        )}

        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-lg bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-300 ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-800/60">
            #{product.id.toString()}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white">
              Sold out
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0" />
              <span>{product.stock.toString()} available</span>
            </span>
          )}
        </div>
      </div>

      <CardHeader className="p-5 pb-2">
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 line-clamp-1">
          {product.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 min-h-[34px] text-xs text-toota-muted leading-relaxed mt-1">
          {product.description || "No description provided."}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {price}
          </span>
          <span className="text-xs font-semibold text-toota-green">
            {symbol}
          </span>
        </div>
      </CardContent>

      <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 p-3.5 px-5 text-xs text-toota-muted font-mono flex items-center justify-between">
        <span>Merchant:</span>
        <span className="text-zinc-700 dark:text-zinc-300 font-medium">
          {shorten(product.merchant)}
        </span>
      </CardFooter>
    </Card>
  );
}
