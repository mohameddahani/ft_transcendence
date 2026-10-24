import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductFormData } from "@/types/marketplace";
import axios from "axios";
import { Globe, Loader2 } from "lucide-react";
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

  // Optional image verification using axios
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
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="text-primary">{title}</DialogTitle>
          <DialogDescription>
            {title.includes("Add")
              ? "Create a new product on the blockchain marketplace."
              : "Update product details in the smart contract registry."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="productId">Product ID</Label>
            <Input
              id="productId"
              readOnly
              {...register("id", { required: "Product ID is required" })}
            />
            {errors.id && (
              <span className="text-xs text-destructive">
                {errors.id.message}
              </span>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              {...register("name", { required: "Product name is required" })}
              placeholder="e.g. Whey Protein Isolate"
            />
            {errors.name && (
              <span className="text-xs text-destructive">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Provide a clear description of the product or service"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register("stock", {
                  required: "Stock quantity is required",
                })}
              />
              {errors.stock && (
                <span className="text-xs text-destructive">
                  {errors.stock.message}
                </span>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="price">Price in {tokenSymbol}</Label>
              <Input
                id="price"
                {...register("price", { required: "Price is required" })}
                placeholder="10"
              />
              {errors.price && (
                <span className="text-xs text-destructive">
                  {errors.price.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="images">Image URLs</Label>
              <button
                type="button"
                onClick={checkFirstImageUrl}
                disabled={validatingImage}
                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
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
            />
            <p className="text-[11px] text-muted-foreground">
              Comma-separated web addresses for product preview images.
            </p>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {title === "Edit product" ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
