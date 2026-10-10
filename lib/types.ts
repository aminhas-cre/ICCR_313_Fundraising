export const PAYMENT_METHODS = ["zelle", "cash", "check", "card", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// A pledger (one record per email).
export interface Donor {
  id: string;
  created_at: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  show_public: boolean;
  notes: string | null;
  access_token: string;
  source: "web" | "admin";
}

// One numbered ticket (ICCR-n).
export interface Ticket {
  ticket_no: number;
  donor_id: string;
  created_at: string;
  paid: boolean;
  paid_at: string | null;
  paid_amount: number | null;
  pay_method: PaymentMethod | null;
  received_on: string | null;
  bank_memo: string | null;
  passed_on: boolean;
  passed_to: string | null;
}

// What a pledger is allowed to see about their own tickets.
export interface PledgeTicket {
  no: number;
  paid: boolean;
  received_on: string | null;
  passed_on: boolean;
  passed_to: string | null;
}

export interface PledgeView {
  name: string;
  token: string;
  zelle_email: string;
  ticket_price: number;
  tickets: PledgeTicket[];
}
