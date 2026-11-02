import { shorten } from "@/lib/marketplace-format";
import type { Product } from "@/types/marketplace";
import { EmptyState } from "./EmptyState";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { formatUnits } from "ethers";
import { Loader2, Package, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";

export function MarketplaceTab({
  products,
  tokenSymbol,
  GASLESS_ENABLED,
  marketAddress,
  setMarketAddress,
  refresh,
  isRefreshing,
  tokenDecimals,
  buyingId,
  setConfirmBuyProduct,
  account,
}: {
  products: Product[];
  tokenSymbol: string;
  GASLESS_ENABLED: boolean;
  marketAddress: string;
  setMarketAddress: (value: string) => void;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  tokenDecimals: number;
  buyingId: bigint | null;
  setConfirmBuyProduct: (value: { product: Product; quantity: bigint }) => void;
  account: string;
}) {
  return (
    <TabsContent value="shop" className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Marketplace Catalog
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Explore any gym merchant&apos;s on-chain inventory and purchase with{" "}
            {tokenSymbol} tokens.
          </p>
          {!GASLESS_ENABLED && (
            <p className="mt-1 text-xs text-amber-500">
              Gasless checkout needs your new Remix deployment address.
            </p>
          )}
        </div>

        {/* Merchant input */}
        <div className="flex items-center gap-2 max-w-md w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Merchant address (0x...)"
              value={marketAddress}
              onChange={(e) => setMarketAddress(e.target.value)}
              className="pl-9 text-xs font-mono"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refresh()}
            disabled={isRefreshing}
          >
            Load
          </Button>
        </div>
      </div>

      {products.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={`${product.merchant}-${product.id.toString()}`}
              product={product}
              decimals={tokenDecimals}
              symbol={tokenSymbol}
              busy={buyingId !== null}
              gaslessEnabled={GASLESS_ENABLED}
              onBuy={(item, qty) =>
                setConfirmBuyProduct({ product: item, quantity: qty })
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="size-8 text-muted-foreground" />}
          title="No products found"
          body={
            marketAddress.trim()
              ? `No products registered on-chain for merchant ${shorten(marketAddress.trim())}. Try another address.`
              : account
                ? "Enter a gym merchant address above to view their inventory."
                : "Connect your Web3 wallet or enter a merchant address to explore available products."
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
  busy,
  gaslessEnabled,
  onBuy,
}: {
  product: Product;
  decimals: number;
  symbol: string;
  busy: boolean;
  gaslessEnabled: boolean;
  onBuy: (product: Product, quantity: bigint) => void;
}) {
  const [quantity, setQuantity] = useState("1");
  const price = formatUnits(product.price, decimals);

  const total = (() => {
    try {
      const q = BigInt(quantity || "0");
      return formatUnits(product.price * q, decimals);
    } catch {
      return "0";
    }
  })();

  const isValidQty = (() => {
    try {
      const q = BigInt(quantity || "0");
      return q > 0n && q <= product.stock;
    } catch {
      return false;
    }
  })();

  return (
    <Card className="flex flex-col overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      {/* Product Image */}
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-muted/50">
        {product.images && product.images.length > 0 && product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
            <ShoppingBag className="size-10" />
            <span className="text-[10px]">No image provided</span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge
            variant="outline"
            className="bg-background/80 font-mono text-[10px] backdrop-blur-xs"
          >
            #{product.id.toString()}
          </Badge>
        </div>

        <div className="absolute top-3 right-3">
          {product.stock > 0n ? (
            <Badge variant="success" className="text-[10px]">
              {product.stock.toString()} in stock
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px]">
              Out of stock
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-bold tracking-tight line-clamp-1">
          {product.name}
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
          {product.description || "No description provided."}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1 space-y-3">
        <div className="flex items-baseline justify-between border-t border-border/60 pt-3">
          <div>
            <span className="text-[10px] uppercase font-medium text-muted-foreground block">
              Price
            </span>
            <div className="text-lg font-extrabold text-foreground">
              {price}{" "}
              <span className="text-xs font-semibold text-primary">
                {symbol}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-medium text-muted-foreground block">
              Total
            </span>
            <div className="text-sm font-bold text-primary">
              {total} {symbol}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className="w-24 shrink-0">
            <Input
              type="number"
              min="1"
              max={product.stock.toString()}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={busy || product.stock === 0n}
              className="h-9 text-center font-semibold text-xs"
            />
          </div>
          <Button
            variant="default"
            size="default"
            className="flex-1 text-xs font-semibold"
            disabled={
              busy || !gaslessEnabled || product.stock === 0n || !isValidQty
            }
            onClick={() => onBuy(product, BigInt(quantity || "1"))}
          >
            {busy ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Purchasing…
              </>
            ) : !gaslessEnabled ? (
              "Gasless unavailable"
            ) : product.stock === 0n ? (
              "Sold Out"
            ) : (
              <>
                <ShoppingBag className="size-3.5 mr-1.5" />
                Buy with {symbol} (no ETH)
              </>
            )}
          </Button>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/40 p-4 py-2.5 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Merchant:</span>
        <span
          className="font-mono hover:text-foreground transition-colors"
          title={product.merchant}
        >
          {shorten(product.merchant)}
        </span>
      </CardFooter>
    </Card>
  );
}
