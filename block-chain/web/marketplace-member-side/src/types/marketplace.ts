export type Product = {
  id: bigint;
  name: string;
  description: string;
  stock: bigint;
  price: bigint;
  images: string[];
  merchant: string;
};

export type Purchase = {
  id: bigint;
  productName: string;
  gymOwner: string;
  quantity: bigint;
  time: bigint;
  totalPrice: bigint;
};

export type ApiMembershipPlan = {
  planName: string;
  description: string;
  isActive: boolean;
  membershipPlanDurations: {
    durationDays: number;
    priceByG: number;
  }[];
};

export type MembershipPlan = {
  planName: string;
  description: string;
  isActive: boolean;
  durations: {
    durationDays: number;
    priceByG: number;
  }[];
};

export type RawProductItem = {
  id: bigint;
  product: {
    name: string;
    description: string;
    stok: bigint;
    price: bigint;
    productImage: string[];
  };
};

export type RawPurchaseItem = {
  id: bigint;
  productName: string;
  gymOwner: string;
  quantity: bigint;
  time: bigint;
  totalPrice: bigint;
};
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

