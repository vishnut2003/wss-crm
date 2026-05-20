import type {
  QuotationRecipientKind,
  QuotationStatus,
} from "@/lib/quotation";

export type SerializedQuotationItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
};

export type SerializedQuotationRecipient = {
  kind: QuotationRecipientKind;
  refId: string | null;
  name: string;
  company: string;
  email: string;
};

export type SerializedQuotation = {
  id: string;
  workspaceId: string;
  number: string;
  recipient: SerializedQuotationRecipient;
  currency: string;
  issueDate: string;
  validUntil: string | null;
  items: SerializedQuotationItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  status: QuotationStatus;
  notes: string;
  terms: string;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuotationDocLike = {
  _id: { toString(): string };
  workspace: { toString(): string };
  number: string;
  recipient: {
    kind: QuotationRecipientKind;
    refId: { toString(): string } | null;
    name: string;
    company?: string;
    email?: string;
  };
  currency: string;
  issueDate: Date;
  validUntil: Date | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    lineTotal: number;
  }>;
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  status: QuotationStatus;
  notes?: string;
  terms?: string;
  createdBy: { toString(): string };
  assignedTo: { toString(): string } | null;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeQuotation(
  doc: QuotationDocLike,
): SerializedQuotation {
  return {
    id: String(doc._id),
    workspaceId: String(doc.workspace),
    number: doc.number,
    recipient: {
      kind: doc.recipient.kind,
      refId: doc.recipient.refId ? String(doc.recipient.refId) : null,
      name: doc.recipient.name,
      company: doc.recipient.company ?? "",
      email: doc.recipient.email ?? "",
    },
    currency: doc.currency,
    issueDate: doc.issueDate.toISOString(),
    validUntil: doc.validUntil ? doc.validUntil.toISOString() : null,
    items: doc.items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      taxRate: it.taxRate,
      lineTotal: it.lineTotal,
    })),
    subtotal: doc.subtotal,
    taxTotal: doc.taxTotal,
    discount: doc.discount,
    total: doc.total,
    status: doc.status,
    notes: doc.notes ?? "",
    terms: doc.terms ?? "",
    createdBy: String(doc.createdBy),
    assignedTo: doc.assignedTo ? String(doc.assignedTo) : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
