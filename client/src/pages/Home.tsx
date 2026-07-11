import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Users, Sparkles, Shield, MessageCircle, ChevronRight, Star } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

export default function Home() {
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
            <div className="w-10 h-10 rounded-full gradient-sally flex items-center justify-center text-white font-bold shadow-lg">
              JP
            </div>
            <span className="font-display font-bold text-2xl text-foreground">Just Putzit</span>
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
            <div className="w-7 h-7 rounded-full gradient-sally flex items-center justify-center text-white font-bold text-xs">JP</div>
            <span className="font-display font-bold">Just Putzit</span>
          </div>
          <p className="text-sm opacity-60">© 2025 Just Putzit. Connecting you in real life.</p>
        </div>
      </footer>
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
