import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  businessId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  customerPhone: string;
  customerName?: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  deliveryAddress?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>({
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
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
  items: [{
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    size: { type: String },
    color: { type: String },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  deliveryAddress: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
orderSchema.index({ businessId: 1, status: 1, createdAt: -1 });
orderSchema.index({ customerPhone: 1 });

export default mongoose.model<IOrder>('Order', orderSchema);
