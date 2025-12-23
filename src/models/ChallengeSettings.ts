import mongoose, { Schema, Document } from 'mongoose';

export interface IChallengeSettings extends Document {
  // Challenge Type Prices
  challengeTypePrices: {
    one_step: number;
    two_step: number;
    zero_step: number;
  };
  // Account Size Base Prices
  accountSizePrices: {
    size: number;
    price: number;
  }[];
  // Profit Target Modifiers
  profitTargetModifiers: {
    target: number;
    modifier: number;
    isDefault: boolean;
  }[];
  // General Settings
  maxDailyLoss: number; // percentage
  maxTotalLoss: number; // percentage
  minTradingDays: number;
  tradingPeriodDays: number;
  updatedAt: Date;
  updatedBy: mongoose.Types.ObjectId;
}

const ChallengeSettingsSchema = new Schema<IChallengeSettings>({
  challengeTypePrices: {
    one_step: { type: Number, default: 0 },
    two_step: { type: Number, default: 0 },
    zero_step: { type: Number, default: 50 },
  },
  accountSizePrices: [{
    size: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  profitTargetModifiers: [{
    target: { type: Number, required: true },
    modifier: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
  }],
  maxDailyLoss: { type: Number, default: 5 },
  maxTotalLoss: { type: Number, default: 10 },
  minTradingDays: { type: Number, default: 5 },
  tradingPeriodDays: { type: Number, default: 30 },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

// Ensure only one settings document exists
ChallengeSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      challengeTypePrices: {
        one_step: 0,
        two_step: 0,
        zero_step: 50,
      },
      accountSizePrices: [
        { size: 5000, price: 49 },
        { size: 10000, price: 99 },
        { size: 25000, price: 199 },
        { size: 50000, price: 299 },
        { size: 100000, price: 529 },
      ],
      profitTargetModifiers: [
        { target: 8, modifier: 0, isDefault: true },
        { target: 10, modifier: -40, isDefault: false },
        { target: 20, modifier: -80, isDefault: false },
        { target: 50, modifier: -150, isDefault: false },
      ],
    });
  }
  return settings;
};

export default mongoose.models.ChallengeSettings || mongoose.model<IChallengeSettings>('ChallengeSettings', ChallengeSettingsSchema);
