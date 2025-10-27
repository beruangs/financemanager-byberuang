import { Schema, model, models } from 'mongoose';

export interface ILoginHistory {
  _id?: string;
  userId: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  loginTime: Date;
  logoutTime?: Date;
  isActive: boolean;
}

const LoginHistorySchema = new Schema<ILoginHistory>(
  {
    userId: { type: String, required: true, index: true },
    device: { type: String, default: 'Unknown' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    ip: { type: String, default: '0.0.0.0' },
    loginTime: { type: Date, default: () => new Date() },
    logoutTime: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.LoginHistory || model('LoginHistory', LoginHistorySchema);
