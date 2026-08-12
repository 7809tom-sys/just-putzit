import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Bell, Heart, Home, MessageCircle, Users, Shield, User, LayoutDashboard, Ticket, Store, Scale, Swords, GraduationCap, MapPin, Calendar, Popcorn, Megaphone, Trophy, ChevronDown, Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useUserCity } from "@/hooks/useUserCity";
import { Button } from "@/components/ui/button";
import { isMoreHeaderRoute, moreHeaderNavigation, primaryHeaderNavigation } from "@/lib/headerNavigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Routes where the navbar should be hidden (auth/onboarding flows)
const HIDE_NAVBAR_ROUTES = ["/login", "/signup", "/verify-account", "/onboarding"];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const shouldHide = !user || HIDE_NAVBAR_ROUTES.some(r => location.startsWith(r));
  const { city: detectedCity, setCity } = useUserCity();
  const { data: notifications } = trpc.notifications.getAll.useQuery(undefined, {
    enabled: !shouldHide,
    refetchInterval: 30000,
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation();
  const utils = trpc.useUtils();

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  // Don't show navbar on auth/onboarding pages or when not logged in
  if (shouldHide) return null;

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
    utils.notifications.getAll.invalidate();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container flex h-16 min-w-0 items-center gap-2 sm:gap-3">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center no-underline">
          <img
            src="/manus-storage/justputzit-logo-transparent_2e545ffa.png"
            alt="Just Putzit"
            className="h-10 w-auto object-contain sm:h-11"
            style={{ maxWidth: 136 }}
          />
        </Link>

        {/* Primary desktop navigation — secondary destinations collapse into More. */}
        <div className="hidden min-w-0 items-center gap-0.5 md:flex">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1.5 rounded-full px-2 lg:px-2.5 ${location === "/" ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"}`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden 2xl:inline">Home</span>
            </Button>
          </Link>
          {primaryHeaderNavigation.map(item => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 gap-1.5 rounded-full px-2 lg:px-2.5 ${location.startsWith(item.href) ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"}`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden 2xl:inline">{item.label}</span>
              </Button>
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={`h-9 gap-1.5 rounded-full px-2 lg:px-2.5 ${isMoreHeaderRoute(location) ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"}`} aria-label="More navigation options">
                <Menu className="h-4 w-4" /><span className="hidden 2xl:inline">More</span><ChevronDown className="hidden h-3.5 w-3.5 2xl:inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {moreHeaderNavigation.map((item) => <DropdownMenuItem key={item.href} asChild><Link href={item.href}><item.icon className="mr-2 h-4 w-4" />{item.label}</Link></DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side: notifications + user */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full p-0">
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

          {/* City badge */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden h-9 gap-1 rounded-full text-xs text-muted-foreground xl:flex">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span className="max-w-[80px] truncate">{detectedCity}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium border-b">Switch City</div>
              {["Milwaukee", "Waukesha", "Chicago", "Brookfield", "West Allis", "Wauwatosa"].map(c => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => setCity(c)}
                  className={detectedCity === c ? "font-semibold text-primary" : ""}
                >
                  {detectedCity === c && <span className="mr-1.5">✓</span>}{c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-2 rounded-full px-1.5 sm:px-2">
                <div className="w-7 h-7 rounded-full gradient-sally flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="hidden xl:inline text-sm font-medium">{user?.name?.split(" ")[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/my-dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  My Dashboard
                </Link>
              </DropdownMenuItem>
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
                <Link href="/campus">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Campus Dating Pool
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events">
                  <Calendar className="w-4 h-4 mr-2 text-orange-400" />
                  Local Events
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/entertainment">
                  <Popcorn className="w-4 h-4 mr-2 text-orange-500" />
                  Movies & Entertainment
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/sports">
                  <Trophy className="w-4 h-4 mr-2 text-green-600" />
                  Sports Watch Parties
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/vendor">
                  <Store className="w-4 h-4 mr-2" />
                  Vendor Portal
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/verify">
                  <MapPin className="w-4 h-4 mr-2 text-orange-500" />
                  Verify Location
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/safety">
                  <Shield className="w-4 h-4 mr-2" />
                  Safety & Trust
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/advertise" className="font-medium">
                  <Megaphone className="w-4 h-4 mr-2 text-orange-500" />
                  Advertise With Us
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
                  <DropdownMenuItem asChild>
                    <Link href="/admin/advertising">
                      Manage Partners
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/shout-out" className="font-semibold text-orange-600">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Recommend a Friend
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/privacy" className="text-xs text-muted-foreground">
                  Privacy Policy
                </Link>
              </DropdownMenuItem>
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
