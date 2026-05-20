// Plain (non-"use client") module so server components can import these
// values directly. Exports from a client-marked module become opaque client
// references when imported by a server component — constants don't survive
// the boundary, which is what broke `defaults.items` for the new-quotation
// page.

import type { QuotationCurrency, QuotationStatus } from "@/lib/quotation";
import type { RecipientResult } from "../actions";

export type QuotationFormMember = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

export type QuotationFormItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type QuotationFormDefaults = {
  recipient: RecipientResult | null;
  currency: QuotationCurrency;
  status: QuotationStatus;
  issueDate: Date | null;
  validUntil: Date | null;
  items: QuotationFormItem[];
  discount: number;
  notes: string;
  terms: string;
  assignedTo: string;
};

// `issueDate` is intentionally null — the new-quotation page fills in a
// fresh `new Date()` per request so it isn't frozen to the server-boot
// time when this module is first loaded.
export const EMPTY_QUOTATION_DEFAULTS: QuotationFormDefaults = {
  recipient: null,
  currency: "INR",
  status: "draft",
  issueDate: null,
  validUntil: null,
  items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
  discount: 0,
  notes: "",
  terms: "",
  assignedTo: "",
};
