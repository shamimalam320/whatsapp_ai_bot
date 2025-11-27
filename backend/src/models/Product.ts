import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  nameHindi?: string;
  description: string;
  descriptionHindi?: string;
  price: number;
  category: string;
  images: string[];
  inStock: boolean;
  stock?: number;
  isActive: boolean;
  variants: Array<{
    name: string;
    price: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  nameHindi: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  descriptionHindi: {
    type: String
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  images: {
    type: [String],
    default: []
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  variants: [{
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }]
}, {
  timestamps: true
});

// Index for search
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ businessId: 1, category: 1 });

export default mongoose.model<IProduct>('Product', productSchema);
