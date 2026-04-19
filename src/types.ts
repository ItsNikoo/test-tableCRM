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

export interface ApiListResponse<T> {
  result: T[];
  count: number;
}