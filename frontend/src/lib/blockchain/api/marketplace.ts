import axios from "axios";
import api from "@/lib/axios";
import type { SignedForwardRequest } from "@/types/marketplace";

type RelayerResponse = {
  hash?: string;
  error?: string;
};

export async function submitGaslessTransaction(
  payload: SignedForwardRequest
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

export const update_addressAdmin_forMember = async (address: string) => {
  try {
    await api.patch("/api/users/admins/edit-profile", { walletAddress: address });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Server error:", error.response?.data);
      console.error("Message:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  }
};

export const update_walletAddress_member = async (address: string) => {
  try {
    await api.patch("/api/users/members/edit-profile", { walletAddress: address });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Server error:", error.response?.data);
      console.error("Message:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  }
};

