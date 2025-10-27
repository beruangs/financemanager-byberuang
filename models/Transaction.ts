import mongoose, { Schema, Model } from 'mongoose';

export type TransactionType = 'income' | 'expense' | 'bill';

export interface ITransaction {
  _id: string;
  userId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  type: TransactionType;
  category: string;
  amount: number;
  description?: string;
  date: Date;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'bill'],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ walletId: 1 });

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
