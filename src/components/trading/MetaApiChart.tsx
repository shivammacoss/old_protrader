"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface MetaApiChartProps {
  symbol: string;
  interval: string;
  onQuickTrade?: (side: 'BUY' | 'SELL', price: number) => void;
}

interface PriceData {
  bid: number;
  ask: number;
  time: number;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function MetaApiChart({ symbol, interval, onQuickTrade }: MetaApiChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const lastCandleRef = useRef<CandleData | null>(null);

  const getIntervalMs = useCallback((tf: string): number => {
    const intervals: Record<string, number> = {
      "M1": 60 * 1000,
      "M5": 5 * 60 * 1000,
      "M15": 15 * 60 * 1000,
      "M30": 30 * 60 * 1000,
      "H1": 60 * 60 * 1000,
      "H4": 4 * 60 * 60 * 1000,
      "D1": 24 * 60 * 60 * 1000,
    };
    return intervals[tf] || 60 * 1000;
  }, []);

  const getCandleTime = useCallback((timestamp: number, intervalMs: number): number => {
    return Math.floor(timestamp / intervalMs) * intervalMs;
  }, []);

  const getDecimalPlaces = useCallback((sym: string): number => {
    if (sym.includes("JPY")) return 3;
    if (sym.includes("XAU") || sym.includes("GOLD")) return 2;
    if (sym.includes("BTC") || sym.includes("ETH")) return 2;
    if (sym.includes("US30") || sym.includes("US500") || sym.includes("US100") || sym.includes("NAS") || sym.includes("DE40")) return 1;
    return 5;
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize chart with dynamic import
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const initChart = async () => {
      try {
        const LightweightCharts = await import("lightweight-charts");
        
        if (!containerRef.current) return;

        const isDark = theme === "dark";
        
        const chart = LightweightCharts.createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
          layout: {
            background: { color: isDark ? "#0f0f14" : "#ffffff" },
            textColor: isDark ? "#9ca3af" : "#6b7280",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 11,
          },
          grid: {
            vertLines: { color: isDark ? "#1a1a2e" : "#f3f4f6", style: 1 },
            horzLines: { color: isDark ? "#1a1a2e" : "#f3f4f6", style: 1 },
          },
          crosshair: {
            mode: 1,
            vertLine: {
              color: isDark ? "#6366f1" : "#8b5cf6",
              width: 1,
              style: 2,
              labelBackgroundColor: isDark ? "#6366f1" : "#8b5cf6",
            },
            horzLine: {
              color: isDark ? "#6366f1" : "#8b5cf6",
              width: 1,
              style: 2,
              labelBackgroundColor: isDark ? "#6366f1" : "#8b5cf6",
            },
          },
          rightPriceScale: {
            borderColor: isDark ? "#2a2a3a" : "#e5e7eb",
            scaleMargins: { top: 0.05, bottom: 0.15 },
            borderVisible: true,
            autoScale: true,
          },
          timeScale: {
            borderColor: isDark ? "#2a2a3a" : "#e5e7eb",
            timeVisible: true,
            secondsVisible: false,
            borderVisible: true,
            fixLeftEdge: false,
            fixRightEdge: false,
            rightOffset: 3,
            barSpacing: 6,
            minBarSpacing: 1,
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: false,
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
        });

        // Candlestick series with professional colors
        const candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
          priceFormat: {
            type: "price",
            precision: getDecimalPlaces(symbol),
            minMove: Math.pow(10, -getDecimalPlaces(symbol)),
          },
        });

        // Volume histogram
        const volumeSeries = chart.addSeries(LightweightCharts.HistogramSeries, {
          color: isDark ? "#3b82f680" : "#3b82f640",
          priceFormat: { type: "volume" },
          priceScaleId: "",
        });
        volumeSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;
        setChartReady(true);
      } catch (err) {
        console.error("Failed to initialize chart:", err);
      }
    };

    initChart();

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
        setChartReady(false);
      }
    };
  }, [mounted, theme, symbol, getDecimalPlaces]);

  // Fetch historical data when chart is ready or symbol/interval changes
  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current) return;

    let isActive = true;
    setLoading(true);

    const fetchHistoricalData = async () => {
      try {
        const res = await fetch(
          `/api/trading/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${interval}&limit=500`
        );
        const data = await res.json();

        if (!isActive) return;

        if (data.success && data.data && data.data.length > 0) {
          // Set candle data
          candleSeriesRef.current.setData(data.data);

          // Set volume data with colors based on candle direction
          if (volumeSeriesRef.current) {
            const volumeData = data.data.map((candle: any, i: number) => ({
              time: candle.time,
              value: candle.volume || 0,
              color: candle.close >= candle.open ? "#22c55e40" : "#ef444440",
            }));
            volumeSeriesRef.current.setData(volumeData);
          }

          // Store last candle for updates
          const lastCandle = data.data[data.data.length - 1];
          lastCandleRef.current = lastCandle;

          // Fit content to view
          chartRef.current?.timeScale().fitContent();
        }
      } catch (error) {
        console.error("Error fetching historical data:", error);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchHistoricalData();

    return () => {
      isActive = false;
    };
  }, [chartReady, symbol, interval]);

  // Update with live price data
  useEffect(() => {
    if (!mounted || !chartReady || !candleSeriesRef.current) return;

    const intervalMs = getIntervalMs(interval);
    let isActive = true;

    const fetchPrice = async () => {
      if (!candleSeriesRef.current) return;
      
      try {
        const res = await fetch(`/api/trading/price?symbol=${encodeURIComponent(symbol)}`);
        const data = await res.json();
        
        if (!isActive || !data.success || !data.data) return;

        const price = (data.data.bid + data.data.ask) / 2;
        const now = Date.now();
        const candleTime = getCandleTime(now, intervalMs) / 1000; // Unix seconds

        setCurrentPrice({
          bid: data.data.bid,
          ask: data.data.ask,
          time: now,
        });

        // Update or create current candle
        const lastCandle = lastCandleRef.current;
        
        if (lastCandle && lastCandle.time === candleTime) {
          // Update existing candle
          lastCandle.high = Math.max(lastCandle.high, price);
          lastCandle.low = Math.min(lastCandle.low, price);
          lastCandle.close = price;
          
          candleSeriesRef.current.update(lastCandle);
        } else {
          // New candle
          const newCandle: CandleData = {
            time: candleTime,
            open: price,
            high: price,
            low: price,
            close: price,
          };
          lastCandleRef.current = newCandle;
          candleSeriesRef.current.update(newCandle);
        }
      } catch (error) {
        console.error("Error fetching price:", error);
      }
    };

    fetchPrice();
    const pollInterval = setInterval(fetchPrice, 500);

    return () => {
      isActive = false;
      clearInterval(pollInterval);
    };
  }, [mounted, chartReady, symbol, interval, getIntervalMs, getCandleTime]);

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const decimals = getDecimalPlaces(symbol);

  return (
    <div className="relative h-full w-full min-h-[300px]">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading chart...</span>
          </div>
        </div>
      )}

      {/* Price display overlay with quick trade buttons */}
      {currentPrice && !loading && (
        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
          {/* Left: Symbol and Prices */}
          <div className="bg-background/95 backdrop-blur-sm rounded-lg px-4 py-2 border border-border shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{symbol}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{interval}</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-muted-foreground">B:</span>
                <span className="text-red-500 font-mono font-bold text-base">{currentPrice.bid.toFixed(decimals)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-muted-foreground">A:</span>
                <span className="text-green-500 font-mono font-bold text-base">{currentPrice.ask.toFixed(decimals)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Spread:</span>
                <span className="text-yellow-500 font-mono text-xs font-medium">
                  {((currentPrice.ask - currentPrice.bid) * Math.pow(10, decimals)).toFixed(1)} pts
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Trade Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onQuickTrade) {
                  onQuickTrade('SELL', currentPrice.bid);
                } else {
                  toast.info(`Quick Sell ${symbol} @ ${currentPrice.bid.toFixed(decimals)}`);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95 flex flex-col items-center min-w-[80px]"
            >
              <span className="text-xs opacity-80">SELL</span>
              <span className="font-mono text-sm">{currentPrice.bid.toFixed(decimals)}</span>
            </button>
            <button
              onClick={() => {
                if (onQuickTrade) {
                  onQuickTrade('BUY', currentPrice.ask);
                } else {
                  toast.info(`Quick Buy ${symbol} @ ${currentPrice.ask.toFixed(decimals)}`);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95 flex flex-col items-center min-w-[80px]"
            >
              <span className="text-xs opacity-80">BUY</span>
              <span className="font-mono text-sm">{currentPrice.ask.toFixed(decimals)}</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Chart container */}
      <div 
        ref={containerRef}
        className="h-full w-full"
      />
    </div>
  );
}
