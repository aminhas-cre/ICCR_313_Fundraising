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
}
