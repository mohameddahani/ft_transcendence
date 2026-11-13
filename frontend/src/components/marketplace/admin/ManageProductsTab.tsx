import type { Product } from "@/types/marketplace";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/marketplace/ui/tabs";
import { formatUnits } from "ethers";
import { Package, Plus, Trash2, Edit3, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <TabsContent value="manage" className="p-4 sm:p-7">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t("inventoryProductManagement") || "Inventory & Product Management"}
          </h2>
          <p className="text-xs text-toota-muted mt-0.5">
            {t("inventoryProductManagementSubtitle") || "Add, update pricing, or remove products associated with your connected merchant wallet."}
          </p>
        </div>

        <Button
          variant="default"
          onClick={() => setShowAdd(true)}
          className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm w-fit"
        >
          <Plus className="size-4 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
          {t("addProduct") || "Add Product"}
        </Button>
      </div>

      {products.length ? (
        <div className="space-y-3">
          {products.map((product) => {
            const price = formatUnits(product.price, tokenDecimals);
            const isOutOfStock = product.stock === 0n;

            return (
              <div
                key={product.id.toString()}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs"
              >
                <div className="flex items-center gap-4">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-800">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-400">
                        <ShoppingBag className="size-5" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {product.name}
                      </span>
                      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                        #{product.id.toString()}
                      </span>
                    </div>

                    <p className="line-clamp-1 text-xs text-toota-muted mt-0.5">
                      {product.description || (t("noDescriptionProvided") || "No description provided")}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2.5 text-xs">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {price} <span className="text-toota-green font-semibold">{tokenSymbol}</span>
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      {isOutOfStock ? (
                        <span className="text-rose-500 font-medium text-[11px]">
                          {t("outOfStock") || "Out of stock"}
                        </span>
                      ) : (
                        <span className="text-toota-muted text-[11px]">
                          {t("unitsInStock", { count: product.stock.toString(), defaultValue: `${product.stock.toString()} units in stock` })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditProduct(product)}
                    className="toota-pill h-9 px-3.5 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
                  >
                    <Edit3 className="size-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-toota-muted" />
                    {t("edit") || "Edit"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteProduct(product)}
                    className="size-9 rounded-full p-0 flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 cursor-pointer"
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
          icon={<Package className="size-6 text-zinc-500 dark:text-zinc-400" />}
          title={t("noProductsYet") || "No products yet"}
          body={t("noProductsYetBody") || "Start selling by listing your first product on the decentralized gym store."}
          action={
            <Button
              variant="default"
              onClick={() => setShowAdd(true)}
              className="toota-pill h-9 px-4 text-xs font-semibold cursor-pointer bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm"
            >
              <Plus className="size-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
              {t("addFirstProduct") || "Add First Product"}
            </Button>
          }
        />
      )}
    </TabsContent>
  );
}
