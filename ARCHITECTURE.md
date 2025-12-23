# B-Book Trading Engine Architecture

## Overview
Real-time market data + B-Book execution engine using MetaAPI (OctaFX MT5).

## Design Principles
- **Streaming-only**: No REST polling, use MetaAPI synchronization listeners
- **Single connection**: One MetaAPI StreamingConnection shared across all services
- **Event-driven**: Internal pub/sub between modules
- **In-memory**: No database, no persistence (for now)
- **B-Book only**: Trades are internal, NOT sent to broker

## Module Structure

```
src/lib/trading/
├── models.ts              # TypeScript interfaces (Instrument, Tick, Candle, Trade)
├── event-bus.ts           # Internal event emitter
├── price-stream.ts        # PriceStreamService: MetaAPI streaming connection
├── instrument-store.ts    # InstrumentStore: Latest bid/ask cache
├── candle-builder.ts      # CandleEngine: M1 candle aggregation from ticks
├── trade-engine.ts        # BBookTradeEngine: Internal trade execution + PnL
└── index.ts               # Public API + initialization
```

## Data Flow

```
MetaAPI Streaming Connection
         ↓
   (onSymbolPrice listener)
         ↓
    PriceStreamService
         ↓ emit('tick')
    EventBus
         ↓
    ┌────┴────┬────────────┐
    ↓         ↓            ↓
InstrumentStore  CandleEngine  BBookTradeEngine
(cache bid/ask)  (build M1)    (update PnL)
```

## Supported Instruments

### Forex (10)
- EURUSD, GBPUSD, USDJPY, USDCHF
- AUDUSD, NZDUSD, USDCAD
- GBPJPY, EURJPY, EURGBP

### Commodities (4)
- XAUUSD (Gold)
- XAGUSD (Silver)  
- XTIUSD (WTI Crude)
- XBRUSD (Brent Crude)

### Indices (4)
- US30 (Dow Jones)
- US500 (S&P 500)
- US100 (Nasdaq)
- DE40 (DAX)

### Crypto (2)
- BTCUSD (Bitcoin)
- ETHUSD (Ethereum)

**Total: 20 instruments**

## Key Services

### 1. PriceStreamService
- Connects to MetaAPI using StreamingConnection
- Subscribes to symbols dynamically
- Listens to `connection.addSynchronizationListener()` for price updates
- Emits `tick` events with bid/ask

### 2. CandleEngine
- Subscribes to `tick` events
- Builds M1 candles in real-time
- Closes candle on exact minute boundary
- Stores last 500 candles per symbol/timeframe in memory

### 3. InstrumentStore
- Subscribes to `tick` events (or price:update)
- Maintains latest bid/ask/spread/time per symbol
- O(1) lookup: `getInstrument(symbol)`

### 4. BBookTradeEngine
- Opens BUY/SELL trades at current bid/ask
- Subscribes to `tick` events to update PnL
- Auto-closes trades on SL/TP hit
- Does NOT send orders to broker (B-Book simulation)

## Environment Variables

```bash
METAAPI_TOKEN=<your_token>
METAAPI_ACCOUNT_ID=<your_account_id>
```

## No Public APIs Yet
This is internal core engine only. REST/WebSocket APIs will be added in Phase 2.

