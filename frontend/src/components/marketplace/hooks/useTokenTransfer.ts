"use client";

import { useRef, useState } from "react";
import {
  BrowserProvider,
  Contract,
  JsonRpcSigner,
  MaxUint256,
  ZeroAddress,
  formatUnits,
  getAddress,
  isAddress,
  parseUnits,
} from "ethers";
import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  GASLESS_ENABLED,
  GYMTOKEN_ABI,
} from "@/lib/blockchain/contract";
import { relayForwarderMethod } from "@/lib/blockchain/gasless";
import { parseError } from "@/lib/blockchain/marketplace-errors";
import { toast } from "react-toastify";

export function parseTokenTransfer(
  recipient: string,
  amount: string,
  decimals: number,
) {
  const address = recipient.trim();
  if (!isAddress(address) || getAddress(address) === ZeroAddress)
    throw new Error("Enter a valid recipient wallet address.");
  const text = amount.trim();
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(text))
    throw new Error("Enter a positive amount of G.");
  if ((text.split(".")[1]?.length ?? 0) > decimals)
    throw new Error(`Use no more than ${decimals} decimal places.`);
  const units = parseUnits(text, decimals);
  if (units <= 0n || units > MaxUint256)
    throw new Error("Enter a valid amount greater than zero.");
  return { recipient: getAddress(address), units };
}

type TransferOptions = {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  account: string;
  chainId: number | null;
  tokenDecimals: number;
  refresh: () => Promise<void>;
};

export function useTokenTransfer({
  provider,
  signer,
  account,
  chainId,
  tokenDecimals,
  refresh,
}: TransferOptions) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [review, setReview] = useState<{
    recipient: string;
    amount: string;
    sender: string;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const [lastHash, setLastHash] = useState<string | null>(null);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const prepare = () => {
    setError("");
    try {
      if (!account || !provider || !signer)
        throw new Error("Connect your wallet first.");
      if (!GASLESS_ENABLED)
        throw new Error("Token transfers are not configured.");
      if (chainId !== CHAIN_ID)
        throw new Error("Switch your wallet to Sepolia first.");
      const parsed = parseTokenTransfer(recipient, amount, tokenDecimals);
      setReview({
        recipient: parsed.recipient,
        amount: formatUnits(parsed.units, tokenDecimals),
        sender: getAddress(account),
      });
    } catch (cause) {
      setError(parseError(cause));
    }
  };

  const complete = async (hash: string) => {
    setPendingHash(null);
    setLastHash(hash);
    setReview(null);
    setAmount("");
    setError("");
    toast.success("G tokens sent successfully.");
    await refresh();
  };

  const send = async () => {
    if (busy.current || pendingHash || !review || !provider || !signer) return;
    busy.current = true;
    setSending(true);
    setError("");
    let submitted: string | null = null;
    try {
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID)
        throw new Error("Switch your wallet to Sepolia first.");
      const sender = getAddress(await signer.getAddress());
      if (sender !== review.sender || sender !== getAddress(account))
        throw new Error("Your wallet changed. Review the transfer again.");
      const contract = new Contract(CONTRACT_ADDRESS, GYMTOKEN_ABI, provider);
      const decimals = Number(await contract.decimals());
      const transfer = parseTokenTransfer(
        review.recipient,
        review.amount,
        decimals,
      );
      const balance: bigint = await contract.balanceOf(sender);
      if (transfer.units > balance)
        throw new Error("You do not have enough G for this transfer.");
      const hash = await relayForwarderMethod(
        provider,
        signer,
        "transfer",
        [transfer.recipient, transfer.units],
        (hash) => {
          submitted = hash;
          setPendingHash(hash);
        },
      );
      await complete(hash);
    } catch (cause) {
      setError(
        submitted
          ? "The transfer was submitted. Check its status below before sending again."
          : parseError(cause),
      );
    } finally {
      busy.current = false;
      setSending(false);
    }
  };

  const checkStatus = async () => {
    if (busy.current || !pendingHash || !provider) return;
    busy.current = true;
    setSending(true);
    try {
      if (Number((await provider.getNetwork()).chainId) !== CHAIN_ID)
        throw new Error("Switch your wallet to Sepolia first.");
      const receipt = await provider.getTransactionReceipt(pendingHash);
      if (!receipt) {
        setError("The transfer is still pending. Check again shortly.");
        return;
      }
      if (receipt.status !== 1) {
        setPendingHash(null);
        setReview(null);
        setError("The transfer failed on-chain. No G tokens were sent.");
        return;
      }
      await complete(pendingHash);
    } catch (cause) {
      setError(parseError(cause));
    } finally {
      busy.current = false;
      setSending(false);
    }
  };

  return {
    recipient,
    setRecipient,
    amount,
    setAmount,
    review,
    cancelReview: () => setReview(null),
    prepare,
    send,
    sending,
    error,
    pendingHash,
    lastHash,
    checkStatus,
  };
}
