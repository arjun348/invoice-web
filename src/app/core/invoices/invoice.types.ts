export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface InvoiceClient {
  id: number;
  name: string;
  company_name: string | null;
}

export interface Invoice {
  id: number;
  client_id: number;
  number: string;
  amount: string;
  status: InvoiceStatus;
  due_date: string;
  notes: string | null;
  client: InvoiceClient;
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