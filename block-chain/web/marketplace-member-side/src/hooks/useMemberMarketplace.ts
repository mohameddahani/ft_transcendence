"use client";
import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  EXPLORER_BASE,
  GASLESS_ENABLED,
  GYMTOKEN_ABI,
} from "@/app/contract";
import { relayForwarderMethod } from "@/lib/gasless";
import { parseError } from "@/lib/marketplace-errors";
import type {
  ApiMembershipPlan,
  MembershipPlan,
  Product,
  Purchase,
  RawProductItem,
  RawPurchaseItem,
} from "@/types/marketplace";
import axios from "axios";
import { BrowserProvider, Contract, JsonRpcSigner, formatUnits } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { update_walletAddress_member } from "@/lib/api/marketplace";
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
  const [tab, setTab] = useState<"shop" | "purchases" | "subscription">("shop");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [buyingId, setBuyingId] = useState<bigint | null>(null);

  // Subscription state
  const [subOwner] = useState("");
  const [subAmount] = useState("");
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [subscribing, setSubscribing] = useState(false);

  const [selectedPlanIndex, setSelectedPlanIndex] = useState<string>("0");
  const [selectedDurationIndex, setSelectedDurationIndex] =
    useState<string>("0");

  const activePlans = plans.filter((plan) => plan.isActive);

  const planItems = activePlans.map((plan, index) => ({
    label: plan.planName,
    value: String(index),
  }));
  const selectedPlan = activePlans[Number(selectedPlanIndex)];

  const durationItems = (selectedPlan?.durations ?? []).map(
    (duration, index) => ({
      value: String(index),
      label: `${duration.durationDays} Days - ${duration.priceByG} G`,
    }),
  );

  const selectedDuration =
    selectedPlan?.durations[Number(selectedDurationIndex)];

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
      update_walletAddress_member(account);
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

  useEffect(() => {
    if (!readContract || !account) return;

    async function fetch_plans() {
      const query = new URLSearchParams({
        page: "1",
        limit: "10000",
      }).toString();

      try {
        const API_URL = `${process.env.NEXT_PUBLIC_FETCH_PLANS_URL}?${query}`;
        const response = await axios.get<ApiMembershipPlan[]>(API_URL, {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg4MDBjZmM0LTVhNTAtNGYxYi1hNDQ0LTgxNjdjYWFlMzNkMCIsInJvbGUiOiJNRU1CRVIiLCJpYXQiOjE3OTE2NjMyNTMsImV4cCI6MTc5NDI1NTI1M30.Egh8nKZmROfz3Y6q5PfRLjWY9rSoY2B9gTNQCFoLR1Y",
          },
        });

        const mappedPlans: MembershipPlan[] = response.data.map((plan) => ({
          planName: plan.planName,
          description: plan.description,
          isActive: plan.isActive,
          durations: plan.membershipPlanDurations.map((duration) => ({
            durationDays: duration.durationDays,
            priceByG: duration.priceByG,
          })),
        }));
        setPlans(mappedPlans);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("Status:", error.response?.status);
          console.error("Server error:", error.response?.data);
          console.error("Message:", error.message);
        } else {
          console.error("Unexpected error:", error);
        }
      }
    }
    fetch_plans();
  }, [readContract, account]);

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
      update_walletAddress_member(account);
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

  const handlePaySubscription = async () => {
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
      await relayForwarderMethod(provider, signer, "paySubscription", [
        subOwner,
        subAmount,
      ]);
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
    subOwner,
    subAmount,
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
  };
}
