"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", ref: undefined as string | undefined });
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams?.get?.('ref');
    if (ref) {
      setIsLogin(false);
      setSignupForm((s) => ({ ...s, ref }));
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.user) {
          router.push('/');
        }
      } catch (error) {
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router, searchParams]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.email || !loginForm.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message || 'Logged in successfully');
        setLoginForm({ email: "", password: "" });
        await new Promise(resolve => setTimeout(resolve, 200));
        window.location.href = '/';
      } else {
        toast.error(data.message || 'Login failed. Please check your credentials.');
        setLoginForm({ ...loginForm, password: "" });
      }
    } catch (error: any) {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupForm.firstName || !signupForm.email || !signupForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!agreeTerms) {
      toast.error('Please agree to the Terms & Conditions');
      return;
    }

    if (signupForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        name: `${signupForm.firstName} ${signupForm.lastName}`.trim(),
        email: signupForm.email,
        phone: signupForm.phone || undefined,
        password: signupForm.password,
      };
      if (signupForm.ref) body.ref = signupForm.ref;

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message || 'Account created successfully');
        setSignupForm({ firstName: "", lastName: "", email: "", phone: "", password: "", ref: undefined });
        await new Promise(resolve => setTimeout(resolve, 200));
        window.location.href = '/';
      } else {
        toast.error(data.message || 'Signup failed. Please try again.');
        setSignupForm({ ...signupForm, password: "" });
      }
    } catch (error: any) {
      toast.error(`Network error: ${error.message || 'Please check your connection and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-white/60">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-purple-950/60 to-background" />
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white tracking-wider">PROTRADER</h1>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white/80 text-sm hover:bg-white/5 transition-colors">
              Back to website <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square">
              <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 via-transparent to-transparent rounded-3xl" />
              <div className="absolute inset-0 flex items-end justify-center pb-8">
                <div className="w-3/4 h-3/4 bg-gradient-to-br from-purple-500/30 to-indigo-600/20 rounded-full blur-3xl" />
              </div>
              <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <path 
                  d="M50 350 Q100 300 150 320 T250 250 T350 200" 
                  stroke="url(#chartGradient)" 
                  strokeWidth="3" 
                  fill="none"
                  className="drop-shadow-lg"
                />
                <circle cx="350" cy="200" r="8" fill="#a855f7" className="animate-pulse" />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-4xl font-light text-white mb-2">Trade Smarter,</h2>
            <h2 className="text-4xl font-light text-white">Grow Faster</h2>
            <div className="flex justify-center gap-2 mt-8">
              <div className="w-8 h-1 rounded-full bg-white/30" />
              <div className="w-8 h-1 rounded-full bg-white/30" />
              <div className="w-8 h-1 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-wider">PROTRADER</h1>
          </div>

          <h2 className="text-4xl font-semibold text-white mb-2">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-white/50 mb-8">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-white underline underline-offset-4 hover:text-purple-400 transition-colors"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>

          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="h-14 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="h-14 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl pr-12 focus:border-purple-500 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl text-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Log in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="First name"
                  value={signupForm.firstName}
                  onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                  className="h-14 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                />
                <Input
                  type="text"
                  placeholder="Last name"
                  value={signupForm.lastName}
                  onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                  className="h-14 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="h-14 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  className="h-14 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl pr-12 focus:border-purple-500 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox 
                  id="terms" 
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                  className="border-border data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <label htmlFor="terms" className="text-white/60 text-sm">
                  I agree to the <span className="text-purple-400 cursor-pointer hover:underline">Terms & Conditions</span>
                </label>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl text-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          )}

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">Or {isLogin ? 'login' : 'register'} with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button 
                type="button"
                variant="outline" 
                className="h-14 bg-secondary border-border text-foreground hover:bg-accent rounded-xl"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button 
                type="button"
                variant="outline" 
                className="h-14 bg-secondary border-border text-foreground hover:bg-accent rounded-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-white/60">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
