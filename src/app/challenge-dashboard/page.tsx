"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/trading/Header";
import { Sidebar } from "@/components/trading/Sidebar";
import { MobileNav } from "@/components/ui/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Award, Share2 } from "lucide-react";

interface ChallengeAccount {
  _id: string;
  accountSize: number;
  result: 'pending' | 'win' | 'lose';
  currentProfit: number;
}

interface ChallengeTrade {
  _id: string;
  symbol: string;
  side: string;
  profit: number;
  createdAt: string;
}

export default function ChallengeDashboardPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<ChallengeAccount[]>([]);
  const [challengeTrades, setChallengeTrades] = useState<ChallengeTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostTradedSymbols, setMostTradedSymbols] = useState<{symbol: string; count: number}[]>([]);

  useEffect(() => {
    fetchChallenges();
    fetchChallengeTrades();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/challenges/purchase', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setChallenges(data.challenges || []);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallengeTrades = async () => {
    try {
      const res = await fetch('/api/user/trades?status=closed', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.trades) {
        setChallengeTrades(data.trades);
        const symbolCounts: Record<string, number> = {};
        data.trades.forEach((trade: ChallengeTrade) => {
          symbolCounts[trade.symbol] = (symbolCounts[trade.symbol] || 0) + 1;
        });
        const sorted = Object.entries(symbolCounts)
          .map(([symbol, count]) => ({ symbol, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        setMostTradedSymbols(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    }
  };

  const getTotalAllocation = () => challenges.reduce((sum, c) => sum + c.accountSize, 0);
  const getTotalReward = () => challenges.filter(c => c.result === 'win').reduce((sum, c) => sum + (c.currentProfit || 0), 0);
  const getHighestReward = () => {
    const wins = challenges.filter(c => c.result === 'win');
    if (wins.length === 0) return 0;
    return Math.max(...wins.map(c => c.currentProfit || 0));
  };
  const getWinCount = () => challenges.filter(c => c.result === 'win').length;
  const getLoseCount = () => challenges.filter(c => c.result === 'lose').length;
  const getWinRate = () => {
    const completed = challenges.filter(c => c.result !== 'pending');
    if (completed.length === 0) return 0;
    return (getWinCount() / completed.length) * 100;
  };
  const getLossRate = () => {
    const completed = challenges.filter(c => c.result !== 'pending');
    if (completed.length === 0) return 0;
    return (getLoseCount() / completed.length) * 100;
  };
  const getUserLevel = () => {
    const wins = getWinCount();
    if (wins >= 10) return 'Gold';
    if (wins >= 5) return 'Silver';
    return 'Bronze';
  };
  const getTotalTrades = () => challengeTrades.length;
  const getBuyTrades = () => challengeTrades.filter(t => t.side === 'BUY').length;
  const getSellTrades = () => challengeTrades.filter(t => t.side === 'SELL').length;
  const getBehavioralBias = () => {
    const total = getTotalTrades();
    if (total === 0) return 'Neutral';
    const buyPercent = (getBuyTrades() / total) * 100;
    if (buyPercent > 60) return 'Bullish';
    if (buyPercent < 40) return 'Bearish';
    return 'Neutral';
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onOpenInstruments={() => {}} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-lg sm:text-xl font-semibold">Trader Summary</h1>
                <Badge variant="outline" className="text-xs px-3 py-1 bg-secondary border-border">
                  Total Allocation: ${getTotalAllocation().toFixed(2)}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/buy-challenge')} className="bg-amber-500 hover:bg-amber-600 text-white text-sm">
                  <Trophy className="w-4 h-4 mr-2" />
                  BUY CHALLENGE
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Row 1: Chart | Behavioral Bias | Trading Day Performance */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Equity Chart */}
                  <Card className="bg-primary/20 border-0">
                    <CardContent className="p-6 h-40 flex items-center justify-center rounded-xl">
                      <p className="text-muted-foreground text-sm">No data available</p>
                    </CardContent>
                  </Card>

                  {/* Behavioral Bias */}
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-muted-foreground">Behavioral Bias</span>
                        <span className="text-sm">Total Trades: <strong>{getTotalTrades()}</strong></span>
                      </div>
                      <div className="flex items-center justify-center gap-4 mb-3">
                        <span className="text-2xl">��</span>
                        <span className="text-xl font-bold">{getBehavioralBias()}</span>
                        <span className="text-2xl">��</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5 mb-2">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${getTotalTrades() > 0 ? (getBuyTrades() / getTotalTrades()) * 100 : 50}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{getSellTrades()} ({getTotalTrades() > 0 ? ((getSellTrades() / getTotalTrades()) * 100).toFixed(1) : '50.0'}%)</span>
                        <span>⌃</span>
                        <span>{getBuyTrades()} ({getTotalTrades() > 0 ? ((getBuyTrades() / getTotalTrades()) * 100).toFixed(1) : '50.0'}%)</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trading Day Performance */}
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-muted-foreground">Trading Day Performance</span>
                        <span className="text-sm">Best Day: <strong>Thu</strong></span>
                      </div>
                      <div className="flex justify-between items-end h-20 pt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                          <div key={day} className="flex flex-col items-center gap-1">
                            <div className="w-5 bg-secondary rounded" style={{ height: '8px' }}></div>
                            <span className="text-[10px] text-muted-foreground">{day}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Row 2: Your Level | Profitability */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Your Level Card */}
                  <Card className="bg-primary/20 border-0 overflow-hidden">
                    <CardContent className="p-6 relative">
                      <div className="flex justify-between">
                        <div className="z-10">
                          <p className="text-foreground/60 text-sm mb-1">Your Level</p>
                          <h2 className="text-4xl font-bold text-foreground mb-6">{getUserLevel()}</h2>
                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <p className="text-foreground/60 text-xs">Total Reward</p>
                              <p className="font-bold text-foreground">${getTotalReward().toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-foreground/60 text-xs">Highest Reward</p>
                              <p className="font-bold text-foreground">${getHighestReward().toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-foreground/60 text-xs">Count</p>
                              <p className="font-bold text-foreground">{getWinCount()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
                          <Award className="w-32 h-32 text-amber-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profitability Card */}
                  <Card className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-muted-foreground mb-3">Profitability</p>
                          <div className="flex items-center gap-10">
                            <div>
                              <p className="text-xs text-muted-foreground">Won</p>
                              <p className="text-3xl font-bold text-green-500">{getWinRate().toFixed(1)}%</p>
                              <p className="text-xs text-muted-foreground">{getWinCount()}</p>
                            </div>
                            <div className="text-center">
                              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">Trades Taken</p>
                              <p className="text-xs text-muted-foreground">Start trading to see analysis</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Lost</p>
                              <p className="text-3xl font-bold text-red-500">{getLossRate().toFixed(1)}%</p>
                              <p className="text-xs text-muted-foreground">{getLoseCount()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Avg Holding Period:</p>
                          <p className="font-bold">0s</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Row 3: Most Traded | Session Win Rates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Most Traded Instruments */}
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-4">Most Traded 3 Instruments</p>
                      {mostTradedSymbols.length > 0 ? (
                        <div className="space-y-3">
                          {mostTradedSymbols.map((item, index) => (
                            <div key={item.symbol} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                                <span className="font-medium">{item.symbol}</span>
                              </div>
                              <Badge variant="outline">{item.count} trades</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-20 flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">No trades yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Session Win Rates */}
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-4">Session Win Rates</p>
                      <div className="space-y-3">
                        {['New York', 'London', 'Asia'].map((session) => (
                          <div key={session} className="flex items-center gap-4">
                            <span className="w-20 text-sm">{session}</span>
                            <div className="flex-1 bg-secondary rounded-full h-1.5">
                              <div className="bg-primary h-1.5 rounded-full" style={{ width: '0%' }}></div>
                            </div>
                            <span className="w-12 text-right text-sm text-muted-foreground">0.0%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
