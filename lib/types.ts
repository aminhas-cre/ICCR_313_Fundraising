export interface Donor {
  id: string;
  created_at: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  ticket_count: number;
  status: "pledged" | "paid";
  paid_at: string | null;
  referred_by: string | null;
  show_public: boolean;
  notes: string | null;
  ticket_no: number;
  access_token: string;
  source: "web" | "admin";
  paid_amount?: number; // added by /api/donors
}

export const PAYMENT_METHODS = ["zelle", "cash", "check", "card", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Payment {
  id: string;
  created_at: string;
  donor_id: string;
  amount: number;
  method: PaymentMethod;
  received_on: string;
  memo: string | null;
  reference: string | null;
  voided_at: string | null;
}

export type PledgeStatus = "pledged" | "partial" | "paid";

// What a donor is allowed to see about their own pledge.
export interface PledgeView {
  ticket: string;
  name: string;
  tickets: number;
  due: number;
  paid: number;
  balance: number;
  status: PledgeStatus;
  payments: { amount: number; method: string; received_on: string }[];
  token: string;
  zelle_email: string;
  ticket_price: number;
}
