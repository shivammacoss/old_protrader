import mongoose, { Schema, Document } from 'mongoose';

export interface IChallengeAccount extends Document {
  userId: mongoose.Types.ObjectId;
  challengeType: 'one_step' | 'two_step' | 'zero_step';
  profitTarget: number;
  accountSize: number;
  price: number;
  status: 'active' | 'passed' | 'failed' | 'expired';
  result: 'pending' | 'win' | 'lose';
  phase: number;
  accountNumber: string;
  platform: string;
  // Trading Stats
  startingBalance: number;
  currentBalance: number;
  targetBalance: number;
  targetProfit: number;
  currentProfit: number;
  currentProfitPercent: number;
  tradesCount: number;
  winningTrades: number;
  losingTrades: number;
  maxDrawdown: number;
  dailyLoss: number;
  // Dates
  startDate: Date;
  endDate: Date;
  completedDate: Date;
  createdAt: Date;
  // Trade monitoring
  lastTradeId: mongoose.Types.ObjectId;
  tradeHistory: {
    tradeId: mongoose.Types.ObjectId;
    symbol: string;
    type: string;
    openPrice: number;
    closePrice: number;
    profit: number;
    profitPercent: number;
    result: 'win' | 'lose';
    closedAt: Date;
  }[];
}

const ChallengeAccountSchema = new Schema<IChallengeAccount>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  challengeType: { type: String, enum: ['one_step', 'two_step', 'zero_step'], required: true },
  profitTarget: { type: Number, required: true },
  accountSize: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['active', 'passed', 'failed', 'expired'], default: 'active' },
  result: { type: String, enum: ['pending', 'win', 'lose'], default: 'pending' },
  phase: { type: Number, default: 1 },
  accountNumber: { type: String, required: true },
  platform: { type: String, default: 'MetaTrader 5' },
  // Trading Stats
  startingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  targetBalance: { type: Number, default: 0 },
  targetProfit: { type: Number, default: 0 },
  currentProfit: { type: Number, default: 0 },
  currentProfitPercent: { type: Number, default: 0 },
  tradesCount: { type: Number, default: 0 },
  winningTrades: { type: Number, default: 0 },
  losingTrades: { type: Number, default: 0 },
  maxDrawdown: { type: Number, default: 0 },
  dailyLoss: { type: Number, default: 0 },
  // Dates
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  completedDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  // Trade monitoring
  lastTradeId: { type: Schema.Types.ObjectId, ref: 'Trade' },
  tradeHistory: [{
    tradeId: { type: Schema.Types.ObjectId, ref: 'Trade' },
    symbol: String,
    type: String,
    openPrice: Number,
    closePrice: Number,
    profit: Number,
    profitPercent: Number,
    result: { type: String, enum: ['win', 'lose'] },
    closedAt: Date,
  }],
});

// Index for faster queries
ChallengeAccountSchema.index({ userId: 1, status: 1 });
ChallengeAccountSchema.index({ accountNumber: 1 }, { unique: true });

export default mongoose.models.ChallengeAccount || mongoose.model<IChallengeAccount>('ChallengeAccount', ChallengeAccountSchema);
