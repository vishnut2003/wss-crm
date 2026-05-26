import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { SALES_INVOICE_STATUSES } from "@/lib/voucher";

const itemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 500 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    taxRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
    lineTotal: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const customerSchema = new Schema(
  {
    refId: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    company: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, uppercase: true, default: "" },
  },
  { _id: false },
);

// Lightweight collections log written by the Recovery page when a follow-up
// is recorded against an overdue invoice.
const followUpSchema = new Schema(
  {
    at: { type: Date, default: Date.now, required: true },
    by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, trim: true, default: "", maxlength: 2000 },
  },
  { _id: true },
);

const salesInvoiceSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    number: { type: String, required: true, trim: true, maxlength: 32 },
    customer: { type: customerSchema, required: true },
    // Optional internal link to a SalesOrder this invoice was raised from.
    // Explicitly NOT linked to Quotation per product constraint.
    salesOrder: {
      type: Schema.Types.ObjectId,
      ref: "SalesOrder",
      default: null,
      index: true,
    },
    currency: { type: String, required: true, trim: true, default: "INR" },
    invoiceDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, default: null },
    items: { type: [itemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    taxTotal: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0, default: 0 },
    // Sum of allocated receipts. Recomputed whenever a Receipt mutating this
    // invoice is created, updated, or cancelled.
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: SALES_INVOICE_STATUSES,
      required: true,
      default: "unpaid",
      index: true,
    },
    notes: { type: String, trim: true, default: "", maxlength: 4000 },
    terms: { type: String, trim: true, default: "", maxlength: 4000 },
    followUps: { type: [followUpSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

salesInvoiceSchema.index({ workspace: 1, number: 1 }, { unique: true });
salesInvoiceSchema.index({ workspace: 1, status: 1 });
salesInvoiceSchema.index({ workspace: 1, updatedAt: -1 });
salesInvoiceSchema.index({ workspace: 1, dueDate: 1 });
salesInvoiceSchema.index({ workspace: 1, "customer.refId": 1 });

export type ISalesInvoice = InferSchemaType<typeof salesInvoiceSchema>;

if (process.env.NODE_ENV !== "production" && mongoose.models.SalesInvoice) {
  mongoose.deleteModel("SalesInvoice");
}

const SalesInvoice: Model<ISalesInvoice> =
  (mongoose.models.SalesInvoice as Model<ISalesInvoice> | undefined) ??
  mongoose.model<ISalesInvoice>("SalesInvoice", salesInvoiceSchema);

export default SalesInvoice;
