"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Trade {
  _id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  lot: number;
  entryPrice: number;
  currentPrice: number;
  floatingPnL: number;
  realizedPnL?: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: string;
  closedAt?: string;
  closePrice?: number;
  status: 'open' | 'closed' | 'partial';
  closedLot?: number;
}

interface PendingOrder {
  _id: string;
  symbol: string;
  orderType: 'buy_limit' | 'sell_limit' | 'buy_stop' | 'sell_stop';
  side: 'BUY' | 'SELL';
  lot: number;
  triggerPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  status: 'pending' | 'executed' | 'cancelled' | 'expired';
  createdAt: string;
  margin: number;
}

interface OrdersTableProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function OrdersTable({ isExpanded, onToggle }: OrdersTableProps) {
  const [activeTab, setActiveTab] = useState<"open" | "pending" | "closed">("open");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    const handleTradeCreated = () => fetchData();
    window.addEventListener('tradeCreated', handleTradeCreated);
    return () => {
      clearInterval(interval);
      window.removeEventListener('tradeCreated', handleTradeCreated);
    };
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'pending') {
        const res = await fetch('/api/user/pending-orders?status=pending', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setPendingOrders(data.orders || []);
      } else {
        const status = activeTab === 'open' ? 'open' : 'closed';
        const res = await fetch(`/api/user/trades?status=${status}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTrade = async (tradeId: string, symbol: string) => {
    if (!confirm(`Close ${symbol} trade?`)) return;
    try {
      const res = await fetch(`/api/user/trades/${tradeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Closed. PnL: $${data.realizedPnL.toFixed(2)}`);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to close');
      }
    } catch (error) {
      toast.error('Failed to close trade');
    }
  };

  const handleCancelPendingOrder = async (orderId: string, symbol: string) => {
    if (!confirm(`Cancel pending ${symbol} order?`)) return;
    try {
      const res = await fetch(`/api/user/pending-orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pending order cancelled');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to cancel');
      }
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status === 'closed' || t.status === 'partial');
  const totalPnL = openTrades.reduce((acc, t) => acc + t.floatingPnL, 0);

  const formatPrice = (price: number, sym: string) => {
    if (sym.includes('JPY')) return price.toFixed(3);
    if (sym.includes('XAU') || sym.includes('XAG')) return price.toFixed(2);
    if (sym.includes('BTC') || sym.includes('ETH')) return price.toFixed(2);
    return price.toFixed(5);
  };

  const formatOrderType = (type: string) => {
    return type.replace('_', ' ').toUpperCase();
  };

  const displayTrades = activeTab === 'open' ? openTrades : activeTab === 'closed' ? closedTrades : [];

  return (
    <div className={`bg-card border-t border-border transition-all duration-300 ${isExpanded ? "h-48" : "h-10"}`}>
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-4">
          {(["open", "pending", "closed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-medium transition-colors ${
                activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "open" && openTrades.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded">
                  {openTrades.length}
                </span>
              )}
              {tab === "pending" && pendingOrders.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] rounded">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            Floating: <span className={totalPnL >= 0 ? "text-green-500" : "text-red-500"}>${totalPnL.toFixed(2)}</span>
          </span>
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "" : "rotate-180"}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="h-[calc(100%-40px)] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading...</div>
          ) : activeTab === 'pending' ? (
            pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <div className="text-2xl mb-1 opacity-30">⏳</div>
                <p className="text-xs">No pending orders</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-secondary/50 sticky top-0">
                  <tr className="text-muted-foreground">
                    <th className="text-left px-4 py-2 font-medium">Symbol</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-right px-4 py-2 font-medium">Lots</th>
                    <th className="text-right px-4 py-2 font-medium">Price</th>
                    <th className="text-right px-4 py-2 font-medium">SL</th>
                    <th className="text-right px-4 py-2 font-medium">TP</th>
                    <th className="text-center px-4 py-2 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order._id} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="px-4 py-2 font-medium text-foreground">{order.symbol}</td>
                      <td className="px-4 py-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          order.orderType.includes('buy') ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                        }`}>
                          {formatOrderType(order.orderType)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-foreground">{order.lot.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-mono text-yellow-500">{formatPrice(order.triggerPrice, order.symbol)}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">{order.stopLoss ? formatPrice(order.stopLoss, order.symbol) : '-'}</td>
                      <td className="px-4 py-2 text-right font-mono text-muted-foreground">{order.takeProfit ? formatPrice(order.takeProfit, order.symbol) : '-'}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleCancelPendingOrder(order._id, order.symbol)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Cancel order"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : displayTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="text-2xl mb-1 opacity-30">📊</div>
              <p className="text-xs">No {activeTab} trades</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-secondary/50 sticky top-0">
                <tr className="text-muted-foreground">
                  <th className="text-left px-4 py-2 font-medium">Symbol</th>
                  <th className="text-left px-4 py-2 font-medium">Side</th>
                  <th className="text-right px-4 py-2 font-medium">Lots</th>
                  <th className="text-right px-4 py-2 font-medium">Entry</th>
                  <th className="text-right px-4 py-2 font-medium">{activeTab === 'closed' ? 'Close' : 'Current'}</th>
                  <th className="text-right px-4 py-2 font-medium">P/L</th>
                  <th className="text-center px-4 py-2 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {displayTrades.map((trade) => (
                  <tr key={trade._id} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="px-4 py-2 font-medium text-foreground">{trade.symbol}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] font-medium ${trade.side === "BUY" ? "text-green-500" : "text-red-500"}`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-foreground">{trade.lot.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-mono text-muted-foreground">{formatPrice(trade.entryPrice, trade.symbol)}</td>
                    <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                      {activeTab === 'closed' && trade.closePrice 
                        ? formatPrice(trade.closePrice, trade.symbol)
                        : formatPrice(trade.currentPrice, trade.symbol)
                      }
                    </td>
                    <td className={`px-4 py-2 text-right font-mono font-medium ${
                      (activeTab === 'closed' ? (trade.realizedPnL || 0) : trade.floatingPnL) >= 0 ? "text-green-500" : "text-red-500"
                    }`}>
                      {activeTab === 'closed'
                        ? `${(trade.realizedPnL || 0) >= 0 ? "+" : ""}${(trade.realizedPnL || 0).toFixed(2)}`
                        : `${trade.floatingPnL >= 0 ? "+" : ""}${trade.floatingPnL.toFixed(2)}`
                      }
                    </td>
                    <td className="px-4 py-2 text-center">
                      {activeTab === "open" && (
                        <button
                          onClick={() => handleCloseTrade(trade._id, trade.symbol)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
