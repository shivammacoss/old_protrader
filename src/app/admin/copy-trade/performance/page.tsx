"use client";

import { Card } from "@/components/ui/card";

export default function CopyTradePerformancePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance</h1>
        <p className="text-sm text-muted-foreground mt-1">Copy trading performance analytics</p>
      </div>

      <Card className="p-6 bg-card border-border">
        <p className="text-sm text-muted-foreground">Performance content will be added here...</p>
      </Card>
    </div>
  );
}

