import mongoose, { Document, Schema } from 'mongoose';

export interface IFaq extends Document {
  businessId: mongoose.Types.ObjectId | null; // null = global template
  question: string;
  answer: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFaq>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', default: null },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

faqSchema.index({ businessId: 1 });

export default mongoose.model<IFaq>('Faq', faqSchema);
