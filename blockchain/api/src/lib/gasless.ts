export const BUY_TYPES = {
  Buy: [
    { name: "buyer", type: "address" },
    { name: "merchant", type: "address" },
    { name: "productId", type: "uint256" },
    { name: "quantity", type: "uint256" },
    { name: "maxTotalPrice", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

export const buyDomain = (chainId: number, contractAddress: string) => ({
  name: "GymToken",
  version: "1",
  chainId,
  verifyingContract: contractAddress,
});

export type SignedBuy = {
  buyer: string;
  merchant: string;
  productId: string;
  quantity: string;
  maxTotalPrice: string;
  nonce: string;
  deadline: string;
  signature: string;
};
