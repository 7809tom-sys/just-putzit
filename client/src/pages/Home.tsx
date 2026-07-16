import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Users, Sparkles, Shield, MessageCircle, ChevronRight, Star, Smartphone, Share2, MoreVertical, Plus, Megaphone } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, useRef } from "react";
import { LocalVenueBanner } from "@/components/LocalVenueBanner";
import { useSEO } from "@/hooks/useSEO";

// PWA install prompt hook
function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);
    const standalone = (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
    return outcome === 'accepted';
  };

  return { installPrompt, isInstalled, isIOS, triggerInstall };
}

export default function Home() {
  useSEO({
    title: "Just Putzit — Real Dates. Real Activities.",
    description: "Meet locals who actually want to go out. Find matches for activities, date nights, and real connections in your city. Free to join.",
    canonical: "https://justputzit.com/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Just Putzit",
      "operatingSystem": "Web, iOS, Android",
      "applicationCategory": "SocialNetworkingApplication",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": "Meet locals who actually want to go out. Find matches for activities, date nights, and real connections in your city.",
      "url": "https://justputzit.com",
    },
  });
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  // Redirect to onboarding if authenticated but not onboarded,
  // then to Sally's interview if onboarded but never interviewed.
  const { data: verifyStatus } = trpc.verification.getStatus.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && isAuthenticated && profile !== undefined) {
      if (!profile?.onboardingComplete) {
        navigate("/onboarding");
      } else if (!verifyStatus?.locationVerified && verifyStatus !== undefined) {
        navigate("/verify");
      } else if ((profile?.interviewCount ?? 0) === 0) {
        navigate("/interview");
      }
    }
  }, [loading, isAuthenticated, profile, verifyStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-2xl">🤖</span>
          </div>
          <p className="text-muted-foreground">Loading Just Putzit...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && profile?.onboardingComplete) {
    return <AuthenticatedHome user={user} profile={profile} />;
  }

  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative gradient-warm min-h-screen flex flex-col">
        {/* Top nav for landing */}
        <div className="container flex items-center justify-between py-5">
          <div className="flex items-center gap-2">
            <img src="/manus-storage/justputzit-logo-transparent_2e545ffa.png" alt="Just Putzit" className="h-10 w-auto object-contain" />
          </div>
          <a href={getLoginUrl()}>
            <Button className="gradient-sally text-white border-0 shadow-md btn-scale rounded-full px-6">
              Get Started
            </Button>
          </a>
        </div>

        {/* Hero content */}
        <div className="container flex-1 flex flex-col lg:flex-row items-center gap-12 py-16">
          <div className="flex-1 text-center lg:text-left">
            <Badge className="mb-4 bg-primary/10 text-primary border-0 rounded-full px-4 py-1.5 text-sm font-semibold">
              ✨ AI-Powered Real Connections
            </Badge>
            <h1 className="font-display text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Don't Swipe.
              <br />
              <span className="text-primary">Show Up.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Just Putzit connects you with real people for real experiences — powered by Sally, your AI guide who gets to know the real you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href={getLoginUrl()}>
                <Button size="lg" className="gradient-sally text-white border-0 shadow-lg btn-scale rounded-full px-8 text-lg gap-2">
                  <Sparkles className="w-5 h-5" />
                  Start Your Journey
                </Button>
              </a>
              <Button size="lg" variant="outline" className="rounded-full px-8 text-lg border-2">
                Learn More
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" />
                <span>Verified Profiles</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-primary" />
                <span>AI-Matched</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Local Events</span>
              </div>
            </div>
          </div>

          {/* Sally illustration */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div className="w-72 h-72 lg:w-96 lg:h-96 rounded-3xl bg-white shadow-2xl flex flex-col items-center justify-center p-8 animate-float">
                <div className="w-24 h-24 rounded-full gradient-sally flex items-center justify-center text-5xl mb-4 sally-glow animate-pulse-ring">
                  🤖
                </div>
                <div className="text-center">
                  <p className="font-display font-bold text-xl text-foreground mb-1">Hi! I'm Sally</p>
                  <p className="text-sm text-muted-foreground mb-4">Your AI Connection Guide</p>
                  <div className="bg-primary/10 rounded-2xl p-3 text-sm text-foreground max-w-48">
                    <span className="font-semibold text-primary">Sally:</span> "Tell me — what's your idea of a perfect Sunday? ☀️"
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg px-3 py-2 text-sm font-semibold text-primary flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-primary" /> 98% Match!
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg px-3 py-2 text-sm font-semibold text-green-600 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Networks Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Connecting You In Real Life
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're single, in a couple, or just looking for community — Just Putzit has a network for you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <NetworkCard
              gradient="gradient-singles"
              emoji="💙"
              title="Singles Network"
              items={["Find connections in person", "Local meetups & activities", "Build genuine relationships"]}
            />
            <NetworkCard
              gradient="gradient-couples"
              emoji="💚"
              title="Couples Network"
              items={["New friends for couples", "Shared hobbies & experiences", "Strengthen relationships together"]}
            />
            <NetworkCard
              gradient="gradient-community"
              emoji="🧡"
              title="Community Events"
              items={["Discover local happenings", "Join group outings & workshops", "Engage with your neighborhood"]}
            />
          </div>
        </div>
      </section>

      {/* Sally Features Section */}
      <section className="py-20 gradient-warm">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-primary/10 text-primary border-0 rounded-full px-4 py-1.5">
                🤖 Meet Sally AI
              </Badge>
              <h2 className="font-display text-4xl font-bold text-foreground mb-6">
                Your Personal AI Connection Guide
              </h2>
              <div className="space-y-4">
                {[
                  { icon: "🎤", title: "Intelligent AI Interviews", desc: "Sally gets to know you with a fun 90-second chat every time you log in" },
                  { icon: "🎯", title: "Personalized Matching", desc: "Your profile grows smarter with every session, leading to better matches" },
                  { icon: "🛡️", title: "Ensures Authenticity", desc: "Sally helps verify real users and keeps the community genuine" },
                  { icon: "🌍", title: "Real-World Connections", desc: "Every match is designed to lead to real in-person experiences" },
                ].map(f => (
                  <div key={f.title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl flex-shrink-0">
                      {f.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{f.title}</p>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="w-10 h-10 rounded-full gradient-sally flex items-center justify-center text-xl">🤖</div>
                <div>
                  <p className="font-bold text-sm">Sally AI Helper</p>
                  <p className="text-xs text-green-500 font-medium">● Online</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="chat-bubble-received px-4 py-3 text-sm max-w-xs">
                  Hi! I'm Sally. Let's explore your authentic personality with a few friendly questions! 🌟
                </div>
                <div className="chat-bubble-received px-4 py-3 text-sm max-w-xs">
                  <strong>1.</strong> What is your idea of a perfect Sunday?
                </div>
                <div className="chat-bubble-sent px-4 py-3 text-sm max-w-xs ml-auto">
                  I love hiking in the morning and then cooking a big dinner with friends! 🥾
                </div>
                <div className="chat-bubble-received px-4 py-3 text-sm max-w-xs">
                  That's wonderful! You sound like someone who loves adventure AND connection. Tell me more — if you could explore anywhere new, where would it be? ✈️
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Continuous Vetting for Total Peace of Mind
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Dynamic Re-Interview", desc: "Sally checks in with you every login to keep your profile fresh and authentic", emoji: "🎤" },
              { num: "2", title: "Live Background Audit", desc: "Liveness and location checks ensure every user is who they say they are", emoji: "🔒" },
              { num: "3", title: "100% Live Encounters", desc: "AI verification ensures every connection leads to real, safe in-person meetings", emoji: "✅" },
            ].map(s => (
              <div key={s.num} className="text-center p-8 rounded-3xl border-2 border-border card-hover">
                <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center text-2xl shadow-lg">
                  {s.emoji}
                </div>
                <Badge className="mb-3 bg-primary/10 text-primary border-0">{s.num}</Badge>
                <h3 className="font-display font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local venue banner ad slot — between Safety and Games sections */}
      <div className="bg-white py-4">
        <div className="container max-w-3xl">
          <LocalVenueBanner page="home" />
        </div>
      </div>

      {/* Games Section */}
      <section className="py-20 gradient-warm">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Fun Games to Break the Ice
            </h2>
            <p className="text-lg text-muted-foreground">Sally hosts interactive games that make getting to know each other genuinely fun</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: "💍", title: "Newlywed Game", desc: "Quiz each other on what you think your match answered — Sally scores your chemistry!" },
              { emoji: "🎭", title: "Two Truths & a Lie", desc: "Sally crafts statements from your profile — can your match spot the fib?" },
              { emoji: "⚡", title: "This or That", desc: "Rapid-fire either/or questions reveal how often your preferences align" },
            ].map(g => (
              <div key={g.title} className="game-card p-6 text-center">
                <div className="text-5xl mb-4">{g.emoji}</div>
                <h3 className="font-display font-bold text-xl mb-2">{g.title}</h3>
                <p className="text-muted-foreground text-sm">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get the App Section */}
      <GetTheAppSection />

      {/* CTA Section */}
      <section className="py-20 bg-white text-center">
        <div className="container max-w-2xl">
          <div className="w-20 h-20 rounded-full gradient-sally mx-auto mb-6 flex items-center justify-center text-4xl shadow-xl animate-float">
            🤖
          </div>
          <h2 className="font-display text-4xl font-bold text-foreground mb-4">
            Ready to Show Up?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join Just Putzit and let Sally help you find real connections, real activities, and real joy — right in your neighborhood.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="gradient-sally text-white border-0 shadow-lg btn-scale rounded-full px-10 text-lg gap-2">
              <Sparkles className="w-5 h-5" />
              Meet Sally & Get Started
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/manus-storage/justputzit-logo-transparent_2e545ffa.png" alt="Just Putzit" className="h-7 w-auto object-contain brightness-0 invert" />
          </div>
          <p className="text-sm opacity-60">© 2025 Just Putzit. Connecting you in real life.</p>
        </div>
      </footer>
    </div>
  );
}

function GetTheAppSection() {
  const { installPrompt, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [tab, setTab] = useState<'android' | 'ios'>('android');
  const [installed, setInstalled] = useState(false);

  if (isInstalled || installed) {
    return (
      <section className="py-16 bg-primary/5">
        <div className="container max-w-xl text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-2">App Installed!</h2>
          <p className="text-muted-foreground">Just Putzit is on your home screen. Tap the Just Putzit icon to open it anytime.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-primary/5">
      <div className="container max-w-2xl">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-primary/10 text-primary border-0 rounded-full px-4 py-1.5">
            <Smartphone className="w-3.5 h-3.5 mr-1.5" />
            Free App
          </Badge>
          <h2 className="font-display text-4xl font-bold text-foreground mb-4">
            Add Just Putzit to Your Phone
          </h2>
          <p className="text-muted-foreground text-lg">
            Install the app for free — no App Store required. Works just like a native app.
          </p>
        </div>

        {/* Smart install button for Android Chrome */}
        {installPrompt && (
          <div className="text-center mb-8">
            <Button
              size="lg"
              className="gradient-sally text-white border-0 shadow-lg btn-scale rounded-full px-10 text-lg gap-2"
              onClick={async () => {
                const ok = await triggerInstall();
                if (ok) setInstalled(true);
              }}
            >
              <Smartphone className="w-5 h-5" />
              Install App Now
            </Button>
            <p className="text-xs text-muted-foreground mt-2">One tap — no app store needed</p>
          </div>
        )}

        {/* Tab selector */}
        <div className="flex rounded-2xl bg-white shadow-sm border border-border p-1 mb-8 max-w-xs mx-auto">
          <button
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === 'android' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('android')}
          >
            Android
          </button>
          <button
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === 'ios' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('ios')}
          >
            iPhone
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-3xl shadow-lg border border-border p-8">
          {tab === 'android' ? (
            <div className="space-y-6">
              <InstallStep num={1} icon={<Smartphone className="w-5 h-5 text-primary" />}
                title="Open Chrome on your Android"
                desc="Visit justputzit.com in Chrome (not another browser)"
              />
              <InstallStep num={2} icon={<MoreVertical className="w-5 h-5 text-primary" />}
                title='Tap the menu (⋮) in the top-right'
                desc="The three-dot menu in the top-right corner of Chrome"
              />
              <InstallStep num={3} icon={<Plus className="w-5 h-5 text-primary" />}
                title='Tap "Add to Home screen"'
                desc="Then tap Add — the Just Putzit icon appears on your home screen"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <InstallStep num={1} icon={<Smartphone className="w-5 h-5 text-primary" />}
                title="Open Safari on your iPhone"
                desc="Must be Safari — Chrome on iPhone doesn't support install"
              />
              <InstallStep num={2} icon={<Share2 className="w-5 h-5 text-primary" />}
                title="Tap the Share button at the bottom"
                desc="The box with an arrow pointing up at the bottom of Safari"
              />
              <InstallStep num={3} icon={<Plus className="w-5 h-5 text-primary" />}
                title='Tap "Add to Home Screen" then Add'
                desc="The Just Putzit icon appears on your home screen — tap it anytime to open"
              />
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border flex items-center gap-3">
            <img src="/manus-storage/justputzit-logo-transparent_2e545ffa.png" alt="Just Putzit" className="w-12 h-12 object-contain flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Just Putzit</p>
              <p className="text-xs text-muted-foreground">Free · No App Store · Works offline</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InstallStep({ num, icon, title, desc }: { num: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-8 h-8 rounded-full gradient-sally flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
        {num}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          {icon}
          <p className="font-semibold text-foreground text-sm">{title}</p>
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function NetworkCard({ gradient, emoji, title, items }: { gradient: string; emoji: string; title: string; items: string[] }) {
  return (
    <div className={`${gradient} rounded-3xl p-8 card-hover`}>
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="font-display font-bold text-xl text-foreground mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AuthenticatedHome({ user, profile }: { user: any; profile: any }) {
  const [, navigate] = useLocation();
  const { data: myMatches } = trpc.matchmaking.getMyMatches.useQuery();
  const { data: notifications } = trpc.notifications.getAll.useQuery();
  const unread = notifications?.filter(n => !n.isRead).length ?? 0;

  const traits = profile?.traits as any;

  return (
    <div className="min-h-screen gradient-warm">
      <div className="container py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">
            Welcome back, {profile?.displayName || user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            {profile?.interviewCount === 0
              ? "Sally is ready to get to know you better!"
              : `You've had ${profile?.interviewCount} chat${profile?.interviewCount !== 1 ? "s" : ""} with Sally`}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickAction
            emoji="🤖"
            title="Talk to Sally"
            desc="90-sec daily interview"
            gradient="gradient-sally"
            textColor="text-white"
            onClick={() => navigate("/interview")}
          />
          <QuickAction
            emoji="💕"
            title="My Matches"
            desc={`${myMatches?.length ?? 0} connection${(myMatches?.length ?? 0) !== 1 ? "s" : ""}`}
            gradient="gradient-singles"
            textColor="text-foreground"
            onClick={() => navigate("/matches")}
          />
          <QuickAction
            emoji="🗺️"
            title="Local Activities"
            desc="Discover nearby events"
            gradient="gradient-community"
            textColor="text-foreground"
            onClick={() => navigate("/activities")}
          />
          <QuickAction
            emoji="👤"
            title="My Profile"
            desc="View & edit profile"
            gradient="gradient-couples"
            textColor="text-foreground"
            onClick={() => navigate("/profile")}
          />
        </div>

        {/* Identity completion prompt */}
        {(!((profile as any)?.gender) || !((profile as any)?.sexualOrientation) || !((profile as any)?.birthDate)) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Complete your identity info</p>
              <p className="text-xs text-amber-600">Add your gender, orientation, and age to get better matches</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full border-amber-300 text-amber-700 text-xs" onClick={() => navigate("/profile")}>
              Add info
            </Button>
          </div>
        )}

        {/* Sally suggestion */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full gradient-sally flex items-center justify-center text-2xl flex-shrink-0 animate-pulse-ring">
            🤖
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground mb-1">Sally says hi! 👋</p>
            <p className="text-muted-foreground text-sm mb-3">
              {profile?.interviewCount === 0
                ? "I can't wait to get to know you! Let's start with a quick 90-second chat to kick off your profile."
                : `Great to see you again! I have some new questions to help refine your profile and find you even better matches.`}
            </p>
            <Button
              size="sm"
              className="gradient-sally text-white border-0 rounded-full gap-2 btn-scale"
              onClick={() => navigate("/interview")}
            >
              <MessageCircle className="w-4 h-4" />
              Chat with Sally
            </Button>
          </div>
        </div>

        {/* Refer a Friend banner */}
        <div
          className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-5 mb-6 flex items-center gap-4 cursor-pointer card-hover"
          onClick={() => navigate("/shout-out")}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-base">Refer a Friend 🎉</p>
            <p className="text-white/80 text-sm">Invite friends from your contacts — the more the merrier!</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
        </div>

        {/* Local venue banner ad slot */}
        <LocalVenueBanner page="home" className="mb-6" />

        {/* Recent matches */}
        {myMatches && myMatches.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl">Your Matches</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => navigate("/matches")}>
                See all <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myMatches.slice(0, 3).map(match => (
                <MatchCard key={match.id} match={match} onChat={() => navigate(`/chat/${match.id}`)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickAction({ emoji, title, desc, gradient, textColor, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`${gradient} rounded-2xl p-5 text-left card-hover w-full border-0 cursor-pointer`}
    >
      <div className="text-3xl mb-2">{emoji}</div>
      <p className={`font-bold ${textColor}`}>{title}</p>
      <p className={`text-xs ${textColor} opacity-70`}>{desc}</p>
    </button>
  );
}

function MatchCard({ match, onChat }: any) {
  const profile = match.otherProfile;
  const traits = profile?.traits as any;
  return (
    <div className="border border-border rounded-2xl p-4 card-hover">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ background: profile?.avatarColor || "#f97316" }}
        >
          {profile?.avatarEmoji || "😊"}
        </div>
        <div>
          <p className="font-bold text-sm">{profile?.displayName || "Mystery Match"}</p>
          <p className="text-xs text-primary font-semibold">{match.compatibilityScore}% compatible</p>
        </div>
      </div>
      {traits?.personalityKeywords && (
        <div className="flex flex-wrap gap-1 mb-3">
          {traits.personalityKeywords.slice(0, 3).map((k: string) => (
            <Badge key={k} variant="secondary" className="text-xs rounded-full">{k}</Badge>
          ))}
        </div>
      )}
      <Button size="sm" variant="outline" className="w-full rounded-full gap-2" onClick={onChat}>
        <MessageCircle className="w-3 h-3" /> Chat
      </Button>
    </div>
  );
}
