import axios from "axios";
import type { SignedForwardRequest } from "@/types/marketplace";

type RelayerResponse = {
  hash?: string;
  error?: string;
};

export async function submitGaslessTransaction(
  payload: SignedForwardRequest,
): Promise<string> {
  const API_URL_RELAYER = process.env.NEXT_PUBLIC_API_URL_RELAYER;

  if (!API_URL_RELAYER) {
    throw new Error("Relayer API URL is missing");
  }

  const response = await axios.post<RelayerResponse>(API_URL_RELAYER, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const { hash, error } = response.data;

  if (!hash) {
    throw new Error(error || "Relayer did not accept the transaction.");
  }

  return hash;
}

export const update_walletAddress_member = async (address: string) => {
  try {
    const API_URL = `${process.env.NEXT_PUBLIC_UPDATE_WALLET_ADDRESS_MEMBER}`;
    await axios.patch(
      API_URL,
      { walletAddress: address }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log("Status:", error.response?.status);
      console.log("Server error:", error.response?.data);
      console.log("Message:", error.message);
    } else {
      console.log("Unexpected error:", error);
    }
  }
};
