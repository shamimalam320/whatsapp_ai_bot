import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  businessId: mongoose.Types.ObjectId;
  customerPhone: string;
  customerName?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  messages: Array<{
    sender: 'customer' | 'business';
    text: string;
    timestamp: Date;
    messageId?: string;
    status?: string;
    mediaUrl?: string;
    mediaType?: string;
  }>;
  status: 'active' | 'pending' | 'closed';
  platform: 'whatsapp' | 'telegram' | 'sms';
  leadScore?: number;
  tags?: string[];
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>({
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerName: {
    type: String,
    trim: true
  },
  lastMessage: {
    type: String
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  messages: [{
    sender: {
      type: String,
      enum: ['customer', 'business'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageId: {
      type: String
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed', 'received'],
      default: 'sent'
    },
    mediaUrl: {
      type: String
    },
    mediaType: {
      type: String
    }
  }],
  status: {
    type: String,
    enum: ['active', 'pending', 'closed'],
    default: 'active'
  },
  platform: {
    type: String,
    enum: ['whatsapp', 'telegram', 'sms'],
    default: 'whatsapp'
  },
  leadScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tags: {
    type: [String],
    default: []
  },
  unreadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatSchema.index({ businessId: 1, customerPhone: 1 });
chatSchema.index({ businessId: 1, status: 1, updatedAt: -1 });
chatSchema.index({ businessId: 1, lastMessageAt: -1 });

export default mongoose.model<IChat>('Chat', chatSchema);
