import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "@/types/marketplace";
import { formatUnits } from "ethers";
import { Loader2 } from "lucide-react";

export function PurchaseDialog({
  confirmBuyProduct,
  setConfirmBuyProduct,
  tokenDecimals,
  tokenSymbol,
  buyingId,
  buy,
}: {
  confirmBuyProduct: { product: Product; quantity: bigint };
  setConfirmBuyProduct: (value: null) => void;
  tokenDecimals: number;
  tokenSymbol: string;
  buyingId: bigint | null;
  buy: (product: Product, quantity: bigint) => Promise<void>;
}) {
  return (
    <Dialog
      open={!!confirmBuyProduct}
      onOpenChange={(open) => !open && setConfirmBuyProduct(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogDescription>
            Review your order details before submitting to the blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Item:</span>
            <span className="font-bold text-foreground">
              {confirmBuyProduct.product.name}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Quantity:</span>
            <span className="font-semibold">
              {confirmBuyProduct.quantity.toString()} units
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Unit Price:</span>
            <span>
              {formatUnits(confirmBuyProduct.product.price, tokenDecimals)}{" "}
              {tokenSymbol}
            </span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between items-center text-sm font-bold">
            <span>Total Due:</span>
            <span className="text-primary text-base">
              {formatUnits(
                confirmBuyProduct.product.price * confirmBuyProduct.quantity,
                tokenDecimals,
              )}{" "}
              {tokenSymbol}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmBuyProduct(null)}>
            Cancel
          </Button>
          <Button
            variant="default"
            disabled={buyingId === confirmBuyProduct.product.id}
            onClick={() =>
              buy(confirmBuyProduct.product, confirmBuyProduct.quantity)
            }
          >
            {buyingId === confirmBuyProduct.product.id ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Processing…
              </>
            ) : (
              "Confirm & Pay"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
