import { NextResponse } from 'next/server';
import { connect } from '@/db/dbConfig';
import Trade from '@/models/Trade';
import Wallet from '@/models/Wallet';
import { shouldTriggerSLTP, calculateRealizedPnL, getContractSize } from '@/lib/trading/calculations';
import { priceFeed } from '@/lib/trading/price-feed';

// Fallback prices if MetaAPI is not available
const fallbackPrices: Record<string, { bid: number; ask: number }> = {
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

// Get real-time price from MetaAPI or fallback
async function getPrice(symbol: string): Promise<{ bid: number; ask: number }> {
  try {
    await priceFeed.subscribe(symbol);
    const price = priceFeed.getPrice(symbol);
    if (price && price.bid && price.ask) {
      return { bid: price.bid, ask: price.ask };
    }
  } catch (e) {
    // MetaAPI not available
  }
  return fallbackPrices[symbol] || { bid: 0, ask: 0 };
}

// POST - Check and execute SL/TP for all open trades with REAL prices
export async function POST(request: Request) {
  try {
    await connect();

    // Initialize price feed
    try {
      await priceFeed.initialize();
    } catch (e) {
      // Continue with fallback prices
    }

    const openTrades = await Trade.find({ status: 'open' }).lean();
    const closedTrades: any[] = [];

    for (const trade of openTrades) {
      // Get REAL price from MetaAPI
      const prices = await getPrice(trade.symbol);
      if (!prices.bid || !prices.ask) continue;
      
      const checkResult = shouldTriggerSLTP(
        trade.side,
        prices.bid,
        prices.ask,
        trade.stopLoss,
        trade.takeProfit
      );

      if (checkResult.triggered) {
        const remainingLot = trade.lot - (trade.closedLot || 0);
        const contractSize = getContractSize(trade.symbol);
        
        const realizedPnL = calculateRealizedPnL(
          trade.side,
          trade.entryPrice,
          checkResult.closePrice,
          remainingLot,
          contractSize
        );

        // Determine trading session
        const closeTime = new Date();
        const hour = closeTime.getUTCHours();
        let session: 'New York' | 'London' | 'Tokyo' | 'Sydney' | 'Other' = 'Other';
        if (hour >= 8 && hour < 16) session = 'London';
        else if (hour >= 13 && hour < 21) session = 'New York';
        else if (hour >= 0 && hour < 8) session = 'Tokyo';
        else if (hour >= 21 || hour < 2) session = 'Sydney';

        // Update wallet balance
        const wallet = await Wallet.findOne({ userId: trade.userId });
        if (wallet) {
          wallet.balance += realizedPnL;
          wallet.equity += realizedPnL;
          await wallet.save();
        }

        // Close trade
        const updatedTrade = await Trade.findByIdAndUpdate(
          trade._id,
          {
            status: 'closed',
            closePrice: checkResult.closePrice,
            closedLot: trade.lot,
            realizedPnL: (trade.realizedPnL || 0) + realizedPnL,
            closedAt: closeTime,
            session,
          },
          { new: true }
        );

        closedTrades.push({
          tradeId: trade._id,
          symbol: trade.symbol,
          reason: checkResult.reason,
          realizedPnL: parseFloat(realizedPnL.toFixed(2)),
          closePrice: checkResult.closePrice,
        });
      }
    }

    return NextResponse.json({
      success: true,
      closedTrades,
      message: closedTrades.length > 0 
        ? `${closedTrades.length} trade(s) closed by ${closedTrades.map(t => t.reason).join(', ')}`
        : 'No trades triggered',
    });
  } catch (error: any) {
    console.error('Error checking SL/TP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check SL/TP' },
      { status: 500 }
    );
  }
}
