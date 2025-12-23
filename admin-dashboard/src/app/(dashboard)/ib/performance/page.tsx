"use client";

import { Card } from "@/components/ui/card";

export default function IBPerformancePage() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Performance</h1>
        <p className="text-sm text-muted-foreground mt-1">IB performance metrics and analytics</p>
      </div>

      <Card className="p-4 sm:p-6 bg-card border-border">
        <p className="text-sm text-muted-foreground">Performance content will be added here...</p>
      </Card>
    </div>
  );
}

