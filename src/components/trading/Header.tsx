"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, ChevronDown, Wallet, CreditCard, Trophy, UserPlus } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WalletData {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  floatingProfit: number;
}

interface AccountData {
  _id: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  floatingProfit: number;
}

interface ChallengeAccountData {
  _id: string;
  accountNumber: string;
  challengeType: string;
  accountSize: number;
  currentBalance: number;
  targetBalance: number;
  targetProfit: number;
  profitTarget: number;
  currentProfit: number;
  status: string;
  result: string;
}

interface UserData {
  name: string;
  userId: number;
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [activeAccountType, setActiveAccountType] = useState<'wallet' | 'trading' | 'challenge'>('wallet');
  const [challengeAccounts, setChallengeAccounts] = useState<ChallengeAccountData[]>([]);
  const [activeChallengeAccount, setActiveChallengeAccount] = useState<ChallengeAccountData | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [activeAccount, setActiveAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Load saved account type preference (only on client)
    if (typeof window !== 'undefined') {
      const savedType = localStorage.getItem('activeAccountType') as 'trading' | 'wallet' | 'challenge' | null;
      if (savedType && (savedType === 'trading' || savedType === 'wallet' || savedType === 'challenge')) {
        setActiveAccountType(savedType);
      }
    }
    fetchUserData();
    fetchWallet();
    fetchAccounts();
    fetchChallengeAccounts();
    
    // Check SL/TP every 5 seconds
    const slTpInterval = setInterval(async () => {
      try {
        await fetch('/api/user/trades/check-sl-tp', {
          method: 'POST',
          credentials: 'include',
        });
        // Refresh wallet after checking SL/TP
        fetchWallet();
      } catch (error) {
        // Silently handle error
      }
    }, 5000);
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchWallet();
      fetchAccounts();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      clearInterval(slTpInterval);
    };
  }, []);

  useEffect(() => {
    // Get active account based on selected type and ID
    if (activeAccountType === 'wallet') {
      setActiveAccount(null);
    } else if (activeAccountId) {
      const account = accounts.find(a => a.accountType === activeAccountType && a._id === activeAccountId);
      setActiveAccount(account || null);
    } else {
      // Default to first account of selected type
      const account = accounts.find(a => a.accountType === activeAccountType);
      setActiveAccount(account || null);
      if (account) {
        setActiveAccountId(account._id);
      }
    }
  }, [accounts, activeAccountType, activeAccountId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      // Silently handle error - user will be redirected by middleware if not authenticated
    }
  };

  const fetchWallet = async () => {
    try {
      const response = await fetch("/api/user/wallet", {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.wallet);
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/user/accounts", {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      // Silently handle error
    }
  };

  const fetchChallengeAccounts = async () => {
    try {
      const response = await fetch("/api/user/challenges/purchase", {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && data.challenges) {
        setChallengeAccounts(data.challenges);
        // Set first active challenge as default
        const activeChallenge = data.challenges.find((c: ChallengeAccountData) => c.status === 'active');
        if (activeChallenge) {
          setActiveChallengeAccount(activeChallenge);
        }
      }
    } catch (error) {
      // Silently handle error
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Logged out successfully");
        window.location.href = "/login";
      } else {
        toast.error(data.message || "Failed to logout");
      }
    } catch (error) {
      toast.error("An error occurred during logout");
      window.location.href = "/login";
    }
  };

  // Prevent hydration mismatch by ensuring we have data before rendering
  if (!mounted) {
    return (
      <header className="h-12 lg:h-14 bg-card border-b border-border flex items-center justify-between px-2 lg:px-4">
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-1 lg:gap-2">
            <span className="text-primary font-bold text-base lg:text-xl">PROTRADER</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </header>
    );
  }

  // Get display data based on account type
  const getDisplayData = () => {
    if (activeAccountType === 'wallet') return wallet;
    if (activeAccountType === 'challenge' && activeChallengeAccount) {
      return {
        balance: activeChallengeAccount.currentBalance || activeChallengeAccount.accountSize,
        equity: activeChallengeAccount.currentBalance || activeChallengeAccount.accountSize,
        margin: 0,
        freeMargin: activeChallengeAccount.currentBalance || activeChallengeAccount.accountSize,
        marginLevel: 0,
        floatingProfit: activeChallengeAccount.currentProfit || 0,
      };
    }
    return activeAccount || wallet;
  };
  
  const displayData = getDisplayData();
  const accountName = activeAccountType === 'wallet'
    ? 'Wallet'
    : activeAccountType === 'challenge'
      ? activeChallengeAccount 
        ? `Challenge #${activeChallengeAccount.accountNumber}`
        : 'Select Challenge'
      : activeAccount 
        ? `${(activeAccount as any).accountTypeName || (activeAccount as any).accountType} #${activeAccount.accountNumber}`
        : 'Select Account';

  if (loading || !displayData || !user) {
    return (
      <header className="h-12 lg:h-14 bg-card border-b border-border flex items-center justify-between px-2 lg:px-4">
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-1 lg:gap-2">
            <span className="text-primary font-bold text-base lg:text-xl">PROTRADER</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </header>
    );
  }

  const marginLevelDisplay = displayData.marginLevel > 0 
    ? `${displayData.marginLevel.toFixed(2)}%` 
    : "0.00%";

  return (
    <header className="h-12 lg:h-14 bg-card border-b border-border flex items-center justify-between px-2 lg:px-4">
      <div className="flex items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-1 lg:gap-2">
          <span className="text-primary font-bold text-base lg:text-xl">PROTRADER</span>
        </div>
        {/* Mobile Equity Display */}
        <div className="md:hidden text-center">
          <div className="text-muted-foreground text-[10px]">Equity</div>
          <div className="text-foreground font-semibold text-sm font-mono">${displayData.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-6">
        <div className="hidden lg:flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground text-xs">Margin</div>
            <div className="font-semibold font-mono">${displayData.margin.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground text-xs">Free margin</div>
            <div className="font-semibold font-mono">${displayData.freeMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground text-xs">Margin level</div>
            <div className="font-semibold">{marginLevelDisplay}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground text-xs">Equity</div>
            <div className="font-semibold font-mono">${displayData.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="hidden md:flex lg:hidden items-center gap-4 text-xs">
          <div className="text-center">
            <div className="text-muted-foreground text-[10px]">Equity</div>
            <div className="font-semibold font-mono">${displayData.equity.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={`h-8 lg:h-9 px-2 lg:px-3 text-xs lg:text-sm ${activeAccountType === 'challenge' ? 'border-amber-500 bg-amber-500/10' : ''}`}>
                <span className="hidden sm:inline">
                  {activeAccountType === 'wallet' ? 'Wallet' : activeAccountType === 'trading' ? 'Trading' : 'Challenge'}
                </span>
                {activeAccountType === 'challenge' && activeChallengeAccount && (
                  <span className="hidden md:inline ml-1">
                    #{activeChallengeAccount.accountNumber}
                  </span>
                )}
                {activeAccountType === 'trading' && activeAccount && (
                  <span className="hidden md:inline ml-1">
                    {(activeAccount as any).accountTypeName || (activeAccount as any).accountType} #{activeAccount.accountNumber}
                  </span>
                )}
                <span className="ml-1 font-semibold">
                  ${displayData.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => {
                  setActiveAccountType('wallet');
                  setActiveAccountId(null);
                  localStorage.setItem('activeAccountType', 'wallet');
                  localStorage.removeItem('activeAccountId');
                }}
                className={activeAccountType === 'wallet' ? 'bg-accent' : ''}
              >
                <Wallet className="w-4 h-4 mr-2" />
                <div className="flex-1">
                  <div className="font-medium">Wallet</div>
                  <div className="text-xs text-muted-foreground">${wallet?.balance.toFixed(2) || '0.00'}</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Trading Accounts</DropdownMenuLabel>
              
              {accounts.filter(a => (a as any).accountType === 'trading').map((account) => (
                <DropdownMenuItem
                  key={account._id}
                  onClick={() => {
                    setActiveAccountType('trading');
                    setActiveAccountId(account._id);
                    localStorage.setItem('activeAccountType', 'trading');
                    localStorage.setItem('activeAccountId', account._id);
                  }}
                  className={activeAccountType === 'trading' && activeAccountId === account._id ? 'bg-accent' : ''}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  <div className="flex-1">
                    <div className="font-medium">
                      {(account as any).accountTypeName || 'Trading'} #{account.accountNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">${account.balance.toFixed(2)}</div>
                  </div>
                </DropdownMenuItem>
              ))}

              {challengeAccounts.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Challenge Accounts</DropdownMenuLabel>
                  {challengeAccounts.filter(c => c.status === 'active').map((challenge) => (
                    <DropdownMenuItem
                      key={challenge._id}
                      onClick={() => {
                        setActiveAccountType('challenge');
                        setActiveChallengeAccount(challenge);
                        localStorage.setItem('activeAccountType', 'challenge');
                        localStorage.setItem('activeChallengeId', challenge._id);
                      }}
                      className={activeAccountType === 'challenge' && activeChallengeAccount?._id === challenge._id ? 'bg-accent' : ''}
                    >
                      <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                      <div className="flex-1">
                        <div className="font-medium">
                          {challenge.challengeType === 'one_step' ? 'One Step' : challenge.challengeType === 'two_step' ? 'Two Step' : 'Zero Step'} #{challenge.accountNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${(challenge.currentBalance || challenge.accountSize).toLocaleString()} 
                          <span className="text-amber-500 ml-1">Target: {challenge.profitTarget}%</span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/buy-challenge'}>
                <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                Buy Challenge
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/challenge-dashboard'}>
                <Trophy className="w-4 h-4 mr-2" />
                Challenge Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-primary/10 border-primary text-primary hover:bg-primary hover:text-primary-foreground h-8 px-2 lg:px-4 text-xs lg:text-sm hidden md:flex"
            onClick={() => window.location.href = "/deposit"}
          >
            Top up
          </Button>
          
          {/* Mobile IB Button */}
          <Button 
            variant="outline" 
            size="icon" 
            className="md:hidden bg-primary/10 border-primary text-primary hover:bg-primary hover:text-primary-foreground h-8 w-8"
            onClick={() => window.location.href = "/become-ib"}
            title="Become IB"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
