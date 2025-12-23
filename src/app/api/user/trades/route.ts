import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connect } from '@/db/dbConfig';
import Trade from '@/models/Trade';
import Wallet from '@/models/Wallet';
import Account from '@/models/Account';
import AccountType from '@/models/AccountType';
import { calculateFloatingPnL, getContractSize } from '@/lib/trading/calculations';
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
async function getPrice(symbol: string): Promise<{ bid: number; ask: number } | null> {
  try {
    // Try to get live price from MetaAPI
    await priceFeed.subscribe(symbol);
    const price = priceFeed.getPrice(symbol);
    if (price && price.bid && price.ask) {
      return { bid: price.bid, ask: price.ask };
    }
  } catch (e) {
    // MetaAPI not available, use fallback
  }
  
  // Return fallback price
  return fallbackPrices[symbol] || null;
}

// GET - Fetch user trades with real-time P&L
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';

    const query: any = { userId: session.userId };
    if (status === 'open') {
      query.status = 'open';
    } else if (status === 'closed') {
      query.status = { $in: ['closed', 'partial'] };
    }

    const trades = await Trade.find(query).sort({ openedAt: -1 }).lean();

    // Initialize price feed
    try {
      await priceFeed.initialize();
    } catch (e) {
      // Continue with fallback prices
    }

    // Update floating PnL with current real-time prices
    const updatedTrades = await Promise.all(trades.map(async (trade: any) => {
      const prices = await getPrice(trade.symbol);
      if (!prices) {
        return {
          ...trade,
          floatingPnL: trade.floatingPnL || 0,
        };
      }

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

      return {
        ...trade,
        currentPrice: trade.side === 'BUY' ? prices.bid : prices.ask,
        floatingPnL: parseFloat(floatingPnL.toFixed(2)),
      };
    }));

    return NextResponse.json({
      success: true,
      trades: updatedTrades,
    });
  } catch (error: any) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

// POST - Create new trade (B-Book - internal execution with real prices)
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connect();
    
    // Check if user is read-only (can't trade)
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ userId: session.userId });
    if (user?.isReadOnly) {
      return NextResponse.json(
        { success: false, message: 'Your account is in read-only mode. Trading is disabled.' },
        { status: 403 }
      );
    }
    if (user?.isBanned) {
      return NextResponse.json(
        { success: false, message: 'Your account has been banned.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { symbol, side, lot, stopLoss, takeProfit } = body;

    if (!symbol || !side || !lot) {
      return NextResponse.json(
        { success: false, message: 'Symbol, side, and lot are required' },
        { status: 400 }
      );
    }

    if (!['BUY', 'SELL'].includes(side)) {
      return NextResponse.json(
        { success: false, message: 'Side must be BUY or SELL' },
        { status: 400 }
      );
    }

    if (lot < 0.01) {
      return NextResponse.json(
        { success: false, message: 'Lot size must be at least 0.01' },
        { status: 400 }
      );
    }

    // Get REAL prices from MetaAPI
    const prices = await getPrice(symbol);
    if (!prices || !prices.bid || !prices.ask) {
      return NextResponse.json(
        { success: false, message: 'Price not available for this symbol' },
        { status: 400 }
      );
    }

    // Entry price: BUY uses Ask, SELL uses Bid (same as real market)
    const entryPrice = side === 'BUY' ? prices.ask : prices.bid;

    // Calculate margin
    const contractSize = getContractSize(symbol);
    const leverage = 100; // Default leverage
    const margin = (lot * contractSize * entryPrice) / leverage;

    // Check wallet balance
    const wallet = await Wallet.findOne({ userId: session.userId });
    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Get active trading account to determine account type and trade charges
    const activeAccount = await Account.findOne({ 
      userId: session.userId, 
      accountType: 'trading',
      status: 'active'
    }).populate('accountTypeId');

    let tradeCharges = 0;
    if (activeAccount && (activeAccount as any).accountTypeId) {
      const accountType = (activeAccount as any).accountTypeId;
      tradeCharges = accountType.tradeCharges || accountType.brokerage || 0;
    }

    // Calculate total margin used by all open trades
    const openTrades = await Trade.find({ userId: session.userId, status: 'open' }).lean();
    const totalMarginUsed = openTrades.reduce((sum, trade: any) => sum + (trade.margin || 0), 0);

    // Check if user has enough free margin (including trade charges)
    const freeMargin = wallet.equity - totalMarginUsed;
    const totalRequired = margin + tradeCharges;
    if (totalRequired > freeMargin) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Insufficient margin. Required: $${totalRequired.toFixed(2)} (Margin: $${margin.toFixed(2)} + Charges: $${tradeCharges.toFixed(2)}), Available: $${freeMargin.toFixed(2)}` 
        },
        { status: 400 }
      );
    }

    // Deduct trade charges from wallet
    if (tradeCharges > 0) {
      wallet.balance -= tradeCharges;
      wallet.equity -= tradeCharges;
      wallet.freeMargin -= tradeCharges;
      await wallet.save();
    }

    // Create trade in our internal system (B-Book)
    const trade = new Trade({
      userId: session.userId,
      symbol,
      side,
      lot,
      entryPrice,
      currentPrice: entryPrice,
      stopLoss: stopLoss || undefined,
      takeProfit: takeProfit || undefined,
      status: 'open',
      floatingPnL: 0,
      realizedPnL: 0,
      margin,
      leverage,
      contractSize,
    });

    await trade.save();

    return NextResponse.json({
      success: true,
      message: `Trade opened: ${side} ${lot} ${symbol} @ ${entryPrice.toFixed(5)}`,
      trade,
      executionPrice: entryPrice,
    });
  } catch (error: any) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create trade' },
      { status: 500 }
    );
  }
}
