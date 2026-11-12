"use client";

import { ConfirmModal } from "./dialogs/ConfirmModal";
import { ProductModal } from "./dialogs/ProductModal";
import { useAdminMarketplace } from "@/components/marketplace/hooks/useAdminMarketplace";
import { shorten } from "@/lib/blockchain/marketplace-format";
import { formatUnits } from "ethers";
import {
  AlertTriangle,
  ExternalLink,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Send,
  Store,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/marketplace/ui/tabs";
import { CHAIN_NAME, CONTRACT_ADDRESS, EXPLORER_BASE } from "@/lib/blockchain/contract";
import { ManageProductsTab } from "./ManageProductsTab";
import { MyProductsTab } from "./MyProductsTab";
import { SalesTab } from "./SalesTab";
import { TransferTab } from "../TransferTab";

export default function MarketplaceAdminView() {
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
    transfer,
  } = useAdminMarketplace();

  const deliveredCount = sales.filter((s) => s.status).length;
  const pendingCount = sales.filter((s) => !s.status).length;

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Overview & Action Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-toota-inner flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-2xs shrink-0">
              <Store className="size-5 text-toota-green" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Marketplace Management
                </h1>
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-600 dark:text-zinc-400">
                  Web3
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{CHAIN_NAME}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
                Decentralized Token-Powered Gym Commerce & Inventory on Ethereum Sepolia
              </p>
            </div>
          </div>

          {/* Web3 Wallet State & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {!isSepolia && account && (
              <Button
                variant="outline"
                size="sm"
                className="toota-pill h-10 px-4 text-xs font-semibold border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                onClick={switchToSepolia}
              >
                <AlertTriangle className="size-3.5 mr-1.5" />
                Switch to Sepolia
              </Button>
            )}

            {account ? (
              <div className="flex items-center gap-2.5 rounded-full border border-zinc-200/80 dark:border-zinc-800 bg-toota-inner px-4 py-2 text-xs shadow-2xs">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                  {shorten(account)}
                </span>
                <span className="border-l border-zinc-300 dark:border-zinc-700 pl-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                  {balanceLabel} <span className="text-toota-green">{tokenSymbol}</span>
                </span>
              </div>
            ) : (
              <Button
                variant="default"
                onClick={connect}
                className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm"
              >
                <Wallet className="size-4 mr-2" />
                Connect Wallet
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void refresh();
              }}
              className="toota-pill size-10 p-0 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
              title="Refresh DApp data"
            >
              <RefreshCw className="size-3.5" />
            </Button>

            <Button
              type="button"
              variant="default"
              onClick={() => setShowAdd(true)}
              className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm"
            >
              <Plus className="size-3.5 mr-1.5" />
              Add Product
            </Button>
          </div>
        </div>
      </Card>

      {/* Real Live 4-Card Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Available Balance */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              Available Balance
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <Wallet className="size-5 text-toota-green" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold tracking-tight text-toota-ink">
                {balanceLabel}{" "}
                <span className="text-lg font-medium text-toota-green">
                  {tokenSymbol}
                </span>
              </span>
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                Live
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              Connected admin wallet token balance
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Active Inventory */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              Active Inventory
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <Store className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold tracking-tight text-toota-ink">
                {products.length}
              </span>
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-500 dark:text-zinc-400">
                Products
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              Items published on Sepolia smart contract
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Total Orders */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              Recorded Orders
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <Package className="size-5 text-toota-green" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold tracking-tight text-toota-ink">
                {sales.length}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{deliveredCount} Fulfilled</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {pendingCount} pending fulfillment
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Smart Contract */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              GymToken Contract
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <Layers className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-sm font-semibold tracking-tight text-toota-ink">
                {shorten(CONTRACT_ADDRESS)}
              </span>
              <a
                href={`${EXPLORER_BASE}/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-toota-muted hover:text-toota-green transition-colors"
              >
                <span>Explorer</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              Verified ERC20 + GymMarketplace on {CHAIN_NAME}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Card */}
      <Card className="toota-card border-none p-0 overflow-hidden">
        <Tabs
          value={tab}
          onValueChange={(val) =>
            setTab(val as "MyProducts" | "sales" | "manage" | "transfer")
          }
          className="w-full"
        >
          <div className="border-b border-zinc-200/80 dark:border-zinc-800 px-6 py-4">
            <TabsList className="h-auto max-w-full flex-wrap">
              <TabsTrigger value="MyProducts">
                <Store className="size-3.5" />
                <span>Store Catalog</span>
              </TabsTrigger>
              <TabsTrigger value="sales">
                <Package className="size-3.5" />
                <span>Sales & Orders ({sales.length})</span>
              </TabsTrigger>
              <TabsTrigger value="manage">
                <Plus className="size-3.5" />
                <span>Manage Inventory</span>
              </TabsTrigger>
              <TabsTrigger value="transfer">
                <Send className="size-3.5" />
                <span>Send G Tokens</span>
              </TabsTrigger>
            </TabsList>
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
          <TransferTab
            transfer={transfer}
            tokenSymbol={tokenSymbol}
            balanceLabel={balanceLabel}
            account={account}
            isSepolia={isSepolia}
          />
        </Tabs>
      </Card>

      {/* Product Add / Edit Dialog */}
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
          title="Remove product from smart contract?"
          body={`This will permanently remove “${deleteProduct.name}” from the on-chain marketplace inventory.`}
          onClose={() => setDeleteProduct(null)}
          onConfirm={remove}
          busy={busy}
        />
      )}
    </div>
  );
}
