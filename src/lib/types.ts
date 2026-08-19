export interface UserProfile {
  createdAt: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
}

export interface WalletBalance {
  id: string;
  currency: string;
  balance: number;
}

export interface WalletData {
  balances: WalletBalance[];
}

export interface RatesData {
  rates: Record<string, number>;
  source: string;
}

export interface Transaction {
  id: string;
  reference: string;
  type: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rateUsed: number;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface TransactionList {
  transactions: Transaction[];
  total: number;
}

export interface AdminUsers {
  users: UserProfile[];
  total: number;
}

export interface AnalyticsData {
  users: { total: number; verified: number; unverified: number };
  transactions: {
    byType: Array<{ type: string; count: string }>;
  };
}

export interface ToastState {
  msg: string;
  type: "success" | "error";
}
