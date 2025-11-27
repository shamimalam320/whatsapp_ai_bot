import mongoose, { Document, Schema } from 'mongoose';

export interface IFaq extends Document {
  businessId: mongoose.Types.ObjectId | null; // null = global template
  category?: string; // category tab
  question: string;
  answer: { en?: string; hi?: string };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFaq>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', default: null },
  category: { type: String, default: 'general' },
  question: { type: String, required: true },
  answer: { type: Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

faqSchema.index({ businessId: 1, category: 1 });

export default mongoose.model<IFaq>('Faq', faqSchema);
