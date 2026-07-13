import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Interview from "./pages/Interview";
import Profile from "./pages/Profile";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Games from "./pages/Games";
import Activities from "./pages/Activities";
import ActivityBoard from "./pages/ActivityBoard";
import Community from "./pages/Community";
import Safety from "./pages/Safety";
import Admin from "./pages/Admin";
import Concierge from "./pages/Concierge";
import Marketplace from "./pages/Marketplace";
import Bookings from "./pages/Bookings";
import Vendor from "./pages/Vendor";
import Couples from "./pages/Couples";
import WouldYouRather from "@/pages/WouldYouRather";
import WyrChallenge from "@/pages/WyrChallenge";
import CampusWaitlist from "@/pages/CampusWaitlist";
import CampusPage from "@/pages/Campus";
import SignUp from "@/pages/SignUp";
import Login from "@/pages/Login";
import Verify from "@/pages/Verify";
import Events from "@/pages/Events";
import GameLobby from "@/pages/GameLobby";
import Entertainment from "@/pages/Entertainment";
import ShoutOut from "@/pages/ShoutOut";
import AccountVerify from "@/pages/AccountVerify";
import CityLanding from "@/pages/CityLanding";
import EventDetail from "@/pages/EventDetail";
import TriviaGame from "@/pages/TriviaGame";
import GamesHub from "@/pages/GamesHub";
import Family from "@/pages/Family";
import TripPlanner from "@/pages/TripPlanner";
import Jeopardy from "@/pages/Jeopardy";
import TriviaPursuit from "@/pages/TriviaPursuit";
import { FloatingInstallButton } from "@/components/FloatingInstallButton";
import MobileBottomNav from "@/components/MobileBottomNav";
import { trpc } from "@/lib/trpc";

// Routes that are allowed without account verification
const PUBLIC_ROUTES = ["/login", "/signup", "/verify", "/verify-account", "/404", "/city/", "/events/", "/profile"];

/**
 * Verification gate — runs on every navigation for logged-in users.
 * If the user hasn't completed passkey + GPS photo, they're redirected to /verify-account.
 */
function VerificationGate({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: status } = trpc.passkey.verificationStatus.useQuery(undefined, {
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    // Only gate logged-in users
    if (!user) return;
    // Don't redirect if already on a public route
    if (PUBLIC_ROUTES.some(r => location.startsWith(r))) return;
    // Only block if GPS photo is not verified (passkey is optional — not all devices support it)
    if (status && !status.gpsPhotoVerified) {
      navigate("/verify-account");
    }
  }, [user, status, location, navigate]);

  return <>{children}</>;
}

function Router() {
  return (
    <VerificationGate>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/interview" component={Interview} />
        <Route path="/profile" component={Profile} />
        <Route path="/matches" component={Matches} />
        <Route path="/chat/:matchId" component={Chat} />
        <Route path="/games/:matchId" component={Games} />
        <Route path="/activities" component={Activities} />
        <Route path="/activity-board" component={ActivityBoard} />
        <Route path="/community" component={Community} />
        <Route path="/concierge" component={Concierge} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/bookings" component={Bookings} />
        <Route path="/vendor" component={Vendor} />
        <Route path="/couples" component={Couples} />
        <Route path="/would-you-rather" component={WouldYouRather} />
        <Route path="/wyr-challenge" component={WyrChallenge} />
        <Route path="/campus/carroll" component={CampusWaitlist} />
        <Route path="/campus" component={CampusPage} />
        <Route path="/signup" component={SignUp} />
        <Route path="/login" component={Login} />
        <Route path="/verify" component={Verify} />
        <Route path="/verify-account" component={AccountVerify} />
        <Route path="/city/:citySlug" component={CityLanding} />
        <Route path="/events/:activityId" component={EventDetail} />
        <Route path="/trivia" component={TriviaGame} />
        <Route path="/jeopardy" component={Jeopardy} />
        <Route path="/trivia-pursuit" component={TriviaPursuit} />
        <Route path="/games-hub" component={GamesHub} />
        <Route path="/games-hub/:gameId" component={GamesHub} />
        <Route path="/family" component={Family} />
        <Route path="/trip-planner" component={TripPlanner} />
        <Route path="/events" component={Events} />
        <Route path="/game-lobby" component={GameLobby} />
        <Route path="/entertainment" component={Entertainment} />
        <Route path="/shout-out" component={ShoutOut} />
        <Route path="/safety" component={Safety} />
        <Route path="/admin" component={Admin} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </VerificationGate>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <MobileBottomNav />
          <FloatingInstallButton />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
