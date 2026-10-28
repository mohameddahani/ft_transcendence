"use client";
import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  EXPLORER_BASE,
  GYMTOKEN_ABI,
} from "@/app/contract";
import { relayForwarderMethod } from "@/lib/gasless";
import { parseError } from "@/lib/marketplace-errors";
import type {
  Product,
  ProductFormData,
  RawProductItem,
  RawSaleItem,
  Sale,
} from "@/types/marketplace";
import {
  BrowserProvider,
  Contract,
  JsonRpcSigner,
  formatUnits,
  parseUnits,
} from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { update_addressAdmin_forMember } from "@/lib/api/marketplace";
export function useAdminMarketplace() {
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
      update_addressAdmin_forMember(account);
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
      update_addressAdmin_forMember(account);
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
    successText: string,
  ) => {
    setBusy(true);

    try {
      const hash = await fn();

      console.log("Relayed transaction:", hash);

      toast.success(successText);

      await refresh();
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setBusy(false);
    }
  };

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
  return {
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
  };
}
