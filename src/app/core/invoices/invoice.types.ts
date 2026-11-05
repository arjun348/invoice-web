export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'cancelled';

export interface InvoiceClient {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company_name: string | null;
  address?: string | null;
  trn?: string | null;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  line_subtotal?: number | string;
  sort_order?: number;
}

export interface Invoice {
  id: number;
  company_id: number;
  client_id: number;
  number: string;

  invoice_date: string | null;
  due_date: string;
  status: InvoiceStatus;

  subtotal: string;
  discount_percentage: string;
  discount_amount: string;
  taxable_amount: string;

  vat_rate: string;
  vat_amount: string;

  amount: string;
  currency: string;

  amount_paid: string;
  outstanding_amount: string;

  notes: string | null;

  issued_at: string | null;
  cancelled_at: string | null;

  client?: InvoiceClient;
  items?: InvoiceItem[];

  payments?: unknown[];
  email_logs?: unknown[];

  created_at?: string;
  updated_at?: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResource<T> {
  data: T;
}
