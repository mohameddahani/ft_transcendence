import axios from "axios";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import type { SignedForwardRequest } from "@/types/marketplace";

type RelayerResponse = {
  hash?: string;
  error?: string;
};

export async function submitGaslessTransaction(
  payload: SignedForwardRequest
): Promise<string> {
  try {
    // Route via Next.js BFF proxy to avoid CORS and keep the relayer host private
    const response = await api.post<RelayerResponse>(
      "/api/blockchain/relayer",
      payload
    );

    const { hash, error } = response.data;

    if (!hash) {
      throw new Error(error || "Relayer did not accept the transaction.");
    }

    return hash;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const serverError =
        (err.response.data as { error?: string; message?: string })?.error ||
        (err.response.data as { error?: string; message?: string })?.message;
      if (serverError) {
        throw new Error(serverError);
      }
    }
    throw err;
  }
}

export const update_addressAdmin_forMember = async (address: string) => {
  try {
    await api.patch("/api/users/admins/edit-profile", { walletAddress: address });
  } catch (error) {
    const errorMsg =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to update admin wallet address";
    toast.error(errorMsg);
  }
};

export const update_walletAddress_member = async (address: string) => {
  try {
    await api.patch("/api/users/members/edit-profile", { walletAddress: address });
  } catch (error) {
    const errorMsg =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to update member wallet address";
    toast.error(errorMsg);
  }
};

