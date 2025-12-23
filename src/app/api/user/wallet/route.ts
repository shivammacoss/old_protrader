import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connect } from '@/db/dbConfig';
import Wallet from '@/models/Wallet';
import Trade from '@/models/Trade';
import { calculateFloatingPnL, getContractSize } from '@/lib/trading/calculations';

// Mock price data
const mockPrices: Record<string, { bid: number; ask: number }> = {
  XAUUSD: { bid: 4286.70, ask: 4287.12 },
  BTCUSD: { bid: 86204.00, ask: 86239.00 },
  EURUSD: { bid: 1.17505, ask: 1.17517 },
  ETHUSD: { bid: 2933.17, ask: 2936.19 },
  USDJPY: { bid: 154.842, ask: 154.866 },
  GBPUSD: { bid: 1.33614, ask: 1.33631 },
  NAS100: { bid: 24907.8, ask: 24910.7 },
  US30: { bid: 48348.3, ask: 48353.8 },
  GBPJPY: { bid: 206.907, ask: 206.937 },
  XTIUSD: { bid: 56.20, ask: 56.28 },
  AUDUSD: { bid: 0.66331, ask: 0.66350 },
  XAGUSD: { bid: 31.245, ask: 31.267 },
  SOLUSD: { bid: 145.32, ask: 145.78 },
  NZDUSD: { bid: 0.59112, ask: 0.59130 },
  USDCAD: { bid: 1.38542, ask: 1.38560 },
};

// GET - Fetch wallet with updated equity
export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connect();

    let wallet = await Wallet.findOne({ userId: session.userId });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = new Wallet({
        userId: session.userId,
        balance: 0,
        equity: 0,
        margin: 0,
        freeMargin: 0,
        marginLevel: 0,
        floatingProfit: 0,
      });
      await wallet.save();
    }

    // Calculate floating PnL from open trades
    const openTrades = await Trade.find({ userId: session.userId, status: 'open' }).lean();
    let totalFloatingPnL = 0;
    let totalMarginUsed = 0;

    for (const trade of openTrades) {
      const prices = mockPrices[trade.symbol] || { bid: trade.currentPrice, ask: trade.currentPrice };
      const contractSize = getContractSize(trade.symbol);
      const remainingLot = trade.lot - (trade.closedLot || 0);
      
      const floatingPnL = calculateFloatingPnL(
        trade.side,
        trade.entryPrice,
        prices.bid,
        prices.ask,
        remainingLot,
        contractSize
      );

      totalFloatingPnL += floatingPnL;
      totalMarginUsed += trade.margin || 0;
    }

    // Update wallet equity
    wallet.equity = wallet.balance + totalFloatingPnL;
    wallet.floatingProfit = totalFloatingPnL;
    wallet.margin = totalMarginUsed;
    wallet.freeMargin = wallet.equity - totalMarginUsed;
    wallet.marginLevel = totalMarginUsed > 0 ? (wallet.equity / totalMarginUsed) * 100 : 0;

    await wallet.save();

    return NextResponse.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        equity: parseFloat(wallet.equity.toFixed(2)),
        margin: parseFloat(wallet.margin.toFixed(2)),
        freeMargin: parseFloat(wallet.freeMargin.toFixed(2)),
        marginLevel: parseFloat(wallet.marginLevel.toFixed(2)),
        floatingProfit: parseFloat(wallet.floatingProfit.toFixed(2)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}
