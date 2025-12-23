"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

interface Row {
  user: any;
  referrer: any;
  referral_link?: string | null;
}

export default function IBAccountsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/ib-accounts', { credentials: 'include' });
        const json = await res.json();
        if (!mounted) return;
        if (!json || !json.success) {
          toast.error(json?.message || 'Failed to load IB accounts');
          setRows([]);
        } else {
          setRows(json.accounts || []);
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load IB accounts');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">IB Accounts</h1>
        <p className="text-sm text-muted-foreground mt-1">List of users referred by IBs and their referrers</p>
      </div>

      <Card className="p-6 bg-card border-border">
        {loading ? (
          <div>Loading...</div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No referred users found.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="p-2">User ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Referred By (IB)</th>
                  <th className="p-2">IB Code</th>
                  <th className="p-2">Referral Link</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 align-top">{r.user?.userId}</td>
                    <td className="p-2 align-top">{r.user?.name}</td>
                    <td className="p-2 align-top">{r.user?.email}</td>
                    <td className="p-2 align-top">{r.referrer ? `${r.referrer.name} (${r.referrer.userId})` : '—'}</td>
                    <td className="p-2 align-top">{r.referrer?.ib_code || '—'}</td>
                    <td className="p-2 align-top">
                      {r.referral_link ? (
                        <div className="flex gap-2">
                          <Input readOnly value={r.referral_link} className="flex-1" />
                          <Button onClick={() => { navigator.clipboard?.writeText(r.referral_link || ''); toast.success('Copied'); }}>Copy</Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No link</span>
                      )}
                    </td>
                    <td className="p-2 align-top">
                      <div className="flex gap-2">
                        <Button onClick={() => { window.location.href = `/admin/users?userId=${r.user?.userId}`; }}>Open in Users</Button>
                        {r.referral_link && (
                          <Button onClick={() => { window.open(r.referral_link, '_blank'); }}>Open Link</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

