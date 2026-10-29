import { shorten } from "@/lib/blockchain/marketplace-format";
import type { Product } from "@/types/marketplace";
import { EmptyState } from "./EmptyState";
import { Badge } from "@/components/marketplace/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/marketplace/ui/card";
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
    <TabsContent value="MyProducts" className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Store Catalog
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Read your active inventory directly on the blockchain.
          </p>
        </div>
        <Badge variant="secondary">
          {products.length} {products.length === 1 ? "Item" : "Items"}
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
          title="No products found"
          body={
            merchantMode
              ? `No products are registered for ${shorten(merchantMode)}.`
              : "Connect a wallet or add products in the Manage tab."
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

  return (
    <Card className="group overflow-hidden border-border bg-card transition-all hover:border-primary/40 hover:shadow-xs">
      <div className="relative aspect-video w-full overflow-hidden bg-muted/60">
        {product &&
        JSON.stringify(product?.images) != "[]" &&
        product.images?.[0] ? (
          <img
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={product.images[0]}
            alt={product.name}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
            <ShoppingBag className="size-8 opacity-60" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="backdrop-blur-xs font-mono text-[11px]"
          >
            #{product.id.toString()}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="success" className="backdrop-blur-xs text-[11px]">
            {product.stock.toString()} available
          </Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold">
          {product.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 min-h-10 text-xs">
          {product.description || "No description provided."}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-primary">{price}</span>
          <span className="text-xs font-semibold text-primary">{symbol}</span>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/60 p-3 px-4 text-[11px] text-muted-foreground font-mono">
        My addr: {shorten(product.merchant)}
      </CardFooter>
    </Card>
  );
}
