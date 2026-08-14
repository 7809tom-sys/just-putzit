import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile notification navigation", () => {
  it("uses the registered notifications route instead of an unregistered hard-coded destination", () => {
    const root = resolve(__dirname, "..");
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const mobileNav = readFileSync(resolve(root, "client/src/components/MobileBottomNav.tsx"), "utf8");

    expect(app).toContain('path={APP_ROUTES.notifications}');
    expect(mobileNav).toContain('href={APP_ROUTES.notifications}');
  });

  it("keeps Refer as a primary direct tab to the registered Shout-Out route", () => {
    const root = resolve(__dirname, "..");
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const mobileNav = readFileSync(resolve(root, "client/src/components/MobileBottomNav.tsx"), "utf8");

    expect(app).toContain('<Route path="/shout-out" component={ShoutOut} />');
    expect(mobileNav).toContain('{ href: "/shout-out", icon: Megaphone, label: "Refer" }');
  });

  it("keeps core member destinations in the mobile bar and provides an admin-only More shortcut", () => {
    const root = resolve(__dirname, "..");
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const mobileNav = readFileSync(resolve(root, "client/src/components/MobileBottomNav.tsx"), "utf8");

    expect(mobileNav).toContain('{ href: "/", icon: Home, label: "Home" }');
    expect(mobileNav).toContain('{ href: "/matches", icon: Heart, label: "Matches" }');
    expect(mobileNav).toContain('{ href: "/activity-board", icon: LayoutGrid, label: "Activities" }');
    expect(mobileNav).toContain('{ href: "/community", icon: Users, label: "Community" }');
    expect(mobileNav).toContain('user?.role === "admin"');
    expect(mobileNav).toContain('href="/admin"');
    expect(app).toContain('<Route path="/admin" component={Admin} />');
  });

  it("keeps Family Network and Trip Planner reachable from the mobile More sheet", () => {
    const root = resolve(__dirname, "..");
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const mobileNav = readFileSync(resolve(root, "client/src/components/MobileBottomNav.tsx"), "utf8");

    expect(app).toContain('<Route path="/family" component={Family} />');
    expect(app).toContain('<Route path="/trip-planner" component={TripPlanner} />');
    expect(mobileNav).toContain('{ href: "/family", icon: Users2, label: "Family Network"');
    expect(mobileNav).toContain('{ href: "/trip-planner", icon: Briefcase, label: "Trip Planner"');
  });
});
