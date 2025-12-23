import { NextRequest, NextResponse } from 'next/server';
import { priceFeed, ALL_SYMBOLS } from '@/lib/trading/price-feed';

// GET - Get real-time price for a single symbol from MetaAPI
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({
        success: false,
        message: 'Symbol is required',
      }, { status: 400 });
    }

    // Get price from cache or fetch from MetaAPI
    const price = await priceFeed.getPriceAsync(symbol);

    if (!price) {
      return NextResponse.json({
        success: false,
        message: `Price not available for ${symbol}`,
      }, { status: 404 });
    }

    // Get instrument metadata
    const instrument = ALL_SYMBOLS.find(i => i.symbol === symbol);

    return NextResponse.json({
      success: true,
      data: {
        ...price,
        name: instrument?.name || symbol,
        icon: instrument?.icon || '📊',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Price error:', error.message);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to get price',
    }, { status: 500 });
  }
}
