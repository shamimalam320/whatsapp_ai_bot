import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  businessId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  customerPhone: string;
  customerName: string;
  appointmentDate: Date;
  service: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reminderSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
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
    required: true,
    trim: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  service: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
appointmentSchema.index({ businessId: 1, appointmentDate: 1 });
appointmentSchema.index({ businessId: 1, status: 1 });

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);
