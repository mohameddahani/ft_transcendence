import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/marketplace/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/marketplace/ui/textarea";
import type { ProductFormData } from "@/types/marketplace";
import axios from "axios";
import { Globe, Loader2, PackagePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

export function ProductModal({
  title,
  initialData,
  onClose,
  onSave,
  busy,
  tokenSymbol,
}: {
  title: string;
  initialData: ProductFormData;
  onClose: () => void;
  onSave: (data: ProductFormData) => Promise<void>;
  busy: boolean;
  tokenSymbol: string;
}) {
  const [validatingImage, setValidatingImage] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: initialData,
  });

  useEffect(() => {
    if (title.toLowerCase().includes("add") && !initialData.id) {
      setValue("id", `${Math.round(Math.random() * 1000000)}`);
    }
  }, [title, initialData.id, setValue]);

  const checkFirstImageUrl = async () => {
    const urls = (getValues("images") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!urls.length) {
      toast.info("Please enter an image URL first.");
      return;
    }

    setValidatingImage(true);
    try {
      await axios.get(urls[0], { timeout: 4000 });
      toast.success("Image URL is reachable!");
    } catch {
      toast.warning(
        "Could not reach image URL directly (CORS or network). Make sure the link is public.",
      );
    } finally {
      setValidatingImage(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    await onSave(data);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent onClose={onClose} className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-toota-inner flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-2xs">
              <PackagePlus className="size-4 text-toota-green" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {title.toLowerCase().includes("add")
                  ? "Register a new inventory product on the smart contract."
                  : "Update product pricing and inventory on Ethereum Sepolia."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="productId" className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              Product ID
            </Label>
            <Input
              id="productId"
              readOnly
              className="bg-toota-inner font-mono text-xs cursor-not-allowed border-zinc-200/80 dark:border-zinc-800"
              {...register("id", { required: "Product ID is required" })}
            />
            {errors.id && (
              <span className="text-xs text-rose-500 font-medium">
                {errors.id.message}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              Product Name
            </Label>
            <Input
              id="name"
              {...register("name", { required: "Product name is required" })}
              placeholder="e.g. Whey Protein Isolate 1kg"
              className="border-zinc-200/80 dark:border-zinc-800 text-xs sm:text-sm"
            />
            {errors.name && (
              <span className="text-xs text-rose-500 font-medium">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              Description
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Provide a clear description of the product or service"
              rows={3}
              className="border-zinc-200/80 dark:border-zinc-800 text-xs sm:text-sm rounded-xl resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stock" className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
                Stock Quantity
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register("stock", {
                  required: "Stock quantity is required",
                })}
                className="border-zinc-200/80 dark:border-zinc-800 text-xs sm:text-sm font-semibold"
              />
              {errors.stock && (
                <span className="text-xs text-rose-500 font-medium">
                  {errors.stock.message}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
                Price ({tokenSymbol})
              </Label>
              <Input
                id="price"
                {...register("price", { required: "Price is required" })}
                placeholder="10"
                className="border-zinc-200/80 dark:border-zinc-800 text-xs sm:text-sm font-semibold"
              />
              {errors.price && (
                <span className="text-xs text-rose-500 font-medium">
                  {errors.price.message}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="images" className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
                Image URLs
              </Label>
              <button
                type="button"
                onClick={checkFirstImageUrl}
                disabled={validatingImage}
                className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-toota-green inline-flex items-center gap-1 cursor-pointer font-medium"
              >
                {validatingImage ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Globe className="size-3" />
                )}
                Check Image URL
              </button>
            </div>
            <Input
              id="images"
              {...register("images")}
              placeholder="https://example.com/item.jpg, https://..."
              className="border-zinc-200/80 dark:border-zinc-800 text-xs"
            />
            <p className="text-[11px] text-toota-muted">
              Comma-separated web addresses for product preview images.
            </p>
          </div>

          <DialogFooter className="mt-6 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
              className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={busy}
              className="toota-pill h-10 px-6 text-xs font-semibold cursor-pointer bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm"
            >
              {busy && <Loader2 className="size-3.5 animate-spin mr-2" />}
              {title === "Edit product" ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
