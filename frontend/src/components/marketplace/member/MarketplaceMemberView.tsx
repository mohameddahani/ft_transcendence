"use client";

import { PurchaseDialog } from "./dialogs/PurchaseDialog";
import { useMemberMarketplace } from "@/components/marketplace/hooks/useMemberMarketplace";
import { shorten } from "@/lib/blockchain/marketplace-format";
import {
  AlertTriangle,
  CreditCard,
  RefreshCw,
  ShoppingBag,
  Store,
  Wallet,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/marketplace/ui/badge";
import { Button } from "@/components/marketplace/ui/button";
import { Card, CardContent, CardHeader } from "@/components/marketplace/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/marketplace/ui/tabs";
import { CHAIN_NAME, CONTRACT_ADDRESS, GASLESS_ENABLED } from "@/lib/blockchain/contract";
import { MarketplaceTab } from "./MarketplaceTab";
import { PurchasesTab } from "./PurchasesTab";
import { SubscriptionTab } from "./SubscriptionTab";

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
    subOwner,
    subscribing,
    setSelectedPlanIndex,
    setSelectedDurationIndex,
    activePlans,
    planItems,
    selectedPlan,
    durationItems,
    selectedDuration,
    confirmBuyProduct,
    setConfirmBuyProduct,
    refresh,
    connect,
    switchToSepolia,
    buy,
    handlePaySubscription,
    isSepolia,
    balanceLabel,
  } = useMemberMarketplace();

  return (
    <div className="space-y-8 max-w-container-max mx-auto pb-10">
      {/* Top Banner / Actions Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
            <ShoppingBag className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-2xl font-bold text-on-surface">
                Member Web3 Store
              </h1>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Decentralized
              </Badge>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Decentralized Member Store & Token Commerce Hub
            </p>
          </div>
        </div>

        {/* Web3 Wallet State & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
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
            <div className="flex items-center gap-2.5 rounded-full border border-outline-variant bg-surface-container-low px-3.5 py-1.5 text-xs shadow-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-on-surface-variant">
                {shorten(account)}
              </span>
              <span className="border-l border-outline-variant pl-2.5 font-bold text-primary">
                {balanceLabel} {tokenSymbol}
              </span>
            </div>
          ) : (
            <Button variant="default" size="default" onClick={connect}>
              <Wallet className="size-4 mr-1.5" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      {/* Hero & Stats Section */}
      <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary w-fit">
            <Sparkles className="size-3.5" />
            <span>On-Chain Member Platform</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface font-headline">
            Order from your Gym using <span className="text-primary">{tokenSymbol} tokens</span>.
          </h2>

          <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
            Buy supplements, gym apparel, pay memberships, and track all your verified blockchain
            purchases with <span className="font-semibold text-primary">{tokenSymbol} tokens</span> directly
            on Sepolia with zero Ethereum gas fees.
          </p>
        </div>

        {/* Balance & Contract Card */}
        <Card className="border-outline-variant bg-surface-container-lowest shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                GymToken Contract
              </span>
              <Badge variant="outline" className="font-mono text-[11px]">
                {shorten(CONTRACT_ADDRESS)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-on-surface">
                <span className="text-primary">{balanceLabel}</span>{" "}
                <span className="text-xl font-semibold text-primary">
                  {tokenSymbol}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Available token balance in your connected wallet
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                <span className="text-[11px] font-medium text-on-surface-variant block mb-0.5">
                  Network
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {CHAIN_NAME}
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                <span className="text-[11px] font-medium text-on-surface-variant block mb-0.5">
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

      {/* Dashboard Card with Tabs */}
      <Card className="border-outline-variant bg-surface-container-lowest shadow-sm rounded-2xl overflow-hidden">
        <Tabs
          value={tab}
          onValueChange={(val) =>
            setTab(val as "shop" | "purchases" | "subscription")
          }
          className="w-full"
        >
          <div className="flex flex-wrap items-center justify-between border-b border-outline-variant px-5 py-3.5 gap-3">
            <TabsList className="bg-surface-container-low p-1 rounded-xl">
              <TabsTrigger value="shop" className="gap-2">
                <Store className="size-4" />
                <span>Marketplace</span>
              </TabsTrigger>
              <TabsTrigger value="purchases" className="gap-2">
                <ShoppingBag className="size-4" />
                <span>My Purchases</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="gap-2">
                <CreditCard className="size-4" />
                <span>Pay Subscription</span>
              </TabsTrigger>
            </TabsList>

            <Button
              variant="outline"
              size="icon"
              title="Refresh DApp data"
              disabled={isRefreshing}
              onClick={() => void refresh()}
              className="rounded-xl"
            >
              <RefreshCw
                className={`size-4 ${isRefreshing ? "animate-spin text-primary" : ""}`}
              />
            </Button>
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
          <SubscriptionTab
            tokenSymbol={tokenSymbol}
            subOwner={subOwner}
            planItems={planItems}
            setSelectedPlanIndex={setSelectedPlanIndex}
            setSelectedDurationIndex={setSelectedDurationIndex}
            activePlans={activePlans}
            durationItems={durationItems}
            selectedPlan={selectedPlan}
            selectedDuration={selectedDuration}
            subscribing={subscribing}
            account={account}
            handlePaySubscription={handlePaySubscription}
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
