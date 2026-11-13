"use client";

import { PurchaseDialog } from "./dialogs/PurchaseDialog";
import { useMemberMarketplace } from "@/components/marketplace/hooks/useMemberMarketplace";
import { shorten } from "@/lib/blockchain/marketplace-format";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ExternalLink,
  Layers,
  RefreshCw,
  Send,
  ShoppingBag,
  Store,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/marketplace/ui/tabs";
import { CHAIN_NAME, CONTRACT_ADDRESS, EXPLORER_BASE, GASLESS_ENABLED } from "@/lib/blockchain/contract";
import { MarketplaceTab } from "./MarketplaceTab";
import { PurchasesTab } from "./PurchasesTab";
import { TransferTab } from "../TransferTab";

export default function MarketplaceMemberView() {
  const {
    account,
    tokenDecimals,
    tokenSymbol,
    marketAddress,
    setMarketAddress,
    products,
    purchases,
    tab,
    setTab,
    isRefreshing,
    buyingId,
    transfer,
    confirmBuyProduct,
    setConfirmBuyProduct,
    refresh,
    connect,
    switchToSepolia,
    buy,
    isSepolia,
    balanceLabel,
  } = useMemberMarketplace();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-7 max-w-[1440px] mx-auto pb-12">
      {/* Overview & Action Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-toota-inner flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-2xs shrink-0">
              <ShoppingBag className="size-5 text-toota-green" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {t("memberWeb3Store") || "Member Web3 Store"}
                </h1>
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {t("decentralized") || "Decentralized"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{CHAIN_NAME}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-toota-muted mt-1 font-normal">
                {t("memberWeb3StoreSubtitle") || "Purchase merchandise, supplements and apparel with zero ETH gas fees using GymTokens"}
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
                <AlertTriangle className="size-3.5 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
                {t("switchToSepolia") || "Switch to Sepolia"}
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
                <Wallet className="size-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {t("connectWallet") || "Connect Wallet"}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              disabled={isRefreshing}
              onClick={() => {
                void refresh();
              }}
              className="toota-pill size-10 p-0 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
              title={t("refreshDappData") || "Refresh DApp data"}
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-toota-green" : ""}`} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Real Live 4-Card Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Token Balance */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("myTokenBalance") || "My Token Balance"}
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
                {t("liveStatus") || "Live"}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("readyForCheckout") || "Ready for instant checkout"}
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Available Products */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("storeCatalogue") || "Store Catalogue"}
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
                {t("productsLabel") || "Products"}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("availableFromMerchant") || "Available from current gym merchant"}
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: My Orders */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("myPurchases") || "My Purchases"}
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <ShoppingBag className="size-5 text-toota-green" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold tracking-tight text-toota-ink">
                {purchases.length}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t("onChain") || "On-Chain"}</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("verifiedOrdersOnChain") || "Verified orders on Ethereum Sepolia"}
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Smart Contract */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("gymTokenContract") || "GymToken Contract"}
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
                <span>{t("explorer") || "Explorer"}</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              {t("gaslessForwarder") || "Gasless forwarder"}: {GASLESS_ENABLED ? (t("active") || "Active") : (t("disabled") || "Disabled")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Card */}
      <Card className="toota-card border-none p-0 overflow-hidden">
        <Tabs
          value={tab}
          onValueChange={(val) =>
            setTab(val as "shop" | "purchases" | "transfer")
          }
          className="w-full"
        >
          <div className="border-b border-zinc-200/80 dark:border-zinc-800 px-6 py-4">
            <TabsList className="h-auto max-w-full flex-wrap">
              <TabsTrigger value="shop">
                <Store className="size-3.5" />
                <span>{t("marketplaceCatalog") || "Marketplace Catalog"}</span>
              </TabsTrigger>
              <TabsTrigger value="purchases">
                <ShoppingBag className="size-3.5" />
                <span>{t("myPurchases") || "My Purchases"} ({purchases.length})</span>
              </TabsTrigger>
              <TabsTrigger value="transfer">
                <Send className="size-3.5" />
                <span>{t("sendGTokens") || "Send G Tokens"}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <MarketplaceTab
            products={products}
            tokenSymbol={tokenSymbol}
            GASLESS_ENABLED={GASLESS_ENABLED}
            marketAddress={marketAddress}
            setMarketAddress={setMarketAddress}
            refresh={refresh}
            isRefreshing={isRefreshing}
            tokenDecimals={tokenDecimals}
            buyingId={buyingId}
            setConfirmBuyProduct={setConfirmBuyProduct}
            account={account}
          />
          <PurchasesTab
            purchases={purchases}
            tokenDecimals={tokenDecimals}
            tokenSymbol={tokenSymbol}
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

      {/* Confirmation Dialog */}
      {confirmBuyProduct && (
        <PurchaseDialog
          confirmBuyProduct={confirmBuyProduct}
          setConfirmBuyProduct={setConfirmBuyProduct}
          tokenDecimals={tokenDecimals}
          tokenSymbol={tokenSymbol}
          buyingId={buyingId}
          buy={buy}
        />
      )}
    </div>
  );
}
