export type AccountType = "bank" | "investment" | "cash" | "other";
export type Provider = "imagin" | "openbank" | "myinvestor" | null;

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  provider: Provider;
  calculated_balance: number;
  real_balance: number | null;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  kind: "expense" | "income";
};

export type TransactionType =
  | "expense"
  | "income"
  | "transfer"
  | "investment"
  | "balance_adjustment";
