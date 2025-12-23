"use client";

import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/trading/Header";
import { Sidebar } from "@/components/trading/Sidebar";
import { InstrumentsPanel } from "@/components/trading/InstrumentsPanel";
import { OrderPanel } from "@/components/trading/OrderPanel";
import { OrdersTable } from "@/components/trading/OrdersTable";
import { ChartToolbar } from "@/components/trading/ChartToolbar";
import { TradingViewChart } from "@/components/trading/TradingViewChart";
import { PriceLines } from "@/components/trading/PriceOverlay";
import { MobileTopBar } from "@/components/trading/MobileTopBar";
import { MobileBottomNav, MobileTab } from "@/components/trading/MobileBottomNav";

const symbolMap: Record<string, string> = {
  XAUUSD: "OANDA:XAUUSD",
  BTCUSD: "BITSTAMP:BTCUSD",
  EURUSD: "FX:EURUSD",
  ETHUSD: "BITSTAMP:ETHUSD",
  USDJPY: "FX:USDJPY",
  GBPUSD: "FX:GBPUSD",
  NAS100: "PEPPERSTONE:NAS100",
  US30: "PEPPERSTONE:US30",
  US100: "PEPPERSTONE:NAS100",
  US500: "PEPPERSTONE:US500",
  GBPJPY: "FX:GBPJPY",
  XTIUSD: "TVC:USOIL",
  AUDUSD: "FX:AUDUSD",
  XAGUSD: "OANDA:XAGUSD",
  SOLUSD: "COINBASE:SOLUSD",
  NZDUSD: "FX:NZDUSD",
  USDCAD: "FX:USDCAD",
  USDCHF: "FX:USDCHF",
  EURJPY: "FX:EURJPY",
  EURGBP: "FX:EURGBP",
  LTCUSD: "COINBASE:LTCUSD",
  XRPUSD: "BITSTAMP:XRPUSD",
  DOGEUSD: "BINANCE:DOGEUSDT",
  XBRUSD: "TVC:UKOIL",
  DE40: "PEPPERSTONE:GER40",
};

export default function TradingDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("XAUUSD");
  const [timeframe, setTimeframe] = useState("M1");
  const [showInstruments, setShowInstruments] = useState(false);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [ordersExpanded, setOrdersExpanded] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("charts");
  const [priceData, setPriceData] = useState<{ bid: number; ask: number; change24h: number }>({ bid: 0, ask: 0, change24h: 0 });

  // Fetch live prices for the selected symbol
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`/api/trading/price?symbol=${encodeURIComponent(selectedSymbol)}`);
        const data = await res.json();
        if (data.success && data.data) {
          setPriceData({
            bid: data.data.bid,
            ask: data.data.ask,
            change24h: data.data.change24h || 0,
          });
        }
      } catch (e) {
        console.error('Failed to fetch price:', e);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 1000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const handleSelectSymbol = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setMobileTab("charts");
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Mobile Top Bar - only on mobile */}
      <div className="lg:hidden">
        <MobileTopBar onPlus={() => setShowOrderPanel(true)} />
      </div>

      {/* Desktop Header - only on desktop */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden pb-14 lg:pb-0">
        {/* Sidebar - hidden on mobile, shown on desktop */}
        <div className="hidden lg:block">
          <Sidebar onOpenInstruments={() => setShowInstruments(true)} />
        </div>

        {/* Mobile: Show instruments panel when Markets tab is active */}
        {mobileTab === "markets" && (
          <div className="lg:hidden flex-1 overflow-hidden">
            <InstrumentsPanel
              isOpen={true}
              onClose={() => setMobileTab("charts")}
              onSelectSymbol={handleSelectSymbol}
              selectedSymbol={selectedSymbol}
            />
          </div>
        )}

        {/* Mobile: Show order panel when Trade tab is active */}
        {mobileTab === "trade" && (
          <div className="lg:hidden flex-1 overflow-hidden">
            <OrderPanel
              isOpen={true}
              onClose={() => setMobileTab("charts")}
              symbol={selectedSymbol}
              bid={priceData.bid}
              ask={priceData.ask}
              onTradeCreated={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('tradeCreated'));
                }
                setMobileTab("history");
              }}
            />
          </div>
        )}

        {/* Mobile: Show orders/history when History tab is active */}
        {mobileTab === "history" && (
          <div className="lg:hidden flex-1 overflow-hidden">
            <OrdersTable
              isExpanded={true}
              onToggle={() => {}}
            />
          </div>
        )}

        {/* Mobile: Show chart when Charts tab is active */}
        {mobileTab === "charts" && (
          <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
            <ChartToolbar
              symbol={selectedSymbol}
              change={priceData.change24h}
              bid={priceData.bid}
              ask={priceData.ask}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              onNewOrder={() => setMobileTab("trade")}
            />
            <div className="flex-1 relative min-h-0 overflow-hidden">
              <TradingViewChart symbol={symbolMap[selectedSymbol] || selectedSymbol} interval={timeframe} />
              <PriceLines bid={priceData.bid} ask={priceData.ask} symbol={selectedSymbol} />
            </div>
            <OrdersTable
              isExpanded={ordersExpanded}
              onToggle={() => setOrdersExpanded(!ordersExpanded)}
            />
          </div>
        )}

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-1 overflow-hidden min-w-0">
          <InstrumentsPanel
            isOpen={showInstruments}
            onClose={() => setShowInstruments(false)}
            onSelectSymbol={handleSelectSymbol}
            selectedSymbol={selectedSymbol}
          />

          <div className={`flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300 ${showOrderPanel ? 'mr-[280px]' : ''}`}>
            <ChartToolbar
              symbol={selectedSymbol}
              change={priceData.change24h}
              bid={priceData.bid}
              ask={priceData.ask}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              onNewOrder={() => setShowOrderPanel(true)}
            />

            <div className="flex-1 relative min-h-0">
              <TradingViewChart symbol={symbolMap[selectedSymbol] || selectedSymbol} interval={timeframe} />
              <PriceLines bid={priceData.bid} ask={priceData.ask} symbol={selectedSymbol} />
            </div>

            <OrdersTable
              isExpanded={ordersExpanded}
              onToggle={() => setOrdersExpanded(!ordersExpanded)}
            />
          </div>

          <OrderPanel
            isOpen={showOrderPanel}
            onClose={() => setShowOrderPanel(false)}
            symbol={selectedSymbol}
            bid={priceData.bid}
            ask={priceData.ask}
            onTradeCreated={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('tradeCreated'));
              }
            }}
          />
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav active={mobileTab} onSelect={setMobileTab} />
    </div>
  );
}
