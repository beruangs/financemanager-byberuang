import mongoose, { Schema, Model } from 'mongoose';

export interface ICustomCategory {
  _id: string;
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'expense' | 'income' | 'bill';
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomCategorySchema = new Schema<ICustomCategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: ['expense', 'income', 'bill'],
      required: true,
    },
    icon: {
      type: String,
      maxlength: 10,
    },
    color: {
      type: String,
      maxlength: 20,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for userId, name, and type to prevent duplicates
CustomCategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

const CustomCategory: Model<ICustomCategory> = 
  mongoose.models.CustomCategory || mongoose.model<ICustomCategory>('CustomCategory', CustomCategorySchema);

export default CustomCategory;
