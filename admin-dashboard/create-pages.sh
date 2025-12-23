#!/bin/bash

# Create all pages based on existing structure

# Users pages
cat > src/app/\(dashboard\)/users/page.tsx << 'EOF'
"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all user accounts</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>
      <Card className="p-6 bg-card border-border">
        <p className="text-sm text-muted-foreground">User management content will be added here...</p>
      </Card>
    </div>
  );
}
EOF

# Function to create simple page
create_page() {
  local path=$1
  local title=$2
  local desc=$3
  cat > "src/app/(dashboard)/${path}/page.tsx" << EOF
"use client";
import { Card } from "@/components/ui/card";

export default function ${title}Page() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">${title}</h1>
        <p className="text-sm text-muted-foreground mt-1">${desc}</p>
      </div>
      <Card className="p-6 bg-card border-border">
        <p className="text-sm text-muted-foreground">Content will be added here...</p>
      </Card>
    </div>
  );
}
EOF
}

create_page "users/active" "ActiveUsers" "View and manage active user accounts"
create_page "users/inactive" "InactiveUsers" "View and manage inactive user accounts"
create_page "users/roles" "UserRoles" "Manage user roles and permissions"
create_page "users/permissions" "UserPermissions" "Configure user permissions and access control"
create_page "trades" "Trades" "View and manage all trading activities"
create_page "trades/open" "OpenPositions" "Monitor all currently open trading positions"
create_page "trades/closed" "ClosedPositions" "View history of closed trading positions"
create_page "trades/pending" "PendingOrders" "Manage pending and limit orders"
create_page "trades/history" "TradeHistory" "Complete trading history and records"
create_page "trades/analytics" "TradeAnalytics" "Advanced analytics and insights for trading activities"
create_page "funds" "Deposits" "Manage and monitor deposit requests"
create_page "funds/withdrawals" "Withdrawals" "Process and manage withdrawal requests"
create_page "funds/transactions" "Transactions" "View all financial transactions"
create_page "funds/requests" "FundRequests" "Review and process fund requests"
create_page "funds/balance" "BalanceManagement" "Manage user account balances"
create_page "ib" "IBOverview" "Introducing Broker management overview"
create_page "ib/accounts" "IBAccounts" "Manage Introducing Broker accounts"
create_page "ib/commissions" "IBCommissions" "Manage IB commissions and payouts"
create_page "ib/performance" "IBPerformance" "IB performance metrics and analytics"
create_page "ib/tiers" "IBTiers" "Configure IB tier structures"
create_page "charges" "FeeStructure" "Configure trading fees and charges"
create_page "charges/spreads" "SpreadManagement" "Manage instrument spreads"
create_page "charges/commissions" "CommissionRates" "Set commission rates for different instruments"
create_page "charges/swaps" "SwapRates" "Configure overnight swap rates"
create_page "charges/history" "ChargeHistory" "View historical charges and fees"
create_page "copy-trade" "CopyTradeOverview" "Monitor copy trading activities"
create_page "copy-trade/masters" "CopyTradeMasters" "Manage master traders"
create_page "copy-trade/followers" "CopyTradeFollowers" "Manage follower accounts"
create_page "copy-trade/performance" "CopyTradePerformance" "Copy trading performance analytics"
create_page "copy-trade/settings" "CopyTradeSettings" "Configure copy trading settings"

echo "All pages created successfully!"

