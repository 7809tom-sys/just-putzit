import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Home,
  Heart,
  LayoutGrid,
  LayoutDashboard,
  Users,
  MoreHorizontal,
  MessageCircle,
  Sparkles,
  Ticket,
  Scale,
  Swords,
  GraduationCap,
  MapPin,
  Calendar,
  Store,
  Shield,
  User,
  Bell,
  LogOut,
  ShieldAlert,
  Gamepad2,
  Popcorn,
  Megaphone,
  Users2,
  Briefcase,
  Dumbbell,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { APP_ROUTES } from "@/lib/routes";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export default function MobileBottomNav() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const { data: notifications } = trpc.notifications.getAll.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  // Primary 5 tabs shown in bottom bar
  const primaryTabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/matches", icon: Heart, label: "Matches" },
    { href: "/activity-board", icon: LayoutGrid, label: "Activities" },
    { href: "/shout-out", icon: Megaphone, label: "Refer" },
    { href: "/community", icon: Users, label: "Community" },
  ];

  // All extra features in the "More" sheet
  const moreItems = [
    { href: "/gym-buddy", icon: Dumbbell, label: "Gym Buddy", color: "text-orange-600" },
    { href: "/entertainment", icon: Popcorn, label: "Entertainment", color: "text-orange-500" },
    { href: "/shout-out", icon: Megaphone, label: "Refer a Friend", color: "text-rose-500" },
    { href: "/game-lobby", icon: Gamepad2, label: "Game Lobby", color: "text-green-500" },
    { href: "/interview", icon: MessageCircle, label: "Talk to Sally", color: "text-orange-500" },
    { href: "/concierge", icon: Sparkles, label: "Concierge", color: "text-purple-500" },
    { href: "/marketplace", icon: Ticket, label: "Marketplace", color: "text-blue-500" },
    { href: "/events", icon: Calendar, label: "Local Events", color: "text-orange-400" },
    { href: "/family", icon: Users2, label: "Family Network", color: "text-cyan-500" },
    { href: "/trip-planner", icon: Briefcase, label: "Trip Planner", color: "text-teal-500" },
    { href: "/my-dashboard", icon: LayoutDashboard, label: "My Dashboard", color: "text-orange-600" },
    { href: "/profile", icon: User, label: "My Profile", color: "text-teal-500" },
    { href: "/bookings", icon: Ticket, label: "My Bookings", color: "text-sky-500" },
    { href: "/would-you-rather", icon: Scale, label: "Would You Rather", color: "text-indigo-500" },
    { href: "/wyr-challenge", icon: Swords, label: "WYR Challenge", color: "text-red-500" },
    { href: "/couples", icon: Heart, label: "Couples Network", color: "text-pink-500" },
    { href: "/campus", icon: GraduationCap, label: "Campus Dating Pool", color: "text-green-600" },
    { href: "/vendor", icon: Store, label: "Vendor Portal", color: "text-amber-600" },
    { href: "/verify", icon: MapPin, label: "Verify Location", color: "text-orange-500" },
    { href: "/safety", icon: Shield, label: "Safety & Trust", color: "text-slate-500" },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const moreIsActive = moreItems.some((item) => isActive(item.href));

  return (
    <>
      {/* Bottom nav bar — only on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border shadow-[0_-1px_8px_rgba(0,0,0,0.06)] sm:hidden">
        <div className="flex items-stretch h-16">
          {primaryTabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 no-underline"
            >
              <div
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
                  isActive(tab.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <tab.icon className={`w-5 h-5 ${isActive(tab.href) ? "stroke-[2.5]" : "stroke-2"}`} />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
                {tab.href === "/matches" && unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
            </Link>
          ))}

          {/* More sheet trigger */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button className="flex-1 flex flex-col items-center justify-center gap-0.5">
                <div
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
                    moreIsActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div className="relative">
                    <MoreHorizontal className="w-5 h-5 stroke-2" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium leading-none">More</span>
                </div>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto pb-safe">
              <SheetHeader className="pb-2">
                <SheetTitle className="text-base">All Features</SheetTitle>
              </SheetHeader>

              {/* User info */}
              <div className="flex items-center gap-3 px-1 py-3 mb-2 border-b border-border">
                <div className="w-10 h-10 rounded-full gradient-sally flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user?.name ?? "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
                </div>
                {unreadCount > 0 && (
                  <Link href={APP_ROUTES.notifications} onClick={() => setMoreOpen(false)}>
                    <div className="relative">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[9px] bg-primary text-primary-foreground">
                        {unreadCount}
                      </Badge>
                    </div>
                  </Link>
                )}
              </div>

              {/* Feature grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="no-underline"
                  >
                    <div
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                        isActive(item.href)
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-muted/30 hover:bg-muted/60"
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-[11px] font-medium text-center leading-tight text-foreground">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                ))}

                {/* Admin shortcut — only for admins */}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMoreOpen(false)}
                    className="no-underline"
                  >
                    <div
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                        isActive("/admin")
                          ? "border-red-300 bg-red-50"
                          : "border-red-200 bg-red-50/50 hover:bg-red-50"
                      }`}
                    >
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                      <span className="text-[11px] font-medium text-center leading-tight text-red-600">
                        Admin Panel
                      </span>
                    </div>
                  </Link>
                )}
              </div>

              {/* Sign out */}
              <button
                onClick={() => { setMoreOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/5 transition-colors text-sm font-medium border border-destructive/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer so content doesn't hide behind the bottom nav on mobile */}
      <div className="h-16 sm:hidden" aria-hidden="true" />
    </>
  );
}
