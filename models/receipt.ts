import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PAYMENT_MODES, RECEIPT_STATUSES } from "@/lib/voucher";

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

const allocationSchema = new Schema(
  {
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "SalesInvoice",
      required: true,
    },
    invoiceNumber: { type: String, trim: true, default: "" },
    amount: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const receiptSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    number: { type: String, required: true, trim: true, maxlength: 32 },
    customer: { type: customerSchema, required: true },
    currency: { type: String, required: true, trim: true, default: "INR" },
    receiptDate: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true, min: 0, default: 0 },
    paymentMode: {
      type: String,
      enum: PAYMENT_MODES,
      required: true,
      default: "bank",
    },
    // Cheque number / UTR / transaction id / wallet ref.
    reference: { type: String, trim: true, default: "", maxlength: 120 },
    // [] means "on account" — money received without specifying which invoices.
    allocations: { type: [allocationSchema], default: [] },
    status: {
      type: String,
      enum: RECEIPT_STATUSES,
      required: true,
      default: "cleared",
      index: true,
    },
    notes: { type: String, trim: true, default: "", maxlength: 2000 },
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

receiptSchema.index({ workspace: 1, number: 1 }, { unique: true });
receiptSchema.index({ workspace: 1, status: 1 });
receiptSchema.index({ workspace: 1, updatedAt: -1 });
receiptSchema.index({ workspace: 1, "customer.refId": 1 });
receiptSchema.index({ workspace: 1, "allocations.invoice": 1 });

export type IReceipt = InferSchemaType<typeof receiptSchema>;

if (process.env.NODE_ENV !== "production" && mongoose.models.Receipt) {
  mongoose.deleteModel("Receipt");
}

const Receipt: Model<IReceipt> =
  (mongoose.models.Receipt as Model<IReceipt> | undefined) ??
  mongoose.model<IReceipt>("Receipt", receiptSchema);

export default Receipt;
