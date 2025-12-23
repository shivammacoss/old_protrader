"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState, FormEvent } from "react";

interface IBTier {
  _id: string;
  name: string;
  minReferrals: number;
  maxReferrals: number;
  commissionRate: number;
}

export default function TierManagementPage() {
  const [tiers, setTiers] = useState<IBTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTier, setNewTier] = useState({
    name: "",
    minReferrals: 0,
    maxReferrals: 0,
    commissionRate: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ib/tiers", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setTiers(data.tiers);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch tiers.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setNewTier((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/admin/ib/tiers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTier),
      });
      const data = await res.json();
      if (data.success) {
        fetchTiers(); // Refresh the list
        setNewTier({ name: "", minReferrals: 0, maxReferrals: 0, commissionRate: 0 }); // Reset form
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to create tier.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">IB Tier Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Commission Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier Name</TableHead>
                    <TableHead>Referral Range</TableHead>
                    <TableHead>Commission Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier._id}>
                      <TableCell>{tier.name}</TableCell>
                      <TableCell>{`${tier.minReferrals} - ${tier.maxReferrals}`}</TableCell>
                      <TableCell>{`${(tier.commissionRate * 100).toFixed(2)}%`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!loading && tiers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No tiers found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create New Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                name="name"
                placeholder="Tier Name (e.g., Bronze)"
                value={newTier.name}
                onChange={handleInputChange}
                required
              />
              <Input
                name="minReferrals"
                placeholder="Min Referrals"
                type="number"
                value={newTier.minReferrals}
                onChange={handleInputChange}
                required
              />
              <Input
                name="maxReferrals"
                placeholder="Max Referrals"
                type="number"
                value={newTier.maxReferrals}
                onChange={handleInputChange}
                required
              />
              <Input
                name="commissionRate"
                placeholder="Commission Rate (e.g., 0.1 for 10%)"
                type="number"
                step="0.01"
                value={newTier.commissionRate}
                onChange={handleInputChange}
                required
              />
              <Button type="submit" className="w-full">Create Tier</Button>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
