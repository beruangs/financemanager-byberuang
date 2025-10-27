import mongoose, { Schema, Model } from 'mongoose';

export type WalletType = 'cash' | 'bank' | 'e-wallet';

export interface IWallet {
  _id: string;
  userId: mongoose.Types.ObjectId;
  name: string;
  type: WalletType;
  balance: number;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a wallet name'],
      maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    type: {
      type: String,
      enum: ['cash', 'bank', 'e-wallet'],
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    icon: {
      type: String,
      default: 'wallet',
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
WalletSchema.index({ userId: 1 });

const Wallet: Model<IWallet> = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);

export default Wallet;
