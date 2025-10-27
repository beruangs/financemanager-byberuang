import mongoose, { Schema, Model } from 'mongoose';

export interface IBudgetAllocation {
  category: string;
  amount: number;
  spent: number;
  description?: string;
}

export interface IBudget {
  _id: string;
  userId: mongoose.Types.ObjectId;
  month: string; // Format: YYYY-MM
  totalBudget: number;
  allocations: IBudgetAllocation[];
  createdAt: Date;
  updatedAt: Date;
}

const BudgetAllocationSchema = new Schema<IBudgetAllocation>(
  {
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      maxlength: 200,
    },
  },
  { _id: false }
);

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    totalBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    allocations: [BudgetAllocationSchema],
  },
  {
    timestamps: true,
  }
);

// Create compound index for userId and month
BudgetSchema.index({ userId: 1, month: 1 }, { unique: true });

const Budget: Model<IBudget> = mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);

export default Budget;
