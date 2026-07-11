import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Bell, Heart, Home, MessageCircle, Users, Shield, User, LayoutGrid, Ticket, Sparkles, Store, Scale, Swords, GraduationCap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { data: notifications } = trpc.notifications.getAll.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation();
  const utils = trpc.useUtils();

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const navItems = [
    { href: "/matches", icon: Heart, label: "Matches" },
    { href: "/marketplace", icon: Ticket, label: "Marketplace" },
    { href: "/concierge", icon: Sparkles, label: "Concierge" },
    { href: "/activity-board", icon: LayoutGrid, label: "Activities" },
    { href: "/community", icon: Users, label: "Community" },
  ];

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
    utils.notifications.getAll.invalidate();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-9 h-9 rounded-full gradient-sally flex items-center justify-center text-white font-bold text-sm shadow-md">
            JP
          </div>
          <span className="font-display font-bold text-xl text-foreground hidden sm:block">
            Just Putzit
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 rounded-full ${location === "/" ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"}`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
          {navItems.map(item => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 rounded-full ${location.startsWith(item.href) ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"}`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>

        {/* Right side: notifications + user */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative rounded-full">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleMarkAllRead}>
                    Mark all read
                  </Button>
                )}
              </div>
              {notifications && notifications.length > 0 ? (
                notifications.slice(0, 8).map(n => (
                  <DropdownMenuItem key={n.id} className={`flex flex-col items-start gap-0.5 py-2 ${!n.isRead ? "bg-primary/5" : ""}`}>
                    <span className="font-medium text-sm">{n.title}</span>
                    <span className="text-xs text-muted-foreground">{n.body}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No notifications yet — Sally is working on your matches! 💛
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                <div className="w-7 h-7 rounded-full gradient-sally flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{user?.name?.split(" ")[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/interview">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Talk to Sally
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/bookings">
                  <Ticket className="w-4 h-4 mr-2" />
                  My Bookings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/would-you-rather">
                  <Scale className="w-4 h-4 mr-2" />
                  Would You Rather
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/wyr-challenge">
                  <Swords className="w-4 h-4 mr-2" />
                  WYR — Challenge a Match
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/couples">
                  <Heart className="w-4 h-4 mr-2" />
                  Couples Network
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/campus/carroll">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Carroll University
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/vendor">
                  <Store className="w-4 h-4 mr-2" />
                  Vendor Portal
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/safety">
                  <Shield className="w-4 h-4 mr-2" />
                  Safety & Trust
                </Link>
              </DropdownMenuItem>
              {user?.role === "admin" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
