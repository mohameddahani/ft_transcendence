"use client";

import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  EXPLORER_BASE,
  GASLESS_ENABLED,
  GYMTOKEN_ABI,
} from "@/lib/blockchain/contract";
import { relayForwarderMethod } from "@/lib/blockchain/gasless";
import { parseError } from "@/lib/blockchain/marketplace-errors";
import { update_walletAddress_member } from "@/lib/blockchain/api/marketplace";
import type {
  Product,
  Purchase,
  RawProductItem,
  RawPurchaseItem,
} from "@/types/marketplace";
import { BrowserProvider, Contract, JsonRpcSigner, formatUnits, getAddress, isAddress, ZeroAddress } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useTokenTransfer } from "./useTokenTransfer";

export function useMemberMarketplace() {
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
  const [tab, setTab] = useState<"shop" | "purchases" | "transfer">("shop");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [buyingId, setBuyingId] = useState<bigint | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("gym_user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const owner = user?.adminWalletAddress;
      if (typeof owner === "string" && isAddress(owner) && getAddress(owner) !== ZeroAddress) {
        setMarketAddress(getAddress(owner));
      }
    } catch {
      // Ignore invalid stored gym wallet data.
      setMarketAddress("");
    }
  }, []);

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

      const merchant = marketAddress.trim(); // we will add the address of the gymowner that saved in the clinet info
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
        // getPurchases() indexes the contract's history by _msgSender().
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
      } catch {
        setPurchases([]);
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
        console.warn("Init web3 error:", err);
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
      void update_walletAddress_member(accounts[0]);
      toast.success("Wallet connected successfully!");
    } catch (error) {
      toast.error(parseError(error));
    }
  };

  const switchToSepolia = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
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
      toast.error("Gasless purchases require contract addresses to be configured.");
      return;
    }
    if (chainId !== CHAIN_ID) {
      toast.error("Switch your wallet to Sepolia first.");
      return;
    }
    if (quantity <= BigInt(0)) {
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
      await relayForwarderMethod(provider, signer, "buyProduct", [
        product.merchant,
        product.id,
        quantity,
        total,
      ]);
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

  const transfer = useTokenTransfer({ provider, signer, account, chainId, tokenDecimals, refresh });

  const isSepolia = chainId === CHAIN_ID;
  const balanceLabel = formatUnits(tokenBalance, tokenDecimals);

  return {
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
  };
}
