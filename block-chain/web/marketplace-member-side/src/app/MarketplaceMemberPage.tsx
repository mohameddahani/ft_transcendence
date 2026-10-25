"use client";
import { PurchaseDialog } from "@/components/marketplace/dialogs/PurchaseDialog";
import { useMemberMarketplace } from "@/hooks/useMemberMarketplace";
import { shorten } from "@/lib/marketplace-format";

import {
  AlertTriangle,
  CreditCard,
  RefreshCw,
  ShoppingBag,
  Store,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CHAIN_NAME, CONTRACT_ADDRESS, GASLESS_ENABLED } from "@/app/contract";
import { MarketplaceTab } from "@/components/marketplace/MarketplaceTab";
import { PurchasesTab } from "@/components/marketplace/PurchasesTab";
import { SubscriptionTab } from "@/components/marketplace/SubscriptionTab";

export default function MarketplaceMemberPage() {
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
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Ambients */}
      <div className="ambient ambient-one pointer-events-none fixed inset-0 opacity-40" />
      <div className="ambient ambient-two pointer-events-none fixed inset-0 opacity-30" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-xl text-primary">
                  GymClient
                </span>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  Web3 Store
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Decentralized Member & Commerce Hub
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
              On-Chain Member Platform
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              Order from your Gym using{" "}
              <span className="text-primary">G taken </span> .
            </h1>

            <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Buy supplements, gym apparel, pay memberships, and track all your
              verified blockchain purchases with{" "}
              <span className="font-semibold text-primary">
                {tokenSymbol} tokens
              </span>{" "}
              directly on Sepolia.
            </p>
          </div>

          {/* Balance & Contract Card */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  GymToken Contract
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
                  Available token balance in your wallet
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

        {/* Dashboard Card with Tabs */}
        <Card className="border-border bg-card shadow-xs">
          <Tabs
            value={tab}
            onValueChange={(val) =>
              setTab(val as "shop" | "purchases" | "subscription")
            }
            className="w-full"
          >
            <div className="flex flex-wrap items-center justify-between border-b border-border px-4 py-3 gap-3">
              <TabsList className="bg-muted/60 p-1">
                <TabsTrigger value="shop" className="gap-2">
                  <Store className="size-4" />
                  <span>Marketplace</span>
                </TabsTrigger>
                <TabsTrigger value="purchases" className="gap-2">
                  <ShoppingBag className="size-4" />
                  <span>My purchases</span>
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
                className="rounded-lg"
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
      </main>

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
