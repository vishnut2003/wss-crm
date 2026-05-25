import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const addressSchema = new Schema(
  {
    line1: { type: String, trim: true, default: "" },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const bankSchema = new Schema(
  {
    bankName: { type: String, trim: true, default: "" },
    accountName: { type: String, trim: true, default: "" },
    accountNumber: { type: String, trim: true, default: "" },
    ifsc: { type: String, trim: true, uppercase: true, default: "" },
    branch: { type: String, trim: true, default: "" },
    upiId: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const companySchema = new Schema(
  {
    // One company profile per workspace.
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      unique: true,
      index: true,
    },
    legalName: { type: String, required: true, trim: true, maxlength: 160 },
    displayName: { type: String, trim: true, default: "", maxlength: 160 },
    email: { type: String, lowercase: true, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    address: { type: addressSchema, default: () => ({}) },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 15,
      default: "",
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
      default: "",
    },
    cin: { type: String, trim: true, uppercase: true, default: "" },
    taxId: { type: String, trim: true, default: "" },
    bank: { type: bankSchema, default: () => ({}) },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export type ICompany = InferSchemaType<typeof companySchema>;

if (process.env.NODE_ENV !== "production" && mongoose.models.Company) {
  mongoose.deleteModel("Company");
}

const Company: Model<ICompany> =
  (mongoose.models.Company as Model<ICompany> | undefined) ??
  mongoose.model<ICompany>("Company", companySchema);

export default Company;
