import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Calendar, Dumbbell, TrendingUp, Star, Crown, ChevronRight, Mail, Phone } from "lucide-react";

const TIERS = [
  {
    name: "Basic",
    price: "$49",
    color: "border-blue-500/40",
    badgeClass: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    badge: "✓ Basic",
    features: [
      "Gym profile page on Just Putzit",
      "Buddy matching for your members",
      "Group session scheduling",
      "Listed in Milwaukee/Waukesha directory",
    ],
    cta: "Get Started",
    ctaClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  {
    name: "Featured",
    price: "$99",
    popular: true,
    color: "border-orange-500/60",
    badgeClass: "bg-orange-500/20 text-orange-600 border-orange-500/40",
    badge: "⭐ Featured",
    features: [
      "Everything in Basic",
      "Featured badge on your gym card",
      "Priority placement in search results",
      "Membership referral link with tracking",
      "Banner ad slot on Gym Buddy pages",
    ],
    cta: "Most Popular",
    ctaClass: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  {
    name: "Premium",
    price: "$199",
    color: "border-yellow-500/60",
    badgeClass: "bg-yellow-500/20 text-yellow-600 border-yellow-500/40",
    badge: "🏆 Premium",
    features: [
      "Everything in Featured",
      "Gold badge + homepage spotlight",
      "Dedicated referral code for members",
      "Monthly analytics report",
      "Push notifications to nearby users",
      "Priority customer support",
    ],
    cta: "Go Premium",
    ctaClass: "bg-yellow-500 hover:bg-yellow-600 text-white",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: "📋",
    title: "We List Your Gym",
    desc: "We create a branded gym profile on Just Putzit with your amenities, hours, and membership link.",
  },
  {
    step: "2",
    icon: "🤝",
    title: "Members Find Buddies",
    desc: "Your members match with compatible workout partners at your gym — by style, schedule, and goals.",
  },
  {
    step: "3",
    icon: "📅",
    title: "They Schedule Sessions",
    desc: "Buddies book group sessions at your facility, driving more consistent attendance and retention.",
  },
  {
    step: "4",
    icon: "📈",
    title: "You Grow",
    desc: "Referral links, banner ads, and partner badges drive new membership sign-ups directly to your gym.",
  },
];

const BENEFITS = [
  { icon: <Users className="w-5 h-5" />, title: "Increase Member Retention", desc: "Members with workout partners are 3× more likely to stay long-term." },
  { icon: <TrendingUp className="w-5 h-5" />, title: "Drive New Sign-Ups", desc: "Referral tracking links and featured placement bring new members to your door." },
  { icon: <Calendar className="w-5 h-5" />, title: "Fill Slow Hours", desc: "Group session scheduling fills off-peak time slots with motivated members." },
  { icon: <Dumbbell className="w-5 h-5" />, title: "Zero Extra Work", desc: "We handle the app. You focus on running a great gym." },
];

export default function GymPitch() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1a0a00 0%, #7c1d00 40%, #c0390a 75%, #ff6b35 100%)" }}
      >
        {/* Decorative rings */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border-2 border-white/5" />
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full border border-white/8" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full border border-white/5 -translate-x-1/2 translate-y-1/2" />

        <div className="relative max-w-2xl mx-auto px-6 pt-14 pb-12">
          {/* Logo/brand */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-white/60 text-sm font-semibold tracking-wide">Just Putzit</span>
            <span className="text-white/30">•</span>
            <span className="text-orange-300 text-sm font-semibold">Gym Partner Program</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-none mb-4" style={{ letterSpacing: "-0.02em" }}>
            Bring More Members.<br />
            <span className="text-orange-300">Keep Them Longer.</span>
          </h1>
          <p className="text-white/75 text-lg leading-relaxed mb-8 max-w-lg">
            Just Putzit's Gym Buddy program connects your members with compatible workout partners — driving retention, referrals, and real results for your gym.
          </p>

          {/* Social proof pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              "🏋️ Crunch Fitness Partner",
              "📍 Milwaukee & Waukesha",
              "⚡ Free for members",
              "📈 Referral tracking included",
            ].map(p => (
              <span key={p} className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                {p}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-white text-orange-700 hover:bg-orange-50 font-bold text-base px-7 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95"
              onClick={() => window.open("mailto:gyms@justputzit.com?subject=Gym%20Partnership%20Inquiry", "_blank")}
            >
              Partner With Us →
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 font-semibold text-base px-7 py-3 rounded-full"
              onClick={() => navigate("/gym-buddy")}
            >
              See the App
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-black/30 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-around gap-4">
            {[
              { num: "4", label: "Partner Gyms" },
              { num: "100%", label: "Local Members" },
              { num: "$0", label: "Cost to Members" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold text-white">{s.num}</div>
                <div className="text-[11px] text-orange-200 font-medium uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 mb-3">How It Works</Badge>
          <h2 className="text-3xl font-extrabold text-gray-900">Set up in 24 hours. Zero tech work.</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {HOW_IT_WORKS.map(step => (
            <div key={step.step} className="flex gap-4 p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:border-orange-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm mb-1">{step.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Benefits ─────────────────────────────────────────────────── */}
      <div className="bg-gray-50 py-14">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 mb-3">Why Partner</Badge>
            <h2 className="text-3xl font-extrabold text-gray-900">Built for gym growth.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {BENEFITS.map(b => (
              <div key={b.title} className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center flex-shrink-0">
                  {b.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">{b.title}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 mb-3">Pricing</Badge>
          <h2 className="text-3xl font-extrabold text-gray-900">Simple, transparent plans.</h2>
          <p className="text-gray-500 mt-2">No contracts. Cancel anytime.</p>
        </div>
        <div className="grid gap-4">
          {TIERS.map(tier => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border-2 ${tier.color} bg-white p-6 ${tier.popular ? "shadow-lg shadow-orange-100" : ""}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-6">
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Most Popular</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <Badge className={`text-xs mb-2 ${tier.badgeClass}`}>{tier.badge}</Badge>
                  <p className="font-extrabold text-gray-900 text-lg">{tier.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-gray-900">{tier.price}</span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
              </div>
              <ul className="space-y-2 mb-5">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full rounded-full font-bold ${tier.ctaClass}`}
                onClick={() => window.open("mailto:gyms@justputzit.com?subject=Gym%20Partnership%20Inquiry%20-%20" + tier.name, "_blank")}
              >
                Get {tier.name} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <div
        className="py-16 px-6"
        style={{ background: "linear-gradient(135deg, #1a0a00 0%, #c0390a 60%, #ff6b35 100%)" }}
      >
        <div className="max-w-lg mx-auto text-center">
          <div className="text-5xl mb-4">🏋️</div>
          <h2 className="text-3xl font-extrabold text-white mb-3">Ready to grow your gym?</h2>
          <p className="text-white/75 text-base mb-8">
            We'll have your gym live on Just Putzit within 24 hours. Reach out and let's make it happen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:gyms@justputzit.com?subject=Gym%20Partnership%20Inquiry"
              className="inline-flex items-center justify-center gap-2 bg-white text-orange-700 font-bold text-base px-7 py-3 rounded-full shadow-xl hover:bg-orange-50 transition-all active:scale-95"
            >
              <Mail className="w-4 h-4" /> Email Us
            </a>
            <a
              href="tel:+12625550100"
              className="inline-flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold text-base px-7 py-3 rounded-full hover:bg-white/25 transition-all"
            >
              <Phone className="w-4 h-4" /> Call Us
            </a>
          </div>
          <p className="text-white/50 text-xs mt-6">
            justputzit.com/gym-buddy &nbsp;•&nbsp; gyms@justputzit.com
          </p>
        </div>
      </div>
    </div>
  );
}
