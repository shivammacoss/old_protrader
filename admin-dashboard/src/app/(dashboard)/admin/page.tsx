"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AllAdminsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Admins</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage admin accounts</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </div>
      <Card className="p-6 bg-card border-border">
        <p className="text-sm text-muted-foreground">Admin management content will be added here...</p>
      </Card>
    </div>
  );
}

