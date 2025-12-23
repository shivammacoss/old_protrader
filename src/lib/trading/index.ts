/**
 * Trading Engine - Core Exports
 * 
 * This is the INTERNAL CORE ENGINE.
 * Import this module to access all trading engine components.
 * 
 * Data Flow:
 * 1. priceStream (MetaAPI) → emits price/tick events → eventBus
 * 2. instrumentStore subscribes → caches bid/ask
 * 3. candleBuilder subscribes → aggregates candles
 * 4. tradeEngine subscribes → updates PnL, checks SL/TP
 */

// Core Models
export * from './models';

// Event Bus
export { eventBus } from './event-bus';

// Price Stream Engine (MetaAPI)
export { priceStream } from './price-stream';

// Instrument State Store (In-Memory Cache)
export { instrumentStore } from './instrument-store';

// Candle Builder (OHLC Aggregator)
export { candleBuilder } from './candle-builder';

// B-Book Trade Engine
export { tradeEngine } from './trade-engine';

/**
 * Initialize the entire trading engine
 * Call this once on server startup
 */
export async function initializeTradingEngine(): Promise<void> {
  console.log('[TradingEngine] Initializing...');
  
  // Price stream will auto-initialize on import
  // Other components subscribe to events automatically
  
  console.log('[TradingEngine] ✅ All components initialized');
}

