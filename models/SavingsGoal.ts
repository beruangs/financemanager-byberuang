import mongoose, { Schema, Model } from 'mongoose';

export interface ISavingsGoal {
  _id: string;
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a goal name'],
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
    },
    icon: {
      type: String,
      default: 'target',
    },
    color: {
      type: String,
      default: '#10b981',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
SavingsGoalSchema.index({ userId: 1 });

const SavingsGoal: Model<ISavingsGoal> = mongoose.models.SavingsGoal || mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema);

export default SavingsGoal;
