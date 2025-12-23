"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function IBOverviewPage() {
  const [pending, setPending] = useState<number | null>(null);
  const [totalIBs, setTotalIBs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const [reqRes, accRes] = await Promise.all([
        fetch('/api/admin/ib-requests'),
        fetch('/api/admin/ib-accounts'),
      ]);
      const reqData = await reqRes.json();
      const accData = await accRes.json();
      setPending(reqData.success ? (reqData.requests || []).filter((r:any)=>r.status==='pending').length : 0);
      setTotalIBs(accData.success ? (accData.users || []).length : 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load IB overview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">IB Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Summary of IB program</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending Requests</div>
          <div className="text-2xl font-semibold">{loading ? '…' : pending ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total IB Accounts</div>
          <div className="text-2xl font-semibold">{loading ? '…' : totalIBs ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Commission (est.)</div>
          <div className="text-2xl font-semibold">—</div>
        </Card>
      </div>

      <div>
        <Card>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">Quick Actions</div>
              <div className="text-sm text-muted-foreground">Manage IB program settings and performance</div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => window.location.href = '/admin/ib-requests'}>View Requests</Button>
              <Button onClick={() => window.location.href = '/admin/ib/accounts'}>View Accounts</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


