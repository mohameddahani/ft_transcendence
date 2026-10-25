"use client";
import { ConfirmModal } from "@/components/marketplace/dialogs/ConfirmModal";
import { ProductModal } from "@/components/marketplace/dialogs/ProductModal";
import { useAdminMarketplace } from "@/hooks/useAdminMarketplace";
import { shorten } from "@/lib/marketplace-format";

import { formatUnits } from "ethers";
import {
  AlertTriangle,
  Dumbbell,
  Package,
  Plus,
  RefreshCw,
  Store,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CHAIN_NAME, CONTRACT_ADDRESS } from "@/app/contract";
import { ManageProductsTab } from "@/components/marketplace/ManageProductsTab";
import { MyProductsTab } from "@/components/marketplace/MyProductsTab";
import { SalesTab } from "@/components/marketplace/SalesTab";

export default function MarketplaceAdminPage() {
  const {
    account,
    tokenDecimals,
    tokenSymbol,
    products,
    sales,
    tab,
    setTab,
    busy,
    showAdd,
    setShowAdd,
    editProduct,
    setEditProduct,
    deleteProduct,
    setDeleteProduct,
    refresh,
    connect,
    switchToSepolia,
    handleSaveProduct,
    closeProductModal,
    remove,
    markDelivered,
    isSepolia,
    merchantMode,
    balanceLabel,
  } = useAdminMarketplace();

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Dumbbell className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-xl text-primary">
                  GymOwner
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  Web3
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Token-Powered Fitness Commerce
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isSepolia && account && (
              <Button
                variant="outline"
                size="sm"
                className="border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs"
                onClick={switchToSepolia}
              >
                <AlertTriangle className="size-3.5 mr-1" />
                Switch to Sepolia
              </Button>
            )}

            {account ? (
              <div className="flex items-center gap-2.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs shadow-xs">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-green opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-secondary-green" />
                </span>
                <span className="font-mono text-muted-foreground">
                  {shorten(account)}
                </span>
                <span className="border-l border-border pl-2.5 font-bold text-primary">
                  {balanceLabel} {tokenSymbol}
                </span>
              </div>
            ) : (
              <Button variant="default" size="default" onClick={connect}>
                <Wallet className="size-4 mr-1.5" />
                Connect wallet
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        {/* Hero & Stats Section */}
        <section className="mb-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary-green" />
              On-Chain Gym Commerce
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              Turn your gym into a{" "}
              <span className="text-primary">token-powered</span> marketplace.
            </h1>

            <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Empower your members to purchase merchandise, supplements, and
              services with{" "}
              <span className="font-semibold text-primary">
                {tokenSymbol} tokens
              </span>{" "}
              directly through decentralized smart contracts.
            </p>
          </div>

          {/* Balance & Contract Card */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Smart Contract
                </span>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {shorten(CONTRACT_ADDRESS)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  <span className="text-primary">{balanceLabel}</span>{" "}
                  <span className="text-xl font-semibold text-primary">
                    {tokenSymbol}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Available token balance in connected wallet
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <span className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                    Network
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary-green" />
                    {CHAIN_NAME}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <span className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                    Token
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    GymToken ({tokenSymbol})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main Dashboard Navigation & Views */}
        <Card className="border-border bg-card shadow-xs">
          <Tabs
            value={tab}
            onValueChange={(val) =>
              setTab(val as "MyProducts" | "sales" | "manage")
            }
            className="w-full"
          >
            <div className="flex flex-wrap items-center justify-between border-b border-border px-4 py-3 gap-3">
              <TabsList className="bg-muted/60 p-1">
                <TabsTrigger value="MyProducts" className="gap-2">
                  <Store className="size-4" />
                  <span>My Products</span>
                </TabsTrigger>
                <TabsTrigger value="sales" className="gap-2">
                  <Package className="size-4" />
                  <span>My sales</span>
                </TabsTrigger>
                <TabsTrigger value="manage" className="gap-2">
                  <Plus className="size-4" />
                  <span>Manage</span>
                </TabsTrigger>
              </TabsList>

              <Button
                variant="outline"
                size="icon"
                title="Refresh DApp data"
                onClick={() => {
                  void refresh();
                }}
                className="rounded-lg"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>

            <MyProductsTab
              products={products}
              tokenDecimals={tokenDecimals}
              tokenSymbol={tokenSymbol}
              merchantMode={merchantMode}
            />
            <SalesTab
              sales={sales}
              tokenDecimals={tokenDecimals}
              tokenSymbol={tokenSymbol}
              markDelivered={markDelivered}
              busy={busy}
            />
            <ManageProductsTab
              products={products}
              tokenDecimals={tokenDecimals}
              tokenSymbol={tokenSymbol}
              setShowAdd={setShowAdd}
              setEditProduct={setEditProduct}
              setDeleteProduct={setDeleteProduct}
            />
          </Tabs>
        </Card>
      </main>

      {/* Product Add / Edit Dialog with react-hook-form */}
      {(showAdd || editProduct) && (
        <ProductModal
          title={editProduct ? "Edit product" : "Add product"}
          initialData={{
            id: editProduct ? editProduct.id.toString() : "",
            name: editProduct ? editProduct.name : "",
            description: editProduct ? editProduct.description : "",
            stock: editProduct ? editProduct.stock.toString() : "1",
            price: editProduct
              ? formatUnits(editProduct.price, tokenDecimals)
              : "1",
            images: editProduct ? editProduct?.images?.join(", ") : "",
          }}
          onClose={closeProductModal}
          onSave={handleSaveProduct}
          busy={busy}
          tokenSymbol={tokenSymbol}
        />
      )}

      {/* Confirm Delete Dialog */}
      {deleteProduct && (
        <ConfirmModal
          title="Remove product?"
          body={`This will remove “${deleteProduct.name}” from your marketplace.`}
          onClose={() => setDeleteProduct(null)}
          onConfirm={remove}
          busy={busy}
        />
      )}
    </div>
  );
}
