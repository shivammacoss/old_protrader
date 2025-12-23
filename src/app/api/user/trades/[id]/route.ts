import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connect } from '@/db/dbConfig';
import Trade from '@/models/Trade';
import Wallet from '@/models/Wallet';
import { calculateRealizedPnL, getContractSize } from '@/lib/trading/calculations';
import { priceFeed } from '@/lib/trading/price-feed';
import mongoose from 'mongoose';

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

// PUT - Close trade (full or partial) with REAL prices
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connect();
    const { id } = await params;
    const body = await request.json();
    const { closeLot } = body; // Optional: for partial close

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid trade ID' },
        { status: 400 }
      );
    }

    const trade = await Trade.findById(id);

    if (!trade) {
      return NextResponse.json(
        { success: false, message: 'Trade not found' },
        { status: 404 }
      );
    }

    if (trade.userId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (trade.status === 'closed') {
      return NextResponse.json(
        { success: false, message: 'Trade is already closed' },
        { status: 400 }
      );
    }

    // Initialize price feed
    try {
      await priceFeed.initialize();
    } catch (e) {
      // Continue with fallback prices
    }

    // Get REAL prices from MetaAPI
    const prices = await getPrice(trade.symbol);
    const closePrice = trade.side === 'BUY' ? prices.bid : prices.ask;

    // Determine lot to close
    const remainingLot = trade.lot - (trade.closedLot || 0);
    const lotToClose = closeLot && closeLot < remainingLot ? closeLot : remainingLot;
    const isPartialClose = lotToClose < remainingLot;

    if (lotToClose <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid lot size to close' },
        { status: 400 }
      );
    }

    // Calculate realized PnL with real close price
    const contractSize = getContractSize(trade.symbol);
    const realizedPnL = calculateRealizedPnL(
      trade.side,
      trade.entryPrice,
      closePrice,
      lotToClose,
      contractSize
    );

    // Update wallet balance
    const wallet = await Wallet.findOne({ userId: session.userId });
    if (wallet) {
      wallet.balance += realizedPnL;
      wallet.equity += realizedPnL;
      await wallet.save();
    }

    // Update trade
    const newRealizedPnL = (trade.realizedPnL || 0) + realizedPnL;
    const newClosedLot = (trade.closedLot || 0) + lotToClose;

    // Determine trading session
    const closeTime = new Date();
    const hour = closeTime.getUTCHours();
    let tradingSession: 'New York' | 'London' | 'Tokyo' | 'Sydney' | 'Other' = 'Other';
    if (hour >= 8 && hour < 16) tradingSession = 'London';
    else if (hour >= 13 && hour < 21) tradingSession = 'New York';
    else if (hour >= 0 && hour < 8) tradingSession = 'Tokyo';
    else if (hour >= 21 || hour < 2) tradingSession = 'Sydney';

    if (isPartialClose) {
      trade.status = 'partial';
      trade.closedLot = newClosedLot;
      trade.realizedPnL = newRealizedPnL;
      trade.closePrice = closePrice;
    } else {
      trade.status = 'closed';
      trade.closedLot = trade.lot;
      trade.realizedPnL = newRealizedPnL;
      trade.closePrice = closePrice;
      trade.closedAt = closeTime;
      trade.session = tradingSession;
    }

    await trade.save();

    return NextResponse.json({
      success: true,
      message: isPartialClose 
        ? `Partial close: ${lotToClose} lots @ ${closePrice.toFixed(5)}`
        : `Trade closed @ ${closePrice.toFixed(5)}`,
      trade,
      realizedPnL: parseFloat(realizedPnL.toFixed(2)),
      closePrice,
    });
  } catch (error: any) {
    console.error('Error closing trade:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to close trade' },
      { status: 500 }
    );
  }
}

// DELETE - Delete trade (for admin cleanup only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !session.role || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await connect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid trade ID' },
        { status: 400 }
      );
    }

    const trade = await Trade.findByIdAndDelete(id);

    if (!trade) {
      return NextResponse.json(
        { success: false, message: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Trade deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete trade' },
      { status: 500 }
    );
  }
}
