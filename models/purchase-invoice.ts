import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PURCHASE_INVOICE_STATUSES } from "@/lib/voucher";

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

const vendorSchema = new Schema(
  {
    refId: { type: Schema.Types.ObjectId, ref: "Vendor", default: null },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    company: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, uppercase: true, default: "" },
  },
  { _id: false },
);

const purchaseInvoiceSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    number: { type: String, required: true, trim: true, maxlength: 32 },
    // Vendor's own bill number, captured for reference.
    vendorBillNumber: { type: String, trim: true, default: "", maxlength: 64 },
    vendor: { type: vendorSchema, required: true },
    purchaseOrder: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
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
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: PURCHASE_INVOICE_STATUSES,
      required: true,
      default: "unpaid",
      index: true,
    },
    notes: { type: String, trim: true, default: "", maxlength: 4000 },
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

purchaseInvoiceSchema.index({ workspace: 1, number: 1 }, { unique: true });
purchaseInvoiceSchema.index({ workspace: 1, status: 1 });
purchaseInvoiceSchema.index({ workspace: 1, updatedAt: -1 });
purchaseInvoiceSchema.index({ workspace: 1, dueDate: 1 });
purchaseInvoiceSchema.index({ workspace: 1, "vendor.refId": 1 });

export type IPurchaseInvoice = InferSchemaType<typeof purchaseInvoiceSchema>;

if (process.env.NODE_ENV !== "production" && mongoose.models.PurchaseInvoice) {
  mongoose.deleteModel("PurchaseInvoice");
}

const PurchaseInvoice: Model<IPurchaseInvoice> =
  (mongoose.models.PurchaseInvoice as Model<IPurchaseInvoice> | undefined) ??
  mongoose.model<IPurchaseInvoice>("PurchaseInvoice", purchaseInvoiceSchema);

export default PurchaseInvoice;
