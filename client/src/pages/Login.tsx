import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { Eye, EyeOff, Heart, Fingerprint, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { startAuthentication } from "@simplewebauthn/browser";

// ─── Login Ad Overlay ─────────────────────────────────────────────────────────
interface LoginAdProps {
  ad: { id: number; title: string; videoUrl: string; ctaText?: string | null; ctaUrl?: string | null; durationSeconds: number };
  onComplete: () => void;
}

function LoginAdOverlay({ ad, onComplete }: LoginAdProps) {
  const [secondsLeft, setSecondsLeft] = useState(ad.durationSeconds);
  const [canSkip, setCanSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordImpression = trpc.loginAds.recordImpression.useMutation();

  useEffect(() => {
    // Record impression once
    recordImpression.mutate({ adId: ad.id });
    // Countdown
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setCanSkip(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Sponsored label */}
      <div className="absolute top-4 left-4 text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
        Sponsored
      </div>

      {/* Video */}
      <div className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          src={ad.videoUrl}
          autoPlay
          muted={false}
          playsInline
          className="w-full h-full object-cover"
          onEnded={() => setCanSkip(true)}
        />
      </div>

      {/* Ad title */}
      <div className="mt-4 text-center">
        <p className="text-white font-semibold text-lg">{ad.title}</p>
        <p className="text-white/60 text-sm mt-1">Getting your matches ready...</p>
      </div>

      {/* CTA + timer */}
      <div className="mt-6 flex items-center gap-4">
        {ad.ctaUrl && ad.ctaText && (
          <a
            href={ad.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-5 py-2 rounded-full transition-colors"
          >
            {ad.ctaText}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {canSkip ? (
          <button
            onClick={onComplete}
            className="bg-white text-black font-semibold px-5 py-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            Continue →
          </button>
        ) : (
          <div className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-mono">
            {secondsLeft}s
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function Login() {
  const { isAuthenticated, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showAd, setShowAd] = useState(false);
  const [pendingNav, setPendingNav] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const utils = trpc.useUtils();

  // Fetch active ad
  const { data: activeAd } = trpc.loginAds.getActive.useQuery(undefined, { staleTime: 60_000 });

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/");
  }, [loading, isAuthenticated]);

  const handleLoginSuccess = useCallback(() => {
    refresh?.();
    toast.success("Welcome back!");
    if (activeAd) {
      // Show ad before navigating
      setShowAd(true);
      setPendingNav(true);
    } else {
      navigate("/");
    }
  }, [activeAd, refresh, navigate]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: handleLoginSuccess,
    onError: () => {
      setError("Invalid email or password. Please try again.");
    },
  });

  // Biometric auth
  const authOptionsMutation = trpc.passkey.authOptions.useQuery(
    { email },
    { enabled: false }
  );
  const verifyAuthMutation = trpc.passkey.verifyAuth.useMutation({
    onSuccess: (data) => {
      refresh?.();
      toast.success(`Welcome back, ${data.user.name ?? "there"}! 👋`);
      if (activeAd) {
        setShowAd(true);
        setPendingNav(true);
      } else {
        navigate("/");
      }
    },
    onError: (err) => {
      setError(err.message ?? "Biometric sign-in failed. Try your password.");
    },
  });

  async function handleBiometricLogin() {
    if (!email) {
      setError("Enter your email address first, then tap the biometric button.");
      return;
    }
    setBiometricLoading(true);
    setError("");
    try {
      // Fetch auth options (challenge) from server
      const result = await utils.passkey.authOptions.fetch({ email });
      const { options, userId } = result;
      // Trigger browser biometric prompt
      const authResponse = await startAuthentication({ optionsJSON: options });
      // Verify with server
      verifyAuthMutation.mutate({ userId, response: authResponse });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("No passkey") || message.includes("not found")) {
        setError("No biometric registered for this account. Log in with password first, then set it up in Settings.");
      } else if (message.includes("cancel") || message.includes("abort")) {
        setError("Biometric cancelled.");
      } else {
        setError("Biometric sign-in failed. Try your password.");
      }
    } finally {
      setBiometricLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    loginMutation.mutate({ email, password });
  }

  if (loading) return null;

  // Show ad overlay after successful login
  if (showAd && activeAd) {
    return (
      <LoginAdOverlay
        ad={activeAd}
        onComplete={() => {
          setShowAd(false);
          navigate("/");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-orange-950/10">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full gradient-sally mx-auto flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold">Just Putzit</h1>
          <p className="text-muted-foreground text-sm">Welcome back — Sally missed you.</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Log in</CardTitle>
            <CardDescription>Enter your email and password to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login button row: password + biometric side by side */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 gradient-sally text-white font-semibold"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Log in"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="px-4 bg-background border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/5 text-orange-500"
                  onClick={handleBiometricLogin}
                  disabled={biometricLoading || verifyAuthMutation.isPending}
                  title="Sign in with Face ID / Fingerprint"
                >
                  <Fingerprint className={`w-5 h-5 ${biometricLoading ? "animate-pulse" : ""}`} />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center -mt-1">
                Tap <Fingerprint className="w-3 h-3 inline" /> to use Face ID or fingerprint
              </p>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Manus OAuth fallback */}
            <Button
              variant="outline"
              className="w-full bg-background"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Continue with Manus account
            </Button>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-orange-500 hover:text-orange-400 font-medium">
                Sign up free
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security layers badge */}
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Email + Password
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Biometric (Face ID / Fingerprint)
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            GPS Verified
          </span>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          No fake profiles. No bots. Real people only.
        </p>
      </div>
    </div>
  );
}
