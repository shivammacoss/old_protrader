"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/trading/Header";
import { Sidebar } from "@/components/trading/Sidebar";
import { MobileNav } from "@/components/ui/MobileNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

interface Trade {
  _id: string;
  symbol: string;
  type?: 'buy' | 'sell';
  side?: 'BUY' | 'SELL';
  volume?: number;
  lot?: number;
  openPrice?: number;
  closePrice?: number;
  profit?: number;
  status: string;
  createdAt: string;
  closedAt?: string;
}

interface DayPnL {
  date: string;
  profit: number;
  trades: number;
}

export default function PortfolioPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Map<string, DayPnL>>(new Map());
  const [totalPnL, setTotalPnL] = useState(0);
  const [monthlyPnL, setMonthlyPnL] = useState(0);

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    calculateCalendarData();
  }, [trades, currentMonth]);

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/user/trades?status=closed', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setTrades(data.trades || []);
        const total = (data.trades || []).reduce((sum: number, t: Trade) => sum + (t.profit || 0), 0);
        setTotalPnL(total);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCalendarData = () => {
    const dataMap = new Map<string, DayPnL>();
    let monthTotal = 0;

    trades.forEach(trade => {
      if (trade.closedAt) {
        const date = new Date(trade.closedAt);
        const dateKey = date.toISOString().split('T')[0];
        
        // Check if trade is in current month
        if (date.getMonth() === currentMonth.getMonth() && 
            date.getFullYear() === currentMonth.getFullYear()) {
          monthTotal += trade.profit || 0;
        }

        const existing = dataMap.get(dateKey);
        if (existing) {
          existing.profit += trade.profit || 0;
          existing.trades += 1;
        } else {
          dataMap.set(dateKey, {
            date: dateKey,
            profit: trade.profit || 0,
            trades: 1,
          });
        }
      }
    });

    setCalendarData(dataMap);
    setMonthlyPnL(monthTotal);
  };

  const generatePDF = async () => {
    toast.info('Generating PDF...');
    
    // Create PDF content
    const content = generateLedgerContent();
    
    // Create a blob and download
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Ledger downloaded successfully!');
  };

  const generateLedgerContent = () => {
    let csv = 'Date,Symbol,Type,Volume,Open Price,Close Price,Profit/Loss,Status\n';
    
    trades.forEach(trade => {
      csv += `${new Date(trade.closedAt || trade.createdAt).toLocaleDateString()},`;
      csv += `${trade.symbol},`;
      csv += `${(trade.type || trade.side || 'N/A').toUpperCase()},`;
      csv += `${trade.volume ?? trade.lot ?? 0},`;
      csv += `${trade.openPrice ?? 0},`;
      csv += `${trade.closePrice ?? '-'},`;
      csv += `${trade.profit?.toFixed(2) || '0.00'},`;
      csv += `${trade.status}\n`;
    });

    csv += `\n\nTotal P&L,$${totalPnL.toFixed(2)}\n`;
    csv += `Total Trades,${trades.length}\n`;
    csv += `Generated,${new Date().toLocaleString()}\n`;

    return csv;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 sm:h-20"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = calendarData.get(dateKey);
      const isToday = new Date().toISOString().split('T')[0] === dateKey;

      days.push(
        <div
          key={day}
          className={`h-16 sm:h-20 p-1 sm:p-2 border border-border rounded-lg ${
            isToday ? 'bg-primary/20 border-primary/50' : 'bg-card'
          } ${dayData ? 'cursor-pointer hover:bg-accent/50' : ''}`}
        >
          <div className="text-xs text-muted-foreground">{day}</div>
          {dayData && (
            <div className="mt-1">
              <div className={`text-xs sm:text-sm font-medium ${dayData.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {dayData.profit >= 0 ? '+' : ''}{formatCurrency(dayData.profit)}
              </div>
              <div className="text-[10px] text-muted-foreground">{dayData.trades} trade{dayData.trades > 1 ? 's' : ''}</div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onOpenInstruments={() => {}} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/home')}
                  className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Portfolio</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Track your trading performance</p>
                </div>
              </div>
              <Button onClick={generatePDF}>
                <Download className="w-4 h-4 mr-2" />
                Download Ledger
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Total Trades</p>
                      <p className="text-2xl font-bold text-foreground">{trades.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${totalPnL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {totalPnL >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Total P&L</p>
                      <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${monthlyPnL >= 0 ? 'bg-cyan-500/10' : 'bg-orange-500/10'}`}>
                      <Calendar className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">This Month</p>
                      <p className={`text-2xl font-bold ${monthlyPnL >= 0 ? 'text-cyan-500' : 'text-orange-500'}`}>
                        {monthlyPnL >= 0 ? '+' : ''}{formatCurrency(monthlyPnL)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Calendar and History */}
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList>
                <TabsTrigger value="calendar">
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar View
                </TabsTrigger>
                <TabsTrigger value="history">
                  <FileText className="w-4 h-4 mr-2" />
                  Trade History
                </TabsTrigger>
              </TabsList>

              {/* Calendar Tab */}
              <TabsContent value="calendar" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>P&L Calendar</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={prevMonth}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-foreground font-medium min-w-[150px] text-center">
                          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button variant="ghost" size="icon" onClick={nextMonth}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      View your daily profit and loss
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderCalendar()}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Trade History</CardTitle>
                    <CardDescription>All your closed trades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : trades.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No trades yet</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-gray-400">Symbol</TableHead>
                              <TableHead className="text-gray-400">Type</TableHead>
                              <TableHead className="text-gray-400 hidden sm:table-cell">Volume</TableHead>
                              <TableHead className="text-gray-400 hidden md:table-cell">Open</TableHead>
                              <TableHead className="text-gray-400 hidden md:table-cell">Close</TableHead>
                              <TableHead className="text-gray-400 text-right">P&L</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {trades.map((trade) => (
                              <TableRow key={trade._id} className="border-gray-800">
                                <TableCell className="text-gray-300 text-xs sm:text-sm">
                                  {new Date(trade.closedAt || trade.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-white font-medium">{trade.symbol}</TableCell>
                                <TableCell>
                                  <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'} className="text-xs">
                                    {(trade.type || trade.side || 'N/A').toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-300 hidden sm:table-cell">{trade.volume ?? trade.lot ?? 0}</TableCell>
                                <TableCell className="text-gray-300 hidden md:table-cell">{(trade.openPrice ?? 0).toFixed(5)}</TableCell>
                                <TableCell className="text-gray-300 hidden md:table-cell">{trade.closePrice ? trade.closePrice.toFixed(5) : '-'}</TableCell>
                                <TableCell className={`text-right font-medium ${(trade.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {(trade.profit || 0) >= 0 ? '+' : ''}{formatCurrency(trade.profit || 0)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
