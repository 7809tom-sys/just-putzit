import { Activity, Dumbbell, GraduationCap, Heart, LayoutGrid, Megaphone, Popcorn, Sparkles, Store, Ticket, Trophy, Users, type LucideIcon } from "lucide-react";

export type HeaderNavigationItem = { href: string; icon: LucideIcon; label: string };

export const primaryHeaderNavigation: HeaderNavigationItem[] = [
  { href: "/matches", icon: Heart, label: "Matches" },
  { href: "/marketplace", icon: Ticket, label: "Marketplace" },
  { href: "/activity-board", icon: LayoutGrid, label: "Activities" },
  { href: "/community", icon: Users, label: "Community" },
];

export const moreHeaderNavigation: HeaderNavigationItem[] = [
  { href: "/vendor", icon: Store, label: "For Businesses" },
  { href: "/concierge", icon: Sparkles, label: "Concierge" },
  { href: "/gym-buddy", icon: Dumbbell, label: "Gym Buddy" },
  { href: "/entertainment", icon: Popcorn, label: "Entertainment" },
  { href: "/sports", icon: Trophy, label: "Sports" },
  { href: "/shout-out", icon: Megaphone, label: "Shout Out" },
  { href: "/campus", icon: GraduationCap, label: "Campus" },
];

export function isMoreHeaderRoute(location: string) {
  return moreHeaderNavigation.some((item) => location.startsWith(item.href));
}
