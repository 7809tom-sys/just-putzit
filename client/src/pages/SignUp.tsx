import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Eye, EyeOff, Heart, MapPin, Shield } from "lucide-react";
import { toast } from "sonner";

const LAUNCH_CITIES = [
  { value: "milwaukee", label: "Milwaukee, WI" },
  { value: "waukesha", label: "Waukesha, WI (Carroll University)" },
];

export default function SignUp() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("milwaukee");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/");
  }, [loading, isAuthenticated]);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Welcome to Just Putzit! Let's get you set up.");
      navigate("/onboarding");
    },
    onError: (err) => {
      if (err.message.includes("already registered")) {
        setErrors({ email: "This email is already registered. Try logging in." });
      } else {
        toast.error(err.message || "Registration failed. Please try again.");
      }
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.includes("@")) e.email = "Valid email required";
    if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    registerMutation.mutate({ email, password, name: name.trim(), claimedCity: city });
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-orange-950/10">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full gradient-sally mx-auto flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold">Just Putzit</h1>
          <p className="text-muted-foreground text-sm">Real people. Real places. Real connections.</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Join the community — it's free, always.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  placeholder="First name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="given-name"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
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
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              {/* Confirm password */}
              <div className="space-y-1">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Same password again"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>

              {/* City */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  Your city
                </Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAUNCH_CITIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  We'll verify you're actually here — no out-of-town fakes.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full gradient-sally text-white font-semibold"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating account..." : "Create my account"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-orange-500 hover:text-orange-400 font-medium">
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Trust note */}
        <p className="text-center text-xs text-muted-foreground">
          No fake profiles. No bots. Real people only — verified by GPS.
        </p>
      </div>
    </div>
  );
}
