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

export type Product = {
  id: bigint;
  name: string;
  description: string;
  stock: bigint;
  price: bigint;
  images: string[];
  merchant: string;
};

export type Sale = {
  id: bigint;
  productName: string;
  client: string;
  quantity: bigint;
  time: bigint;
  totalPrice: bigint;
  status: boolean;
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

export type RawSaleItem = {
  id: bigint;
  productName: string;
  client: string;
  quantity: bigint;
  time: bigint;
  totalPrice: bigint;
  status: boolean;
};

export type ProductFormData = {
  id: string;
  name: string;
  description: string;
  stock: string;
  price: string;
  images: string;
};
