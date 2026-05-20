import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  QUOTATION_RECIPIENT_KINDS,
  QUOTATION_STATUSES,
} from "@/lib/quotation";

export {
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABEL,
  QUOTATION_STATUS_BADGE_CLASS,
  QUOTATION_STATUS_DOT_CLASS,
  QUOTATION_RECIPIENT_KINDS,
  type QuotationStatus,
  type QuotationRecipientKind,
} from "@/lib/quotation";

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

const recipientSchema = new Schema(
  {
    kind: { type: String, enum: QUOTATION_RECIPIENT_KINDS, required: true },
    // Required only when `kind` is "customer" or "lead" — for "custom",
    // there's no backing CRM record. name / company / email are snapshotted
    // at quotation-creation time either way so the quotation stays stable
    // even if the source record changes later.
    refId: { type: Schema.Types.ObjectId, default: null },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    company: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const quotationSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    number: { type: String, required: true, trim: true, maxlength: 32 },
    recipient: { type: recipientSchema, required: true },
    currency: { type: String, required: true, trim: true, default: "INR" },
    issueDate: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date, default: null },
    items: { type: [itemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    taxTotal: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: QUOTATION_STATUSES,
      required: true,
      default: "draft",
      index: true,
    },
    notes: { type: String, trim: true, default: "", maxlength: 4000 },
    terms: { type: String, trim: true, default: "", maxlength: 4000 },
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

quotationSchema.index({ workspace: 1, number: 1 }, { unique: true });
quotationSchema.index({ workspace: 1, status: 1 });
quotationSchema.index({ workspace: 1, updatedAt: -1 });
quotationSchema.index({ workspace: 1, "recipient.refId": 1 });

export type IQuotation = InferSchemaType<typeof quotationSchema>;

if (process.env.NODE_ENV !== "production" && mongoose.models.Quotation) {
  mongoose.deleteModel("Quotation");
}

const Quotation: Model<IQuotation> =
  (mongoose.models.Quotation as Model<IQuotation> | undefined) ??
  mongoose.model<IQuotation>("Quotation", quotationSchema);

export default Quotation;
