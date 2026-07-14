import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Star, Zap, Crown, Megaphone, Users, MapPin, TrendingUp } from "lucide-react";

const TIERS = [
  {
    id: "basic" as const,
    name: "Basic Listing",
    price: "$49/mo",
    icon: <MapPin className="w-6 h-6" />,
    color: "from-slate-500 to-slate-600",
    badge: "bg-slate-100 text-slate-700",
    features: [
      "Business name & address in Activities directory",
      "Hours & website link",
      "Category badge on your listing",
      "Visible to all users in your city",
    ],
    cta: "Get Listed",
  },
  {
    id: "featured" as const,
    name: "Featured Placement",
    price: "$129/mo",
    icon: <Star className="w-6 h-6" />,
    color: "from-amber-500 to-orange-500",
    badge: "bg-amber-100 text-amber-700",
    popular: true,
    features: [
      "Everything in Basic",
      "Highlighted card on the Activity Board",
      "Pinned at the top of search results",
      "Custom tagline & promo text",
      "\"Featured Partner\" badge on your listing",
    ],
    cta: "Get Featured",
  },
  {
    id: "sponsored_event" as const,
    name: "Sponsored Event",
    price: "$99/event",
    icon: <Zap className="w-6 h-6" />,
    color: "from-violet-500 to-purple-600",
    badge: "bg-violet-100 text-violet-700",
    features: [
      "Your event promoted to all nearby users",
      "\"Sponsored\" badge on the event card",
      "Pushed to the top of Community Events",
      "Included in Sally's activity suggestions",
      "One-time fee per event",
    ],
    cta: "Sponsor an Event",
  },
  {
    id: "premium" as const,
    name: "Premium Partner",
    price: "$349/mo",
    icon: <Crown className="w-6 h-6" />,
    color: "from-rose-500 to-pink-600",
    badge: "bg-rose-100 text-rose-700",
    features: [
      "Everything in Featured",
      "Logo on the Just Putzit homepage",
      "Push notification to nearby users (monthly)",
      "Featured in Sally's daily suggestions",
      "Unlimited sponsored events",
      "Priority support & account manager",
    ],
    cta: "Go Premium",
  },
];

const STATS = [
  { label: "Active Users", value: "5,000+", icon: <Users className="w-5 h-5" /> },
  { label: "Cities Covered", value: "50+", icon: <MapPin className="w-5 h-5" /> },
  { label: "Avg. Age 21–45", value: "82%", icon: <TrendingUp className="w-5 h-5" /> },
  { label: "Monthly Engagements", value: "25K+", icon: <Megaphone className="w-5 h-5" /> },
];

export default function AdvertiseWithUs() {
  const [selectedTier, setSelectedTier] = useState<"basic" | "featured" | "sponsored_event" | "premium">("featured");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    address: "",
    city: "",
    state: "WI",
    tagline: "",
    promoText: "",
  });

  const submitMutation = trpc.advertising.submitInquiry.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.contactName || !form.contactEmail) {
      toast.error("Please fill in all required fields.");
      return;
    }
    submitMutation.mutate({ ...form, tier: selectedTier });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Megaphone className="w-4 h-4" /> Advertise on Just Putzit
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-4 leading-tight">
            Reach Active Locals<br />Who Are Ready to Go Out
          </h1>
          <p className="text-lg text-white/85 max-w-2xl mx-auto mb-8">
            Just Putzit connects people who want to explore their community. Put your bar, restaurant, or venue in front of the right crowd — people who are actively looking for something to do tonight.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/15 rounded-2xl p-4 text-center">
                <div className="flex justify-center mb-1 opacity-80">{s.icon}</div>
                <div className="font-bold text-2xl">{s.value}</div>
                <div className="text-xs text-white/75 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing tiers */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-3xl text-gray-900 mb-2">Choose Your Plan</h2>
            <p className="text-gray-500">Start small or go all-in — every tier puts you in front of active local users.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIERS.map(tier => (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`relative bg-white rounded-3xl p-6 cursor-pointer border-2 transition-all duration-200 ${
                  selectedTier === tier.id
                    ? "border-orange-500 shadow-lg shadow-orange-100 scale-[1.02]"
                    : "border-transparent shadow-sm hover:shadow-md hover:border-gray-200"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tier.color} text-white flex items-center justify-center mb-4`}>
                  {tier.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{tier.name}</h3>
                <div className="font-display font-bold text-2xl text-gray-900 mb-4">{tier.price}</div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-xl ${selectedTier === tier.id ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                  variant={selectedTier === tier.id ? "default" : "outline"}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  {tier.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inquiry form */}
      <div className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">We'll be in touch!</h2>
              <p className="text-gray-500 max-w-sm mx-auto">
                Thanks for your interest in advertising on Just Putzit. Our team will reach out within 1–2 business days to get you set up.
              </p>
              <Button className="mt-8 rounded-xl" onClick={() => { setSubmitted(false); setForm({ businessName: "", contactName: "", contactEmail: "", contactPhone: "", website: "", address: "", city: "", state: "WI", tagline: "", promoText: "" }); }}>
                Submit Another Inquiry
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="font-display font-bold text-3xl text-gray-900 mb-2">Get Started Today</h2>
                <p className="text-gray-500">Fill out the form below and we'll reach out within 1–2 business days.</p>
                <div className="mt-3">
                  <Badge className={TIERS.find(t => t.id === selectedTier)?.badge}>
                    Selected: {TIERS.find(t => t.id === selectedTier)?.name} — {TIERS.find(t => t.id === selectedTier)?.price}
                  </Badge>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name <span className="text-red-500">*</span></label>
                    <Input placeholder="e.g. The Rusty Nail Bar & Grill" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name <span className="text-red-500">*</span></label>
                    <Input placeholder="First & last name" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                    <Input type="email" placeholder="you@yourbusiness.com" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <Input type="tel" placeholder="(414) 555-0100" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                    <Input placeholder="https://yourbusiness.com" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <Input placeholder="Milwaukee" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Address</label>
                  <Input placeholder="123 Main St, Milwaukee, WI 53202" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline / Short Description</label>
                  <Input placeholder="e.g. Best craft beer in Waukesha — 50+ taps!" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} maxLength={300} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Promo / Special Offer (optional)</label>
                  <Textarea placeholder="e.g. Mention Just Putzit for 10% off your first round!" value={form.promoText} onChange={e => setForm(f => ({ ...f, promoText: e.target.value }))} rows={3} />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? "Submitting..." : "Submit Inquiry →"}
                </Button>
                <p className="text-xs text-center text-gray-400">No payment required now. We'll contact you to confirm details and billing.</p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
