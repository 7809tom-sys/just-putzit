import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Building2, Mail, Phone, Globe, MapPin, Star, Crown, Zap, CheckCircle,
  Clock, PauseCircle, XCircle, Pencil, Trash2, DollarSign, StickyNote, ExternalLink,
  Image, Link, Megaphone, Radio
} from "lucide-react";

type Partner = {
  id: number;
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  tier: "basic" | "featured" | "sponsored_event" | "premium";
  status: "inquiry" | "active" | "paused" | "cancelled";
  monthlyRate: number | null;
  billingNotes: string | null;
  tagline: string | null;
  logoUrl: string | null;
  promoText: string | null;
  adminNotes: string | null;
  inquiredAt: Date;
  activatedAt: Date | null;
  // Banner fields
  bannerImageUrl: string | null;
  bannerLinkUrl: string | null;
  bannerHeadline: string | null;
  bannerCta: string | null;
  bannerPages: string | null;
  venueLat: number | null;
  venueLng: number | null;
  bannerReachMiles: number | null;
};

type EditForm = Partial<Partner & {
  monthlyRateDollars: string;
  venueLat: number | null;
  venueLng: number | null;
  bannerReachMiles: number | null;
}>;

const TIER_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  basic: { label: "Basic", color: "bg-slate-100 text-slate-700", icon: <MapPin className="w-3.5 h-3.5" /> },
  featured: { label: "Featured", color: "bg-amber-100 text-amber-700", icon: <Star className="w-3.5 h-3.5" /> },
  sponsored_event: { label: "Sponsored Event", color: "bg-violet-100 text-violet-700", icon: <Zap className="w-3.5 h-3.5" /> },
  premium: { label: "Premium", color: "bg-rose-100 text-rose-700", icon: <Crown className="w-3.5 h-3.5" /> },
};

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  inquiry: { label: "Inquiry", color: "bg-blue-100 text-blue-700", icon: <Clock className="w-3.5 h-3.5" /> },
  active: { label: "Active", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700", icon: <PauseCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const TIER_PRICES: Record<string, number> = {
  basic: 4900,
  featured: 12900,
  sponsored_event: 9900,
  premium: 34900,
};

const PAGE_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "activities", label: "Local Activities" },
  { value: "community", label: "Community Groups" },
  { value: "activity_board", label: "Activity Board" },
  { value: "gym_buddy", label: "Gym Buddy Hub" },
  { value: "gym_detail", label: "Gym Detail Pages" },
];

const REACH_OPTIONS = [
  { value: 15, label: "Local (15 mi) — $49/mo" },
  { value: 50, label: "Regional (50 mi) — $129/mo" },
  { value: 999, label: "Statewide (no limit) — $349/mo" },
];

export default function AdminAdvertising() {
  const { user, loading: isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<"all" | "inquiry" | "active" | "paused" | "cancelled">("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({});

  const { data: partners = [], refetch } = trpc.advertising.list.useQuery(
    { status: statusFilter },
    { enabled: user?.role === "admin" }
  );

  const updateMutation = trpc.advertising.update.useMutation({
    onSuccess: () => { toast.success("Partner updated"); setEditingId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.advertising.delete.useMutation({
    onSuccess: () => { toast.success("Partner removed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" /></div>;
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p className="font-semibold text-gray-700">Admin access required</p>
          <Button className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const startEdit = (p: Partner) => {
    setEditingId(p.id);
    setEditForm({
      status: p.status,
      tier: p.tier,
      monthlyRateDollars: p.monthlyRate ? String(p.monthlyRate / 100) : String(TIER_PRICES[p.tier]! / 100),
      tagline: p.tagline || "",
      adminNotes: p.adminNotes || "",
      billingNotes: p.billingNotes || "",
      // Banner fields
      bannerImageUrl: p.bannerImageUrl || "",
      bannerLinkUrl: p.bannerLinkUrl || "",
      bannerHeadline: p.bannerHeadline || "",
      bannerCta: p.bannerCta || "",
      bannerPages: p.bannerPages || "",
      venueLat: p.venueLat ?? null,
      venueLng: p.venueLng ?? null,
      bannerReachMiles: p.bannerReachMiles ?? 15,
    });
  };

  const togglePage = (page: string) => {
    const current = (editForm.bannerPages || "").split(",").map(s => s.trim()).filter(Boolean);
    const next = current.includes(page)
      ? current.filter(p => p !== page)
      : [...current, page];
    setEditForm(f => ({ ...f, bannerPages: next.join(",") }));
  };

  const saveEdit = (id: number) => {
    updateMutation.mutate({
      id,
      status: editForm.status as Partner["status"],
      tier: editForm.tier as Partner["tier"],
      monthlyRate: editForm.monthlyRateDollars ? Math.round(parseFloat(editForm.monthlyRateDollars) * 100) : undefined,
      tagline: editForm.tagline ?? undefined,
      adminNotes: editForm.adminNotes ?? undefined,
      billingNotes: editForm.billingNotes ?? undefined,
      // Banner fields
      bannerImageUrl: editForm.bannerImageUrl ?? undefined,
      bannerLinkUrl: editForm.bannerLinkUrl ?? undefined,
      bannerHeadline: editForm.bannerHeadline ?? undefined,
      bannerCta: editForm.bannerCta ?? undefined,
      bannerPages: editForm.bannerPages ?? undefined,
      venueLat: editForm.venueLat ?? undefined,
      venueLng: editForm.venueLng ?? undefined,
      bannerReachMiles: editForm.bannerReachMiles ?? undefined,
    });
  };

  const counts = {
    all: partners.length,
    inquiry: partners.filter(p => p.status === "inquiry").length,
    active: partners.filter(p => p.status === "active").length,
    paused: partners.filter(p => p.status === "paused").length,
    cancelled: partners.filter(p => p.status === "cancelled").length,
  };

  const monthlyRevenue = partners
    .filter(p => p.status === "active")
    .reduce((sum, p) => sum + (p.monthlyRate || TIER_PRICES[p.tier] || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Advertising Partners</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage bar, venue & business advertising partnerships</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/advertise")} className="gap-2 rounded-xl">
            <ExternalLink className="w-4 h-4" /> View Public Page
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{counts.inquiry}</div>
            <div className="text-sm text-blue-600 font-medium flex items-center gap-1 mt-0.5"><Clock className="w-3.5 h-3.5" /> New Inquiries</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{counts.active}</div>
            <div className="text-sm text-green-600 font-medium flex items-center gap-1 mt-0.5"><CheckCircle className="w-3.5 h-3.5" /> Active Partners</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">${(monthlyRevenue / 100).toFixed(0)}</div>
            <div className="text-sm text-orange-600 font-medium flex items-center gap-1 mt-0.5"><DollarSign className="w-3.5 h-3.5" /> Monthly Revenue</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{counts.all}</div>
            <div className="text-sm text-gray-500 font-medium mt-0.5">Total Partners</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "inquiry", "active", "paused", "cancelled"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${statusFilter === s ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"}`}
            >
              {s === "all" ? "All" : STATUS_META[s]!.label} {s !== "all" && <span className="ml-1 opacity-60">{counts[s]}</span>}
            </button>
          ))}
        </div>

        {/* Partners list */}
        {partners.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-semibold text-gray-700">No partners yet</p>
            <p className="text-sm text-gray-400 mt-1">Inquiries submitted via the public page will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {partners.map(p => {
              const tier = TIER_META[p.tier]!;
              const status = STATUS_META[p.status]!;
              const isEditing = editingId === p.id;
              const activeBannerPages = (p.bannerPages || "").split(",").map(s => s.trim()).filter(Boolean);
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-gray-900 text-lg">{p.businessName}</h3>
                          <Badge className={`${tier.color} flex items-center gap-1 text-xs`}>{tier.icon}{tier.label}</Badge>
                          <Badge className={`${status.color} flex items-center gap-1 text-xs`}>{status.icon}{status.label}</Badge>
                          {p.bannerHeadline && (
                            <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1 text-xs">
                              <Megaphone className="w-3 h-3" /> Banner Active
                            </Badge>
                          )}
                        </div>
                        {p.tagline && <p className="text-sm text-gray-500 italic mb-2">"{p.tagline}"</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-gray-400" />{p.contactName}</div>
                          <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /><a href={`mailto:${p.contactEmail}`} className="hover:text-orange-500 transition-colors">{p.contactEmail}</a></div>
                          {p.contactPhone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{p.contactPhone}</div>}
                          {p.website && <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-gray-400" /><a href={p.website} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 truncate">{p.website}</a></div>}
                          {p.city && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" />{p.city}{p.state ? `, ${p.state}` : ""}</div>}
                          <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-gray-400" />${((p.monthlyRate || TIER_PRICES[p.tier] || 0) / 100).toFixed(0)}/mo</div>
                        </div>
                        {/* Banner reach summary */}
                        {p.bannerHeadline && (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-orange-400" />
                              {p.bannerReachMiles === 999 ? "Statewide" : p.bannerReachMiles === 50 ? "Regional (50 mi)" : "Local (15 mi)"}
                            </span>
                            {activeBannerPages.length > 0 && (
                              <span>Pages: {activeBannerPages.join(", ")}</span>
                            )}
                          </div>
                        )}
                        {p.adminNotes && (
                          <div className="mt-3 bg-yellow-50 rounded-xl p-3 flex items-start gap-2">
                            <StickyNote className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800">{p.adminNotes}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">Inquired {new Date(p.inquiredAt).toLocaleDateString()}{p.activatedAt ? ` · Activated ${new Date(p.activatedAt).toLocaleDateString()}` : ""}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => isEditing ? setEditingId(null) : startEdit(p as Partner)}>
                          <Pencil className="w-3.5 h-3.5" />{isEditing ? "Cancel" : "Edit"}
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl text-red-500 hover:text-red-600 hover:border-red-300" onClick={() => { if (confirm(`Remove ${p.businessName}?`)) deleteMutation.mutate({ id: p.id }); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {isEditing && (
                      <div className="mt-5 pt-5 border-t border-gray-100 space-y-6">
                        {/* ── Partner Settings ── */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Partner Settings</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                              <select
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                                value={editForm.status}
                                onChange={e => setEditForm(f => ({ ...f, status: e.target.value as Partner["status"] }))}
                              >
                                <option value="inquiry">Inquiry</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Tier</label>
                              <select
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                                value={editForm.tier}
                                onChange={e => setEditForm(f => ({ ...f, tier: e.target.value as Partner["tier"] }))}
                              >
                                <option value="basic">Basic — $49/mo</option>
                                <option value="featured">Featured — $129/mo</option>
                                <option value="sponsored_event">Sponsored Event — $99/event</option>
                                <option value="premium">Premium — $349/mo</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Rate ($)</label>
                              <Input
                                type="number"
                                placeholder="e.g. 129"
                                value={editForm.monthlyRateDollars || ""}
                                onChange={e => setEditForm(f => ({ ...f, monthlyRateDollars: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Tagline</label>
                              <Input
                                placeholder="Short promo tagline"
                                value={editForm.tagline || ""}
                                onChange={e => setEditForm(f => ({ ...f, tagline: e.target.value }))}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Admin Notes (internal)</label>
                              <Textarea
                                rows={2}
                                placeholder="Internal notes about this partner..."
                                value={editForm.adminNotes || ""}
                                onChange={e => setEditForm(f => ({ ...f, adminNotes: e.target.value }))}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Billing Notes</label>
                              <Textarea
                                rows={2}
                                placeholder="Billing details, payment method, notes..."
                                value={editForm.billingNotes || ""}
                                onChange={e => setEditForm(f => ({ ...f, billingNotes: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>

                        {/* ── Banner Ad ── */}
                        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                          <h4 className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Megaphone className="w-3.5 h-3.5" /> Banner Ad Settings
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Image className="w-3.5 h-3.5" /> Banner Image URL</label>
                              <Input
                                placeholder="https://example.com/banner.jpg"
                                value={editForm.bannerImageUrl || ""}
                                onChange={e => setEditForm(f => ({ ...f, bannerImageUrl: e.target.value }))}
                              />
                              <p className="text-xs text-gray-400 mt-0.5">Square or landscape image. Recommended: 200×200px minimum.</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Banner Headline</label>
                              <Input
                                placeholder="e.g. Happy Hour Every Friday!"
                                maxLength={100}
                                value={editForm.bannerHeadline || ""}
                                onChange={e => setEditForm(f => ({ ...f, bannerHeadline: e.target.value }))}
                              />
                              <p className="text-xs text-gray-400 mt-0.5">{(editForm.bannerHeadline || "").length}/100 chars</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">CTA Button Text</label>
                              <Input
                                placeholder="e.g. Visit Us, Learn More, Order Now"
                                maxLength={50}
                                value={editForm.bannerCta || ""}
                                onChange={e => setEditForm(f => ({ ...f, bannerCta: e.target.value }))}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Link className="w-3.5 h-3.5" /> Destination URL</label>
                              <Input
                                placeholder="https://yourvenue.com or menu page"
                                value={editForm.bannerLinkUrl || ""}
                                onChange={e => setEditForm(f => ({ ...f, bannerLinkUrl: e.target.value }))}
                              />
                            </div>

                            {/* Pages checkboxes */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-2">Show Banner On These Pages</label>
                              <div className="flex flex-wrap gap-2">
                                {PAGE_OPTIONS.map(opt => {
                                  const active = (editForm.bannerPages || "").split(",").map(s => s.trim()).includes(opt.value);
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => togglePage(opt.value)}
                                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">Leave all unchecked to show on all pages.</p>
                            </div>

                            {/* Reach radius */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Radio className="w-3.5 h-3.5" /> Ad Reach Radius</label>
                              <div className="flex flex-wrap gap-2">
                                {REACH_OPTIONS.map(opt => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setEditForm(f => ({ ...f, bannerReachMiles: opt.value }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${editForm.bannerReachMiles === opt.value ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">Banner shows to users within this distance of the venue. Statewide = no location filter.</p>
                            </div>

                            {/* Venue coordinates */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Venue Latitude</label>
                              <Input
                                type="number"
                                step="0.000001"
                                placeholder="e.g. 43.0389"
                                value={editForm.venueLat ?? ""}
                                onChange={e => setEditForm(f => ({ ...f, venueLat: e.target.value ? parseFloat(e.target.value) : null }))}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Venue Longitude</label>
                              <Input
                                type="number"
                                step="0.000001"
                                placeholder="e.g. -88.0136"
                                value={editForm.venueLng ?? ""}
                                onChange={e => setEditForm(f => ({ ...f, venueLng: e.target.value ? parseFloat(e.target.value) : null }))}
                              />
                            </div>
                            <p className="md:col-span-2 text-xs text-gray-400 -mt-2">
                              Find coordinates at <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">maps.google.com</a> — right-click the venue and copy the coordinates. Required for Local and Regional reach.
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3">
                          <Button variant="outline" className="rounded-xl" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white" onClick={() => saveEdit(p.id)} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
