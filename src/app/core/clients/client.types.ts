import { PaginatedResponse } from '../invoices/invoice.types';

export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
}

export interface ClientPayload {
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
}

export type ClientListResponse = PaginatedResponse<Client>;

export interface ClientResource {
  data: Client;
}