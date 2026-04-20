export interface Organization {
  id: number;
  type: string;
  short_name: string;
  full_name: string;
  work_name: string;
  inn: number;
  kpp: number;
  org_type: string;
  tax_type: string;
}

export interface Warehouse {
  id: number;
  name: string;
  type: string;
  description: string;
  address: string;
  status: boolean;
}

export interface Paybox {
  id: number;
  name: string;
  type: string;
  source_account_name: string;
  amount: number;
}

export interface PriceType {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  description_short: string;
  type: string;
  unit: number;
  unit_name: string;
  barcodes: string[];
  prices: { price: number; price_type: string }[];
  balances: { warehouse_name: string; current_amount: number }[];
  category: number;
  group_name: string;
}

export interface Contragent {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

export interface ApiListResponse<T> {
  result: T[];
  count: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}