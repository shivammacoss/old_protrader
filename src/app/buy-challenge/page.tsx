"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/trading/Header";
import { Sidebar } from "@/components/trading/Sidebar";
import { MobileNav } from "@/components/ui/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings2, Check, Target } from "lucide-react";
import { toast } from "sonner";

const defaultChallengeTypes = [
  { id: 'one_step', name: 'One Step', description: 'Single phase evaluation' },
  { id: 'two_step', name: 'Two Step', description: 'Two phase evaluation' },
  { id: 'zero_step', name: 'Zero Step', description: 'Instant funding' },
];

interface AccountSizePrice {
  size: number;
  price: number;
}

interface ProfitTargetModifier {
  target: number;
  modifier: number;
  isDefault: boolean;
}

interface ChallengeSettings {
  challengeTypePrices: {
    one_step: number;
    two_step: number;
    zero_step: number;
  };
  accountSizePrices: AccountSizePrice[];
  profitTargetModifiers: ProfitTargetModifier[];
}

export default function BuyChallengePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<ChallengeSettings | null>(null);
  const [selectedType, setSelectedType] = useState('two_step');
  const [selectedTarget, setSelectedTarget] = useState(8);
  const [selectedSize, setSelectedSize] = useState(100000);
  const [couponCode, setCouponCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/challenge-settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        // Set defaults
        if (data.settings.accountSizePrices?.length > 0) {
          setSelectedSize(data.settings.accountSizePrices[data.settings.accountSizePrices.length - 1].size);
        }
        const defaultTarget = data.settings.profitTargetModifiers?.find((t: ProfitTargetModifier) => t.isDefault);
        if (defaultTarget) {
          setSelectedTarget(defaultTarget.target);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBasePrice = () => {
    if (!settings) return 0;
    const sizeOption = settings.accountSizePrices.find(s => s.size === selectedSize);
    return sizeOption?.price || 0;
  };

  const getTypePrice = () => {
    if (!settings) return 0;
    return settings.challengeTypePrices[selectedType as keyof typeof settings.challengeTypePrices] || 0;
  };

  const getTargetModifier = () => {
    if (!settings) return 0;
    const target = settings.profitTargetModifiers.find(t => t.target === selectedTarget);
    return target?.modifier || 0;
  };

  const getTotalPrice = () => {
    return getBasePrice() + getTypePrice() + getTargetModifier();
  };

  const getChallengeName = () => {
    const type = defaultChallengeTypes.find(t => t.id === selectedType);
    return `${type?.name} Challenge`;
  };

  const getTargetProfit = () => {
    return (selectedSize * selectedTarget) / 100;
  };

  const getTargetBalance = () => {
    return selectedSize + getTargetProfit();
  };

  const handlePurchase = async () => {
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/user/challenges/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          challengeType: selectedType,
          profitTarget: selectedTarget,
          accountSize: selectedSize,
          price: getTotalPrice(),
          couponCode: couponCode || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Challenge purchased successfully!');
        router.push('/challenge-dashboard');
      } else {
        toast.error(data.message || 'Failed to purchase challenge');
      }
    } catch (error) {
      toast.error('Failed to process purchase');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onOpenInstruments={() => {}} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="container mx-auto p-4 lg:p-6 max-w-6xl">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">New Challenge</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Challenge Type */}
                <div>
                  <h3 className="font-semibold mb-1">Challenge Type</h3>
                  <p className="text-sm text-muted-foreground mb-4">Choose the type of challenge you want to take</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {defaultChallengeTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedType === type.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedType === type.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                          }`}>
                            {selectedType === type.id && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className="font-medium">{type.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customise Trading Rules */}
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 mb-6">
                      <div className="p-2 bg-muted rounded-lg">
                        <Settings2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Customise Trading Rules</h3>
                        <p className="text-sm text-muted-foreground">Adjust your challenge parameters to match your trading style</p>
                      </div>
                    </div>

                    {/* Profit Target */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-1">Profit Target</h4>
                      <p className="text-sm text-muted-foreground mb-3">Choose options for profit target</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(settings?.profitTargetModifiers || []).map((target) => (
                          <button
                            key={target.target}
                            onClick={() => setSelectedTarget(target.target)}
                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                              selectedTarget === target.target
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-muted-foreground/50'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                selectedTarget === target.target ? 'border-primary bg-primary' : 'border-muted-foreground'
                              }`}>
                                {selectedTarget === target.target && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              <span className="font-medium">{target.target}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {target.isDefault ? 'Default' : target.modifier > 0 ? `+$${target.modifier}` : `$${target.modifier}`}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Size */}
                <div>
                  <h3 className="font-semibold mb-1">Account Size</h3>
                  <p className="text-sm text-muted-foreground mb-4">Choose your preferred account size</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {(settings?.accountSizePrices || []).map((sizeOption) => (
                      <button
                        key={sizeOption.size}
                        onClick={() => setSelectedSize(sizeOption.size)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          selectedSize === sizeOption.size
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedSize === sizeOption.size ? 'border-primary bg-primary' : 'border-muted-foreground'
                          }`}>
                            {selectedSize === sizeOption.size && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className="font-medium text-sm">${sizeOption.size.toLocaleString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="space-y-4">
                {/* Coupon Code */}
                <div>
                  <h3 className="font-semibold mb-1">Coupon Code</h3>
                  <p className="text-sm text-muted-foreground mb-3">Enter a coupon code to get a discount on your challenge</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button variant="outline">Apply</Button>
                  </div>
                </div>

                {/* Target Price Card */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Your Target</p>
                        <p className="text-xl font-bold text-primary">${getTargetBalance().toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Starting Balance</p>
                        <p className="font-semibold">${selectedSize.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Profit Required</p>
                        <p className="font-semibold text-green-500">+${getTargetProfit().toLocaleString()} ({selectedTarget}%)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Summary Card */}
                <Card className="bg-card border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">${selectedSize.toLocaleString()}.00 — {getChallengeName()}</p>
                        <p className="text-sm text-muted-foreground">Platform: MetaTrader 5</p>
                      </div>
                      <p className="font-semibold">${getTotalPrice().toFixed(2)}</p>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total</span>
                        <span className="text-2xl font-bold">${getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Terms */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="terms"
                          checked={agreedToTerms}
                          onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                        />
                        <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                          I agree with all the following terms:
                        </Label>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1 pl-6">
                        <li>• I have read and agreed to the Terms of Use.</li>
                        <li>• All information provided is correct and matches government-issued ID.</li>
                        <li>• I have read and agree with the Terms & Conditions.</li>
                        <li>• I confirm that I am not a U.S. citizen or resident.</li>
                      </ul>
                    </div>

                    <Button 
                      className="w-full bg-primary hover:bg-primary/90" 
                      size="lg"
                      onClick={handlePurchase}
                      disabled={processing || !agreedToTerms}
                    >
                      {processing ? 'Processing...' : 'Continue to Payment'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
