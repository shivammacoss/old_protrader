"use client";

import { Card } from "@/components/ui/card";

export default function CopyTradeSettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure copy trading settings</p>
      </div>

      <Card className="p-6 bg-card border-border">
        <p className="text-sm text-muted-foreground">Settings content will be added here...</p>
      </Card>
    </div>
  );
}

