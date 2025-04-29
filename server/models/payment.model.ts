import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  merchantRequestID: string;
  checkoutRequestID: string;
  user: mongoose.Types.ObjectId;
  amount: number;
  phoneNumber: string;
  courses: mongoose.Types.ObjectId[];
  status: 'pending' | 'completed' | 'failed';
  mpesaReceiptNumber?: string;
  transactionDate?: Date;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  merchantRequestID: { type: String, required: true },
  checkoutRequestID: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  phoneNumber: { type: String, required: true },
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  mpesaReceiptNumber: { type: String },
  transactionDate: { type: Date },
  errorCode: { type: String },
  errorMessage: { type: String }
}, { timestamps: true });

export default mongoose.model<IPayment>('Payment', paymentSchema);