"use client";

import { Card } from "@/components/ui/card";

export default function TransactionsPage() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">View all financial transactions</p>
      </div>

      <Card className="p-4 sm:p-6 bg-card border-border">
        <p className="text-sm text-muted-foreground">Transactions content will be added here...</p>
      </Card>
    </div>
  );
}

