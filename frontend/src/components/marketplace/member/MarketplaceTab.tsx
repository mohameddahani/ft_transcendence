import { shorten } from "@/lib/blockchain/marketplace-format";
import type { Product } from "@/types/marketplace";
import { EmptyState } from "./EmptyState";
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
import { TabsContent } from "@/components/marketplace/ui/tabs";
import { formatUnits } from "ethers";
import { Loader2, Minus, Plus, Search, ShoppingBag, Sparkles } from "lucide-react";
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
    <TabsContent value="shop" className="p-4 sm:p-7">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Available Products Catalog
          </h2>
          <p className="text-xs text-toota-muted mt-0.5">
            Browse verified items from gym merchants and purchase gasless with {tokenSymbol} tokens.
          </p>
        </div>

        {/* Merchant Search & Selector */}
        <div className="flex items-center gap-2 max-w-md w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Merchant address (0x...)"
              value={marketAddress}
              onChange={(e) => setMarketAddress(e.target.value)}
              className="pl-9 text-xs font-mono h-10 rounded-2xl border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={isRefreshing}
            className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner shrink-0"
          >
            {isRefreshing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              "Load Store"
            )}
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
          icon={<ShoppingBag className="size-6 text-zinc-500 dark:text-zinc-400" />}
          title="No products found in store"
          body={
            marketAddress.trim()
              ? `No inventory items are registered on-chain for merchant ${shorten(marketAddress.trim())}. Try searching another merchant wallet address.`
              : account
                ? "Enter a gym merchant wallet address above to explore their products."
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

  const handleIncrement = () => {
    try {
      const current = BigInt(quantity || "0");
      if (current < product.stock) {
        setQuantity((current + 1n).toString());
      }
    } catch {
      setQuantity("1");
    }
  };

  const handleDecrement = () => {
    try {
      const current = BigInt(quantity || "1");
      if (current > 1n) {
        setQuantity((current - 1n).toString());
      }
    } catch {
      setQuantity("1");
    }
  };

  const isOutOfStock = product.stock === 0n;

  return (
    <Card className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition-all duration-200">
      {/* Product Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/60">
        {product.images && product.images.length > 0 && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
              Out of stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0" />
              <span>{product.stock.toString()} in stock</span>
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

      <CardContent className="p-5 pt-1 flex-1 flex flex-col justify-between space-y-4">
        {/* Pricing & Calculated Total */}
        <div className="flex items-baseline justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
          <div>
            <span className="text-[10px] uppercase font-semibold text-toota-muted block tracking-wider">
              Unit Price
            </span>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {price}{" "}
              <span className="text-xs font-semibold text-toota-green">
                {symbol}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-toota-muted block tracking-wider">
              Total Due
            </span>
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {total}{" "}
              <span className="text-xs font-semibold text-toota-green">
                {symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Quantity Controls & Buy Action */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-toota-inner p-1">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={busy || isOutOfStock || Number(quantity) <= 1}
              className="size-7 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 disabled:opacity-30 cursor-pointer"
            >
              <Minus className="size-3" />
            </button>
            <input
              type="number"
              min="1"
              max={product.stock.toString()}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={busy || isOutOfStock}
              className="w-10 text-center font-semibold text-xs bg-transparent focus:outline-none"
            />
            <button
              type="button"
              onClick={handleIncrement}
              disabled={busy || isOutOfStock || BigInt(quantity || "0") >= product.stock}
              className="size-7 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 disabled:opacity-30 cursor-pointer"
            >
              <Plus className="size-3" />
            </button>
          </div>

          <Button
            variant="default"
            size="default"
            className="toota-pill flex-1 h-10 px-4 text-xs font-semibold cursor-pointer bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm disabled:opacity-50"
            disabled={
              busy || !gaslessEnabled || isOutOfStock || !isValidQty
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
            ) : isOutOfStock ? (
              "Sold Out"
            ) : (
              <>
                <Sparkles className="size-3.5 mr-1.5 text-toota-green" />
                Buy with {symbol}
              </>
            )}
          </Button>
        </div>
      </CardContent>

      <CardFooter className="border-t border-zinc-100 dark:border-zinc-800/80 p-3.5 px-5 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center justify-between text-xs text-toota-muted font-mono">
        <span>Merchant:</span>
        <span
          className="text-zinc-700 dark:text-zinc-300 font-medium"
          title={product.merchant}
        >
          {shorten(product.merchant)}
        </span>
      </CardFooter>
    </Card>
  );
}
