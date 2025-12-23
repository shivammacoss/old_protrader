"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';

export default function IBDashboardPage() {
  const [range, setRange] = useState<'7d'|'30d'|'90d'>('30d');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">IB Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Performance and activity for IBs</p>
      </div>

      <div className="flex items-center gap-3">
        <select value={range} onChange={(e)=>setRange(e.target.value as any)} className="px-3 py-2 border rounded">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">Chart placeholder: Brokerage by day for {range}</Card>
        <Card className="p-4">Chart placeholder: Commission by IB for {range}</Card>
      </div>

      <Card>
        <div className="p-4">Detailed tables and filters can be added here.</div>
      </Card>
    </div>
  );
}
