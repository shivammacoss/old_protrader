"use client";

import { Card } from "@/components/ui/card";

export default function FeeStructurePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fee Structure</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure trading fees and charges</p>
      </div>

      <Card className="p-6 bg-card border-border">
        <p className="text-sm text-muted-foreground">Fee structure content will be added here...</p>
      </Card>
    </div>
  );
}

