import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  category: 'clinic'|'retail'|'restaurant'|'salon'|'general';
  description?: string;
  messageTemplates: Record<string, { en?: string; hi?: string }>;
  aiConfig?: {
    systemPrompt?: string;
    examples?: Array<{ input: string; output: string }>;
  };
  workflows?: Array<any>;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>({
  name: { type: String, required: true },
  category: { type: String, enum: ['clinic','retail','restaurant','salon','general'], default: 'general' },
  description: { type: String },
  messageTemplates: { type: Schema.Types.Mixed, default: {} },
  aiConfig: { type: Schema.Types.Mixed, default: {} },
  workflows: { type: [Schema.Types.Mixed], default: [] }
}, { timestamps: true });

export default mongoose.model<ITemplate>('Template', templateSchema);
