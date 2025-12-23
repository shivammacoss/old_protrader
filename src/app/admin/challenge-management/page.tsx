"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Trophy, 
  Settings, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface ChallengeSettings {
  challengeTypePrices: {
    one_step: number;
    two_step: number;
    zero_step: number;
  };
  accountSizePrices: { size: number; price: number }[];
  profitTargetModifiers: { target: number; modifier: number; isDefault: boolean }[];
  maxDailyLoss: number;
  maxTotalLoss: number;
  minTradingDays: number;
  tradingPeriodDays: number;
}

interface ChallengeAccount {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    userId: number;
  };
  challengeType: string;
  profitTarget: number;
  accountSize: number;
  price: number;
  status: string;
  result: string;
  phase: number;
  accountNumber: string;
  currentProfit: number;
  currentProfitPercent: number;
  targetProfit: number;
  tradesCount: number;
  createdAt: string;
}

interface Stats {
  totalChallenges: number;
  activeChallenges: number;
  passedChallenges: number;
  failedChallenges: number;
  totalRevenue: number;
  wins: number;
  losses: number;
}

export default function ChallengeManagementPage() {
  const [settings, setSettings] = useState<ChallengeSettings | null>(null);
  const [challenges, setChallenges] = useState<ChallengeAccount[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterResult, setFilterResult] = useState("all");

  useEffect(() => {
    fetchSettings();
    fetchChallenges();
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [filterStatus, filterResult]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/challenge-settings', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      toast.error('Failed to fetch settings');
    }
  };

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterResult !== 'all') params.append('result', filterResult);
      
      const res = await fetch(`/api/admin/challenge-accounts?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setChallenges(data.challenges);
        setStats(data.stats);
      }
    } catch (error) {
      toast.error('Failed to fetch challenges');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/challenge-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateChallengeStatus = async (challengeId: string, status: string, result?: string) => {
    try {
      const res = await fetch('/api/admin/challenge-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ challengeId, status, result }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Challenge updated');
        fetchChallenges();
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch (error) {
      toast.error('Failed to update challenge');
    }
  };

  const addAccountSize = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      accountSizePrices: [...settings.accountSizePrices, { size: 0, price: 0 }],
    });
  };

  const removeAccountSize = (index: number) => {
    if (!settings) return;
    const updated = settings.accountSizePrices.filter((_, i) => i !== index);
    setSettings({ ...settings, accountSizePrices: updated });
  };

  const addProfitTarget = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      profitTargetModifiers: [...settings.profitTargetModifiers, { target: 0, modifier: 0, isDefault: false }],
    });
  };

  const removeProfitTarget = (index: number) => {
    if (!settings) return;
    const updated = settings.profitTargetModifiers.filter((_, i) => i !== index);
    setSettings({ ...settings, profitTargetModifiers: updated });
  };

  const getChallengeTypeName = (type: string) => {
    switch (type) {
      case 'one_step': return 'One Step';
      case 'two_step': return 'Two Step';
      case 'zero_step': return 'Zero Step';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-blue-500/20 text-blue-500">Active</Badge>;
      case 'passed': return <Badge className="bg-green-500/20 text-green-500">Passed</Badge>;
      case 'failed': return <Badge className="bg-red-500/20 text-red-500">Failed</Badge>;
      case 'expired': return <Badge variant="secondary">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'win': return <Badge className="bg-green-500/20 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />Win</Badge>;
      case 'lose': return <Badge className="bg-red-500/20 text-red-500"><XCircle className="w-3 h-3 mr-1" />Lose</Badge>;
      case 'pending': return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default: return <Badge variant="outline">{result}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Challenge Management</h1>
              <p className="text-muted-foreground mt-1">Manage challenge settings and user challenges</p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{stats.totalChallenges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Active</p>
                      <p className="text-xl font-bold">{stats.activeChallenges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Passed</p>
                      <p className="text-xl font-bold">{stats.passedChallenges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Failed</p>
                      <p className="text-xl font-bold">{stats.failedChallenges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Wins</p>
                      <p className="text-xl font-bold">{stats.wins}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Losses</p>
                      <p className="text-xl font-bold">{stats.losses}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
              <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Challenge Users</TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              {settings && (
                <>
                  {/* Challenge Type Prices */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Challenge Type Prices</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label>One Step Price ($)</Label>
                          <Input
                            type="number"
                            value={settings.challengeTypePrices.one_step}
                            onChange={(e) => setSettings({
                              ...settings,
                              challengeTypePrices: { ...settings.challengeTypePrices, one_step: parseFloat(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Two Step Price ($)</Label>
                          <Input
                            type="number"
                            value={settings.challengeTypePrices.two_step}
                            onChange={(e) => setSettings({
                              ...settings,
                              challengeTypePrices: { ...settings.challengeTypePrices, two_step: parseFloat(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Zero Step Price ($)</Label>
                          <Input
                            type="number"
                            value={settings.challengeTypePrices.zero_step}
                            onChange={(e) => setSettings({
                              ...settings,
                              challengeTypePrices: { ...settings.challengeTypePrices, zero_step: parseFloat(e.target.value) || 0 }
                            })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Size Prices */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Account Size Prices</CardTitle>
                      <Button size="sm" onClick={addAccountSize}>
                        <Plus className="w-4 h-4 mr-1" /> Add Size
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {settings.accountSizePrices.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <Label className="text-xs">Account Size ($)</Label>
                              <Input
                                type="number"
                                value={item.size}
                                onChange={(e) => {
                                  const updated = [...settings.accountSizePrices];
                                  updated[index].size = parseFloat(e.target.value) || 0;
                                  setSettings({ ...settings, accountSizePrices: updated });
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs">Price ($)</Label>
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const updated = [...settings.accountSizePrices];
                                  updated[index].price = parseFloat(e.target.value) || 0;
                                  setSettings({ ...settings, accountSizePrices: updated });
                                }}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mt-5 text-destructive"
                              onClick={() => removeAccountSize(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profit Target Modifiers */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Profit Target Options</CardTitle>
                      <Button size="sm" onClick={addProfitTarget}>
                        <Plus className="w-4 h-4 mr-1" /> Add Target
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {settings.profitTargetModifiers.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <Label className="text-xs">Target (%)</Label>
                              <Input
                                type="number"
                                value={item.target}
                                onChange={(e) => {
                                  const updated = [...settings.profitTargetModifiers];
                                  updated[index].target = parseFloat(e.target.value) || 0;
                                  setSettings({ ...settings, profitTargetModifiers: updated });
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs">Price Modifier ($)</Label>
                              <Input
                                type="number"
                                value={item.modifier}
                                onChange={(e) => {
                                  const updated = [...settings.profitTargetModifiers];
                                  updated[index].modifier = parseFloat(e.target.value) || 0;
                                  setSettings({ ...settings, profitTargetModifiers: updated });
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-5">
                              <input
                                type="checkbox"
                                checked={item.isDefault}
                                onChange={(e) => {
                                  const updated = settings.profitTargetModifiers.map((t, i) => ({
                                    ...t,
                                    isDefault: i === index ? e.target.checked : false,
                                  }));
                                  setSettings({ ...settings, profitTargetModifiers: updated });
                                }}
                              />
                              <Label className="text-xs">Default</Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mt-5 text-destructive"
                              onClick={() => removeProfitTarget(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trading Rules */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Trading Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <Label>Max Daily Loss (%)</Label>
                          <Input
                            type="number"
                            value={settings.maxDailyLoss}
                            onChange={(e) => setSettings({ ...settings, maxDailyLoss: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>Max Total Loss (%)</Label>
                          <Input
                            type="number"
                            value={settings.maxTotalLoss}
                            onChange={(e) => setSettings({ ...settings, maxTotalLoss: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>Min Trading Days</Label>
                          <Input
                            type="number"
                            value={settings.minTradingDays}
                            onChange={(e) => setSettings({ ...settings, minTradingDays: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>Trading Period (Days)</Label>
                          <Input
                            type="number"
                            value={settings.tradingPeriodDays}
                            onChange={(e) => setSettings({ ...settings, tradingPeriodDays: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button onClick={saveSettings} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Challenge Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg">Challenge Users</CardTitle>
                    <div className="flex gap-2">
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="passed">Passed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterResult} onValueChange={setFilterResult}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Result" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Results</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="win">Win</SelectItem>
                          <SelectItem value="lose">Lose</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : challenges.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                              No challenges found
                            </TableCell>
                          </TableRow>
                        ) : (
                          challenges.map((challenge) => (
                            <TableRow key={challenge._id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{challenge.userId?.name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{challenge.userId?.email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{challenge.accountNumber}</TableCell>
                              <TableCell>{getChallengeTypeName(challenge.challengeType)}</TableCell>
                              <TableCell>${challenge.accountSize.toLocaleString()}</TableCell>
                              <TableCell>{challenge.profitTarget}%</TableCell>
                              <TableCell>
                                <div>
                                  <p className={challenge.currentProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    {challenge.currentProfit >= 0 ? '+' : ''}${challenge.currentProfit.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Target: ${challenge.targetProfit?.toFixed(2) || (challenge.accountSize * challenge.profitTarget / 100).toFixed(2)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(challenge.status)}</TableCell>
                              <TableCell>{getResultBadge(challenge.result)}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-500 h-7 px-2"
                                    onClick={() => updateChallengeStatus(challenge._id, 'passed', 'win')}
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-500 h-7 px-2"
                                    onClick={() => updateChallengeStatus(challenge._id, 'failed', 'lose')}
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
