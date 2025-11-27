import mongoose, { Document, Schema } from 'mongoose';

export interface IBusiness extends Document {
  category?: 'clinic'|'retail'|'restaurant'|'salon'|'general';
  name: string;
  whatsappNumber: string;
  industry: string;
  languages: ('hindi' | 'english' | 'hinglish')[];
  businessHours: {
    start: string;
    end: string;
  };
  aiConfig: {
    model: string;
    temperature: number;
    systemPrompt: string;
    autoReply?: boolean;
    tone?: 'concise' | 'friendly' | 'formal';
  };
  subscription: {
    plan: 'free' | 'basic' | 'pro';
    expiresAt: Date;
  };
  isActive: boolean;
  // The selected template id and per-business overrides
  templateConfig?: {
    templateId?: string;
    messageOverrides?: Record<string, { en?: string; hi?: string }>;
    aiPromptOverrides?: string;
    workflowOverrides?: any[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>({
  name: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  // Category / template support
  category: {
    type: String,
    enum: ['clinic', 'retail', 'restaurant', 'salon', 'general'],
    default: 'general'
  },
  whatsappNumber: {
    type: String,
    required: [true, 'WhatsApp number is required'],
    trim: true
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  languages: {
    type: [String],
    enum: ['hindi', 'english', 'hinglish'],
    default: ['english', 'hindi']
  },
  businessHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '21:00'
    }
  },
  aiConfig: {
    model: {
      type: String,
      default: 'gpt-4'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1
    },
    // whether the bot should automatically reply to incoming messages
    autoReply: {
      type: Boolean,
      default: true
    },
    // tone can be 'concise' | 'friendly' | 'formal'
    tone: {
      type: String,
      enum: ['concise', 'friendly', 'formal'],
      default: 'friendly'
    },
    systemPrompt: {
      type: String,
      default: 'You are a helpful customer service assistant.'
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro'],
      default: 'free'
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  },
  templateConfig: {
    templateId: { type: Schema.Types.ObjectId, ref: 'Template' },
    messageOverrides: { type: Schema.Types.Mixed, default: {} },
    aiPromptOverrides: { type: String },
    workflowOverrides: { type: [Schema.Types.Mixed], default: [] },
    aiSettings: { type: Schema.Types.Mixed, default: {} }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IBusiness>('Business', businessSchema);
