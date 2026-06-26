import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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

function Router() {
  return (
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
      <Route path="/safety" component={Safety} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
