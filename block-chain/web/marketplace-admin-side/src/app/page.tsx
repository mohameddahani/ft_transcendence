"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import {
  BrowserProvider,
  Contract,
  JsonRpcSigner,
  formatUnits,
  parseUnits,
} from "ethers";
import {
  Activity,
  AlertTriangle,
  Dumbbell,
  Globe,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Store,
  Trash2,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  GYMTOKEN_ABI,
} from "./contract";
import { relayForwarderMethod } from "@/lib/gasless";

type Product = {
  id: bigint;
  name: string;
  description: string;
  stock: bigint;
  price: bigint;
  images: string[];
  merchant: string;
};

type Sale = {
  id: bigint;
  productName: string;
  client: string;
  quantity: bigint;
  time: bigint;
  totalPrice: bigint;
  status: boolean;
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

type RawSaleItem = {
  id: bigint;
  productName: string;
  client: string;
  quantity: bigint;
  time: bigint;
  totalPrice: bigint;
  status: boolean;
};

type ProductFormData = {
  id: string;
  name: string;
  description: string;
  stock: string;
  price: string;
  images: string;
};

const shorten = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;

export default function GymOwnerConnectionToGymToken() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);

  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenSymbol, setTokenSymbol] = useState("G");

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [tab, setTab] = useState<"MyProducts" | "sales" | "manage">(
    "MyProducts",
  );
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const readContract = useMemo(
    () =>
      provider ? new Contract(CONTRACT_ADDRESS, GYMTOKEN_ABI, provider) : null,
    [provider],
  );

  const refresh = useCallback(async () => {
    if (!readContract || !account) return;

    try {
      const [balance, decimals, symbol] = await Promise.all([
        readContract.balanceOf(account),
        readContract.decimals(),
        readContract.symbol(),
        readContract.owner(),
      ]);

      setTokenBalance(balance);
      setTokenDecimals(Number(decimals));
      setTokenSymbol(symbol);

      const merchant = account;

      if (merchant) {
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
      }

      const rawSales = await readContract.getsales({ from: account });

      setSales(
        rawSales.map((s: RawSaleItem) => ({
          id: s.id,
          productName: s.productName,
          client: s.client,
          quantity: s.quantity,
          time: s.time,
          totalPrice: s.totalPrice,
          status: s.status,
        })),
      );
    } catch (error) {
      toast.error(parseError(error));
    }
  }, [account, readContract]);

  useEffect(() => {
    if (!window.ethereum) return;

    const eth = window.ethereum;

    const initialize = async () => {
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
    if (!window.ethereum) {
      toast.error("Install MetaMask to connect this DApp.");
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
      } else {
        toast.error(parseError(error));
      }
    }
  };

const gaslessCall = async (
  fn: () => Promise<string>,
  successText: string
) => {
  setBusy(true)

  try {
    const hash = await fn()

    console.log("Relayed transaction:", hash)

    toast.success(successText)

    await refresh()
  } catch (error) {
    toast.error(parseError(error))
  } finally {
    setBusy(false)
  }
}

  const handleSaveProduct = async (data: ProductFormData) => {
    if (!provider || !signer || !account) {
      toast.error("Connect your wallet first.");
      return;
    }

    const images = data.images
      .split(",")
      .map((v: string) => v.trim())
      .filter(Boolean);

    try {
      const id = BigInt(data.id);
      const stock = BigInt(data.stock);
      const price = parseUnits(data.price || "0", tokenDecimals);

      if (editProduct) {
        await gaslessCall(
          () =>
            relayForwarderMethod(provider, signer, "editProduct", [
              id,
              data.name,
              data.description,
              stock,
              price,
              images,
            ]),
          "Product updated successfully.",
        );
      } else {
        await gaslessCall(
          () =>
            relayForwarderMethod(provider, signer, "addProduct", [
              id,
              data.name,
              data.description,
              stock,
              price,
              images,
            ]),
          "Product added successfully.",
        );
      }
      closeProductModal();
    } catch (error) {
      toast.error(parseError(error));
    }
  };

  const closeProductModal = () => {
    setShowAdd(false);
    setEditProduct(null);
  };

  const remove = async () => {
    if (!provider || !signer || !readContract || !deleteProduct || !account)
      return;

    await gaslessCall(
      () =>
        relayForwarderMethod(provider, signer, "removeProduct", [
          deleteProduct.id,
        ]),
      "Product removed successfully.",
    );
    setDeleteProduct(null);
  };

  const markDelivered = async (id: bigint) => {
    if (!provider || !signer || !account) {
      toast.error("Connect your wallet first.");
      return;
    }

    await gaslessCall(
      () => relayForwarderMethod(provider, signer, "changeStatus", [id]),
      "Sale marked as delivered.",
    );
  };

  const isSepolia = chainId === CHAIN_ID;
  const merchantMode = account;
  const balanceLabel = formatUnits(tokenBalance, tokenDecimals);

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

            {/* TAB 1: My Products */}
            <TabsContent value="MyProducts" className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Store Catalog
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Read your active inventory directly on the blockchain.
                  </p>
                </div>
                <Badge variant="secondary">
                  {products.length} {products.length === 1 ? "Item" : "Items"}
                </Badge>
              </div>

              {products.length ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard
                      key={`${product.merchant}-${product.id.toString()}`}
                      product={product}
                      decimals={tokenDecimals}
                      symbol={tokenSymbol}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No products found"
                  body={
                    merchantMode
                      ? `No products are registered for ${shorten(merchantMode)}.`
                      : "Connect a wallet or add products in the Manage tab."
                  }
                />
              )}
            </TabsContent>

            {/* TAB 2: Sales */}
            <TabsContent value="sales" className="p-6">
              <SalesTable
                items={sales}
                decimals={tokenDecimals}
                symbol={tokenSymbol}
                onDeliver={markDelivered}
                busy={busy}
              />
            </TabsContent>

            {/* TAB 3: Manage Products */}
            <TabsContent value="manage" className="p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Merchant Tools
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your marketplace products are keyed by your connected wallet
                    address.
                  </p>
                </div>

                <Button variant="default" onClick={() => setShowAdd(true)}>
                  <Plus className="size-4 mr-1.5" />
                  Add product
                </Button>
              </div>

              <div className="border-t border-border pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Your Products
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {products.length} items total
                  </span>
                </div>

                {products.length ? (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div
                        key={product.id.toString()}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                            {product &&
                            JSON.stringify(product?.images) != "[]" &&
                            product.images?.[0] ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                className="h-full w-full object-cover"
                                src={product.images[0]}
                                alt={product.name}
                              />
                            ) : (
                              <Package className="size-5" />
                            )}
                          </div>

                          <div>
                            <strong className="block text-sm font-medium text-foreground">
                              {product.name}
                            </strong>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                              >
                                ID #{product.id.toString()}
                              </Badge>
                              <span>·</span>
                              <span>{product.stock.toString()} in stock</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-sm font-bold text-primary">
                              {formatUnits(product.price, tokenDecimals)}{" "}
                              {tokenSymbol}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditProduct(product);
                              }}
                            >
                              Edit
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteProduct(product)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Your inventory is empty"
                    body="Add your first product to make it available on-chain."
                    compact
                  />
                )}
              </div>
            </TabsContent>
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

function ProductCard({
  product,
  decimals,
  symbol,
}: {
  product: Product;
  decimals: number;
  symbol: string;
}) {
  const price = formatUnits(product.price, decimals);

  return (
    <Card className="group overflow-hidden border-border bg-card transition-all hover:border-primary/40 hover:shadow-xs">
      <div className="relative aspect-video w-full overflow-hidden bg-muted/60">
        {product &&
        JSON.stringify(product?.images) != "[]" &&
        product.images?.[0] ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={product.images[0]}
            alt={product.name}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
            <ShoppingBag className="size-8 opacity-60" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="backdrop-blur-xs font-mono text-[11px]"
          >
            #{product.id.toString()}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="success" className="backdrop-blur-xs text-[11px]">
            {product.stock.toString()} available
          </Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold">
          {product.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 min-h-10 text-xs">
          {product.description || "No description provided."}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-primary">{price}</span>
          <span className="text-xs font-semibold text-primary">{symbol}</span>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/60 p-3 px-4 text-[11px] text-muted-foreground font-mono">
        My addr: {shorten(product.merchant)}
      </CardFooter>
    </Card>
  );
}

function SalesTable({
  items,
  decimals,
  symbol,
  onDeliver,
  busy,
}: {
  items: Sale[];
  decimals: number;
  symbol: string;
  onDeliver: (id: bigint) => Promise<void>;
  busy: boolean;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Sales & Orders
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage orders from customers who purchased your products.
          </p>
        </div>
        <Badge variant="secondary">
          {items.length} {items.length === 1 ? "Order" : "Orders"}
        </Badge>
      </div>

      {items.length ? (
        <Card className="overflow-hidden border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id.toString()}>
                  <TableCell className="font-semibold text-foreground">
                    {item.productName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {shorten(item.client)}
                  </TableCell>
                  <TableCell>{item.quantity.toString()}</TableCell>
                  <TableCell className="font-bold text-primary">
                    {formatUnits(item.totalPrice, decimals)} {symbol}
                  </TableCell>
                  <TableCell>
                    {item.status ? (
                      <Badge variant="success">Delivered</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-amber-500"
                      >
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status ? (
                      <span className="text-xs text-muted-foreground">
                        Completed
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={busy}
                        onClick={() => void onDeliver(item.id)}
                      >
                        Mark delivered
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          title="No sales yet"
          body="Orders for your marketplace will appear here once customers purchase your items."
        />
      )}
    </div>
  );
}

function ProductModal({
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

function ConfirmModal({
  title,
  body,
  onClose,
  onConfirm,
  busy,
}: {
  title: string;
  body: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  busy: boolean;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="text-destructive">{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy && <Loader2 className="size-4 animate-spin mr-1.5" />}
            Remove product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({
  title,
  body,
  compact = false,
}: {
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center text-muted-foreground ${
        compact ? "py-8" : "py-16"
      }`}
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted/60 text-muted-foreground">
        <Package className="size-6" />
      </div>
      <strong className="text-sm font-semibold text-foreground">{title}</strong>
      <span className="max-w-sm text-xs leading-relaxed">{body}</span>
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

  if (String(raw).includes("Price is not correct")) {
    return "You do not have enough G tokens for this transaction.";
  }

  if (String(raw).includes("Product Not Found")) {
    return "Product not found for this merchant.";
  }

  if (String(raw).includes("insufficient funds")) {
    return "Not enough Sepolia ETH to pay gas.";
  }

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
