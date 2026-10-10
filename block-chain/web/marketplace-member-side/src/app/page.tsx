"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  BrowserProvider,
  Contract,
  JsonRpcSigner,
  formatUnits,
  parseUnits,
} from "ethers";
import {
  AlertTriangle,
  CreditCard,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Wallet,
} from "lucide-react";

import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  CHAIN_ID,
  CHAIN_NAME,
  CONTRACT_ADDRESS,
  EXPLORER_BASE,
  GASLESS_ENABLED,
  GYMTOKEN_ABI,
} from "./contract";
import { relayForwarderMethod } from "@/lib/gasless";

export type Product = {
  id: bigint;
  name: string;
  description: string;
  stock: bigint;
  price: bigint;
  images: string[];
  merchant: string;
};

export type Purchase = {
  id: bigint;
  productName: string;
  gymOwner: string;
  quantity: bigint;
  time: bigint;
  totalPrice: bigint;
};

type RawProductItem = {
  id: bigint;
  product: {
    name: string;
    description: string;
    stok: bigint;
    price: bigint;
    productImage: string[];
  };
};

type RawPurchaseItem = {
  id: bigint;
  productName: string;
  gymOwner: string;
  quantity: bigint;
  time: bigint;
  totalPrice: bigint;
};

const shorten = (value: string) =>
  value && value.length > 10
    ? `${value.slice(0, 6)}…${value.slice(-4)}`
    : value;

const dateFromTs = (ts: bigint) =>
  new Date(Number(ts) * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ClientPlatformPage() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);

  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenSymbol, setTokenSymbol] = useState("G");

  const [marketAddress, setMarketAddress] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [tab, setTab] = useState<"shop" | "purchases" | "subscription">("shop");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [buyingId, setBuyingId] = useState<bigint | null>(null);

  // Subscription state
  const [subOwner, setSubOwner] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  // Quick buy confirmation dialog
  const [confirmBuyProduct, setConfirmBuyProduct] = useState<{
    product: Product;
    quantity: bigint;
  } | null>(null);

  const readContract = useMemo(
    () =>
      provider ? new Contract(CONTRACT_ADDRESS, GYMTOKEN_ABI, provider) : null,
    [provider],
  );

  const refresh = useCallback(async () => {
    if (!readContract || !account) return;
    setIsRefreshing(true);
    try {
      const [balance, decimals, symbol] = await Promise.all([
        readContract.balanceOf(account),
        readContract.decimals(),
        readContract.symbol(),
      ]);
      setTokenBalance(balance);
      setTokenDecimals(Number(decimals));
      setTokenSymbol(symbol);

      const merchant = marketAddress.trim() || account; // we will add the address of the gymowner that saved in the clinet info
      if (merchant && merchant.startsWith("0x") && merchant.length === 42) {
        try {
          const rawProducts = await readContract.getMerchantProducts(merchant);
          setProducts(
            rawProducts.map((p: RawProductItem) => ({
              id: p.id,
              name: p.product.name,
              description: p.product.description,
              stock: p.product.stok,
              price: p.product.price,
              images: p.product.productImage,
              merchant,
            })),
          );
        } catch {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }

      try {
        const rawPurchases = await readContract.getPurchases({ from: account });
        setPurchases(
          rawPurchases.map((p: RawPurchaseItem) => ({
            id: p.id,
            productName: p.productName,
            gymOwner: p.gymOwner,
            quantity: p.quantity,
            time: p.time,
            totalPrice: p.totalPrice,
          })),
        );
      } catch (err) {
        console.error("Failed to load purchases", err);
      }
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setIsRefreshing(false);
    }
  }, [account, marketAddress, readContract]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const eth = window.ethereum;

    const initialize = async () => {
      try {
        const p = new BrowserProvider(eth);
        setProvider(p);
        const accounts = (await eth.request({
          method: "eth_accounts",
        })) as string[];
        if (accounts.length) {
          const s = await p.getSigner();
          setSigner(s);
          setAccount(accounts[0]);
        }
        const currentChain = (await eth.request({
          method: "eth_chainId",
        })) as string;
        setChainId(Number.parseInt(currentChain, 16));
      } catch (err) {
        console.error("Init web3 error:", err);
      }
    };
    void initialize();

    const handleAccountsChanged = async (accounts: string[]) => {
      if (!accounts.length) {
        setAccount("");
        setSigner(null);
        return;
      }
      const p = new BrowserProvider(eth);
      setProvider(p);
      setSigner(await p.getSigner());
      setAccount(accounts[0]);
    };

    const handleChainChanged = (hex: string) => {
      setChainId(Number.parseInt(hex, 16));
    };

    eth.on?.("accountsChanged", handleAccountsChanged);
    eth.on?.("chainChanged", handleChainChanged);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
      eth.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("Please install MetaMask or a compatible Web3 wallet.");
      return;
    }
    try {
      const p = provider ?? new BrowserProvider(window.ethereum);
      const accounts = await p.send("eth_requestAccounts", []);
      const s = await p.getSigner();
      setProvider(p);
      setSigner(s);
      setAccount(accounts[0]);
      const network = await p.getNetwork();
      setChainId(Number(network.chainId));
      toast.success("Wallet connected successfully!");
    } catch (error) {
      toast.error(parseError(error));
    }
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
      toast.success("Switched to Sepolia network.");
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia",
                nativeCurrency: {
                  name: "Sepolia Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.infura.io/v3/"],
                blockExplorerUrls: [EXPLORER_BASE],
              },
            ],
          });
          toast.success("Sepolia network added and selected.");
        } catch (addError) {
          toast.error(parseError(addError));
        }
      } else {
        toast.error(parseError(error));
      }
    }
  };

  const buy = async (product: Product, quantity: bigint) => {
    if (!provider || !signer || !readContract || !account) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!GASLESS_ENABLED) {
      toast.error("Gasless purchases require the new GymToken address.");
      return;
    }
    if (chainId !== CHAIN_ID) {
      toast.error("Switch your wallet to Sepolia first.");
      return;
    }
    if (quantity <= 0n) {
      toast.error("Please specify a valid quantity greater than 0.");
      return;
    }
    if (quantity > product.stock) {
      toast.error(
        `Only ${product.stock.toString()} units currently available.`,
      );
      return;
    }

    const total = product.price * quantity;
    if (tokenBalance < total) {
      toast.error(
        `Insufficient ${tokenSymbol} balance. You need ${formatUnits(total, tokenDecimals)} ${tokenSymbol}.`,
      );
      return;
    }

    setBuyingId(product.id);
    try {
      await relayForwarderMethod(provider, signer, "buyProduct", [product.merchant, product.id, quantity, total]);
      toast.success(
        `Successfully purchased ${quantity.toString()}x ${product.name}!`,
      );
      setConfirmBuyProduct(null);
      await refresh();
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setBuyingId(null);
    }
  };

  const handlePaySubscription = async (_subOwner: any, _subAmount: any) => {
    if (!provider || !signer || !account) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!GASLESS_ENABLED) {
      toast.error("Gasless purchases require the new GymToken address.");
      return;
    }
    if (chainId !== CHAIN_ID) {
      toast.error("Switch your wallet to Sepolia first.");
      return;
    }
    
    // ckeck the _subamount and _subowner
    
    setSubscribing(true);
    try {
      await relayForwarderMethod(provider, signer, "paySubscription", [subOwner, subAmount]);
      toast.success(
        `Successfully subscription to ${subOwner.toString()} (${subAmount.toString()})`,
      );
      await refresh();
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setSubscribing(false);
    }
  };

  const isSepolia = chainId === CHAIN_ID;
  const balanceLabel = formatUnits(tokenBalance, tokenDecimals);

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

            {/* TAB 1: Marketplace */}
            <TabsContent value="shop" className="p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Marketplace Catalog
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Explore any gym merchant&apos;s on-chain inventory and
                    purchase with {tokenSymbol} tokens.
                  </p>
                  {!GASLESS_ENABLED && (
                    <p className="mt-1 text-xs text-amber-500">
                      Gasless checkout needs your new Remix deployment address.
                    </p>
                  )}
                </div>

                {/* Merchant input */}
                <div className="flex items-center gap-2 max-w-md w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Merchant address (0x...)"
                      value={marketAddress}
                      onChange={(e) => setMarketAddress(e.target.value)}
                      className="pl-9 text-xs font-mono"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void refresh()}
                    disabled={isRefreshing}
                  >
                    Load
                  </Button>
                </div>
              </div>

              {products.length ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard
                      key={`${product.merchant}-${product.id.toString()}`}
                      product={product}
                      decimals={tokenDecimals}
                      symbol={tokenSymbol}
                      busy={buyingId !== null}
                      gaslessEnabled={GASLESS_ENABLED}
                      onBuy={(item, qty) => setConfirmBuyProduct({ product: item, quantity: qty })}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Package className="size-8 text-muted-foreground" />}
                  title="No products found"
                  body={
                    marketAddress.trim()
                      ? `No products registered on-chain for merchant ${shorten(marketAddress.trim())}. Try another address.`
                      : account
                        ? "Enter a gym merchant address above to view their inventory."
                        : "Connect your Web3 wallet or enter a merchant address to explore available products."
                  }
                />
              )}
            </TabsContent>

            {/* TAB 2: Purchases */}
            <TabsContent value="purchases" className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Purchase History
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Immutable purchase receipts recorded by the GymToken smart
                    contract.
                  </p>
                </div>
                <Badge variant="secondary" className="font-mono">
                  {purchases.length}{" "}
                  {purchases.length === 1 ? "order" : "orders"}
                </Badge>
              </div>

              {purchases.length ? (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[80px]">#</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Gym Owner / Merchant</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">
                          Total Price
                        </TableHead>
                        <TableHead className="text-right">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((item) => (
                        <TableRow key={item.id.toString()}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            #{item.id.toString()}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {item.productName}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-muted-foreground">
                              {shorten(item.gymOwner)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {item.quantity.toString()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {formatUnits(item.totalPrice, tokenDecimals)}{" "}
                            <span className="text-xs">{tokenSymbol}</span>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground font-mono">
                            {dateFromTs(item.time)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState
                  icon={
                    <ShoppingBag className="size-8 text-muted-foreground" />
                  }
                  title="No purchases yet"
                  body="Your completed purchases with G tokens will be permanently tracked here."
                />
              )}
            </TabsContent>

            {/* TAB 3: Subscription */}
            <TabsContent value="subscription" className="p-6">
              <div className="mx-auto max-w-xl py-4">
                <Card className="border-border bg-muted/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CreditCard className="size-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Pay Gym Subscription
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Transfer {tokenSymbol} tokens to your gym owner to
                          activate or renew membership.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Gym Owner Address
                      </label>
                      <Input
                        placeholder="0x..." //add there the oym owner addres of the clinet
                        readOnly
                        className="font-mono text-xs"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        The registered Ethereum address of your gym or fitness
                        club.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Selecte Subscription
                      </label>
                      <NativeSelect>
                        <NativeSelectOption value="">
                          Select status
                        </NativeSelectOption>
                      </NativeSelect>
                      <p className="text-[11px] text-muted-foreground">
                        The registered Ethereum address of your gym or fitness
                        club.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Payment Amount ({tokenSymbol})
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="e.g. 50"
                        readOnly
                        value={subAmount}
                        className="text-sm font-semibold"
                      />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span>Your balance:</span>
                        <span className="font-semibold text-primary">
                          {balanceLabel} {tokenSymbol}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="default"
                      className="w-full mt-2"
                      disabled={subscribing || !account}
                      onClick={() => {handlePaySubscription(subOwner, subAmount)}}
                    >
                      {subscribing ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-2" />
                          Confirming Subscription…
                        </>
                      ) : (
                        <>
                          <CreditCard className="size-4 mr-2" />
                          Pay Subscription Now
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      {/* Confirmation Dialog */}
      {confirmBuyProduct && (
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
                    confirmBuyProduct.product.price *
                      confirmBuyProduct.quantity,
                    tokenDecimals,
                  )}{" "}
                  {tokenSymbol}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmBuyProduct(null)}
              >
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
      )}
    </div>
  );
}

function ProductCard({
  product,
  decimals,
  symbol,
  busy,
  gaslessEnabled,
  onBuy,
}: {
  product: Product;
  decimals: number;
  symbol: string;
  busy: boolean;
  gaslessEnabled: boolean;
  onBuy: (product: Product, quantity: bigint) => void;
}) {
  const [quantity, setQuantity] = useState("1");
  const price = formatUnits(product.price, decimals);

  const total = (() => {
    try {
      const q = BigInt(quantity || "0");
      return formatUnits(product.price * q, decimals);
    } catch {
      return "0";
    }
  })();

  const isValidQty = (() => {
    try {
      const q = BigInt(quantity || "0");
      return q > 0n && q <= product.stock;
    } catch {
      return false;
    }
  })();

  return (
    <Card className="flex flex-col overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      {/* Product Image */}
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-muted/50">
        {product.images && product.images.length > 0 && product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
            <ShoppingBag className="size-10" />
            <span className="text-[10px]">No image provided</span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge
            variant="outline"
            className="bg-background/80 font-mono text-[10px] backdrop-blur-xs"
          >
            #{product.id.toString()}
          </Badge>
        </div>

        <div className="absolute top-3 right-3">
          {product.stock > 0n ? (
            <Badge variant="success" className="text-[10px]">
              {product.stock.toString()} in stock
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px]">
              Out of stock
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-bold tracking-tight line-clamp-1">
          {product.name}
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
          {product.description || "No description provided."}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1 space-y-3">
        <div className="flex items-baseline justify-between border-t border-border/60 pt-3">
          <div>
            <span className="text-[10px] uppercase font-medium text-muted-foreground block">
              Price
            </span>
            <div className="text-lg font-extrabold text-foreground">
              {price}{" "}
              <span className="text-xs font-semibold text-primary">
                {symbol}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-medium text-muted-foreground block">
              Total
            </span>
            <div className="text-sm font-bold text-primary">
              {total} {symbol}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className="w-24 shrink-0">
            <Input
              type="number"
              min="1"
              max={product.stock.toString()}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={busy || product.stock === 0n}
              className="h-9 text-center font-semibold text-xs"
            />
          </div>
          <Button
            variant="default"
            size="default"
            className="flex-1 text-xs font-semibold"
            disabled={busy || !gaslessEnabled || product.stock === 0n || !isValidQty}
            onClick={() => onBuy(product, BigInt(quantity || "1"))}
          >
            {busy ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Purchasing…
              </>
            ) : !gaslessEnabled ? (
              "Gasless unavailable"
            ) : product.stock === 0n ? (
              "Sold Out"
            ) : (
              <>
                <ShoppingBag className="size-3.5 mr-1.5" />
                Buy with {symbol} (no ETH)
              </>
            )}
          </Button>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/40 p-4 py-2.5 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Merchant:</span>
        <span
          className="font-mono hover:text-foreground transition-colors"
          title={product.merchant}
        >
          {shorten(product.merchant)}
        </span>
      </CardFooter>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 px-4 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted/60">
        {icon}
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function parseError(error: unknown) {
  const err = error as {
    shortMessage?: string;
    reason?: string;
    message?: string;
  };
  const raw =
    err?.shortMessage || err?.reason || err?.message || "Transaction failed.";

  if (String(raw).includes("Price is not correct"))
    return "Insufficient GymToken (G) balance for this transaction.";
  if (String(raw).includes("Product Not Found"))
    return "Product was not found for this merchant.";
  if (String(raw).includes("insufficient funds"))
    return "Not enough Sepolia ETH to cover gas fees.";
  if (
    String(raw).includes("user rejected") ||
    String(raw).includes("ACTION_REJECTED")
  )
    return "Transaction was cancelled in wallet.";

  return String(raw)
    .replace(/^execution reverted:\s*/i, "")
    .split("\n")[0];
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}