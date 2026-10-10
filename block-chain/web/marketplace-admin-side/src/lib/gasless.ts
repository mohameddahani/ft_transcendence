import {
  BrowserProvider,
  Contract,
  JsonRpcSigner,
  getAddress,
} from "ethers";
import { Interface } from "ethers";
import { CHAIN_ID, GASLESS_ENABLED, GYMTOKEN_ABI, FORWARDER_ADDRESS, FORWARDER_ABI, CONTRACT_ADDRESS } from "@/app/contract";
import { toast } from "react-toastify";

export const FORWARD_TYPES = {
  ForwardRequest: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "gas", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint48" },
    { name: "data", type: "bytes" },
  ],
};

export const forwardDomain = (address: string) => ({
  name: "GymTokenForwarder",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: address,
});

export type SignedForwardRequest = {
  from: string;
  to: string;
  value: string;
  gas: string;
  nonce: string;
  deadline: string;
  data: string;
  signature: string;
};


export async function relayForwarderCall(
  provider: BrowserProvider,
  signer: JsonRpcSigner,
  data: string
): Promise<string>{
  if (!GASLESS_ENABLED) throw new Error("Gasless transactions are not configured.");
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) throw new Error("Switch your wallet to Sepolia first.");

  const from = getAddress(await signer.getAddress());
  const forwarder = new Contract(FORWARDER_ADDRESS, FORWARDER_ABI, provider);
  const nonce: bigint = await forwarder.nonces(from);

  const request = {
    from,
    to: getAddress(CONTRACT_ADDRESS),
    value: 0n,
    gas: 500_000n,
    nonce,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 300),
    data,
  };

  const signature = await signer.signTypedData(forwardDomain(FORWARDER_ADDRESS), FORWARD_TYPES, request);

  const payload: SignedForwardRequest = {
    from: request.from,
    to: request.to,
    value: request.value.toString(),
    gas: request.gas.toString(),
    nonce: request.nonce.toString(),
    deadline: request.deadline.toString(),
    data: request.data,
    signature,
  };

  toast.info("Submitting gasless transaction…")

  const response = await fetch("http://localhost:3333/blockchain/relayer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json() as { hash?: string; error?: string };
  if (!response.ok || !result.hash)
    throw new Error(result.error || "elayer did not accept the transaction.")

  const receipt = await provider.waitForTransaction(result.hash);

  if (!receipt || receipt.status !== 1)
    throw new Error("Relayed transaction failed or was not confirmed.");

  return result.hash;
}


export async function relayForwarderMethod(
  provider: BrowserProvider,
  signer: JsonRpcSigner,
  Method: string,
  args: readonly unknown[]
): Promise<string>{
  const data = new Interface(GYMTOKEN_ABI).encodeFunctionData(Method, args);
  return relayForwarderCall(provider, signer, data);
}