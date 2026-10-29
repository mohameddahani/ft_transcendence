import axios from "axios";
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
    const API_URL = `${process.env.NEXT_PUBLIC_UPDATE_WALLET_ADDRESS_ADMIN}`;
    await axios.patch(
      API_URL,
      { walletAddress: address },
      {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZiYWI3MDMwLTNmMzAtNGYzOC05OTViLWEyNDQ3YWJmMTA5ZiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc5MTg4OTY0NSwiZXhwIjoxNzk0NDgxNjQ1fQ.ezAf4G4iFoOWOmTuKDzyOcvo5S6RtEctBW39f-L3SV0",
        },
      }
    );
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
    const API_URL = `${process.env.NEXT_PUBLIC_UPDATE_WALLET_ADDRESS_MEMBER}`;
    await axios.patch(API_URL, { walletAddress: address });
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

