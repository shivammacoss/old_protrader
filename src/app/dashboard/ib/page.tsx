"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function IBDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/ib/dashboard');
        let json: any = null;
        try { json = await res.json(); } catch (err) { json = null; }
        if (!mounted) return;
        if (!json || !json.success) {
          toast.error((json && json.message) || 'Failed to load IB dashboard');
          setData(null);
        } else {
          setData(json.data);
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load IB dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">No IB data available</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">IB Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Referral and performance summary</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Referral Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <Input readOnly value={data.referral_link} className="flex-1" />
              <Button onClick={() => { navigator.clipboard?.writeText(data.referral_link); toast.success('Copied'); }}>Copy</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Referred Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalReferred}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalActive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Brokerage Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBrokerage?.toFixed ? data.totalBrokerage.toFixed(2) : data.totalBrokerage}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Commission Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCommission?.toFixed ? data.totalCommission.toFixed(2) : data.totalCommission}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
