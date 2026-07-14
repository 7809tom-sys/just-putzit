/**
 * CityLanding — SEO-optimized landing page for each city.
 * Route: /city/:citySlug  (e.g. /city/jackson-ms, /city/madison-wi)
 *
 * Each page targets long-tail local search queries like:
 *   "dating app Jackson MS"
 *   "things to do in Jackson Mississippi"
 *   "meet people in Jackson MS"
 */
import { useParams, useLocation } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Shield, Sparkles, Users, Star, ChevronRight, Calendar } from "lucide-react";
import { getLoginUrl } from "@/const";

// ── City data ─────────────────────────────────────────────────────────────────
interface CityData {
  name: string;
  state: string;
  stateAbbr: string;
  slug: string;
  tagline: string;
  description: string;
  activities: string[];
  neighborhoods: string[];
  keywords: string[];
}

const CITIES: Record<string, CityData> = {
  "jackson-ms": {
    name: "Jackson",
    state: "Mississippi",
    stateAbbr: "MS",
    slug: "jackson-ms",
    tagline: "Real Dates in Jackson, MS",
    description: "Meet locals in Jackson who actually want to go out — not just text. Find matches for date nights, outdoor activities, and real connections across the Capital City.",
    activities: ["Fondren District dining", "LeFleur's Bluff State Park hikes", "Mississippi Museum of Art", "Belhaven neighborhood walks", "Local music venues", "Reservoir kayaking"],
    neighborhoods: ["Fondren", "Belhaven", "Ridgeland", "Brandon", "Madison", "Flowood"],
    keywords: ["dating app Jackson MS", "things to do Jackson Mississippi", "meet people Jackson MS", "date night Jackson Mississippi", "activities Jackson MS"],
  },
  "madison-wi": {
    name: "Madison",
    state: "Wisconsin",
    stateAbbr: "WI",
    slug: "madison-wi",
    tagline: "Real Dates in Madison, WI",
    description: "Connect with locals in Madison who love the outdoors, the food scene, and real in-person experiences. Find your match for lake days, State Street adventures, and more.",
    activities: ["Lake Mendota paddleboarding", "State Street dining", "Farmer's Market on the Square", "Arboretum hiking", "Terrace sunsets at Memorial Union", "Comedy club nights"],
    neighborhoods: ["Downtown", "Willy Street", "Middleton", "Fitchburg", "Verona", "Sun Prairie"],
    keywords: ["dating app Madison WI", "things to do Madison Wisconsin", "meet people Madison WI", "date night Madison Wisconsin", "activities Madison WI"],
  },
  "milwaukee-wi": {
    name: "Milwaukee",
    state: "Wisconsin",
    stateAbbr: "WI",
    slug: "milwaukee-wi",
    tagline: "Real Dates in Milwaukee, WI",
    description: "Milwaukee's dating scene just got better. Meet locals for lakefront walks, brewery tours, Summerfest, and real connections in the Cream City.",
    activities: ["Milwaukee Art Museum", "Lakefront Brewery tours", "Third Ward dining", "Bradford Beach", "Pabst Mansion tours", "Milwaukee Bucks games"],
    neighborhoods: ["Third Ward", "Bay View", "Riverwest", "Shorewood", "Wauwatosa", "Brookfield"],
    keywords: ["dating app Milwaukee WI", "things to do Milwaukee Wisconsin", "meet people Milwaukee WI", "date night Milwaukee Wisconsin", "activities Milwaukee WI"],
  },
  "chicago-il": {
    name: "Chicago",
    state: "Illinois",
    stateAbbr: "IL",
    slug: "chicago-il",
    tagline: "Real Dates in Chicago, IL",
    description: "Chicago has endless date options — and Just Putzit helps you find someone to actually go with. Meet locals for deep dish, lakefront runs, rooftop bars, and real connections.",
    activities: ["Millennium Park", "Navy Pier", "Chicago Riverwalk", "Lincoln Park Zoo", "Deep dish pizza crawl", "Chicago Architecture boat tour"],
    neighborhoods: ["Wicker Park", "Lincoln Park", "Logan Square", "River North", "Wrigleyville", "Hyde Park"],
    keywords: ["dating app Chicago IL", "things to do Chicago Illinois", "meet people Chicago IL", "date night Chicago Illinois", "activities Chicago IL"],
  },
  "atlanta-ga": {
    name: "Atlanta",
    state: "Georgia",
    stateAbbr: "GA",
    slug: "atlanta-ga",
    tagline: "Real Dates in Atlanta, GA",
    description: "ATL has the culture, the food, and the energy. Just Putzit connects you with Atlanta locals for real dates — Beltline walks, rooftop bars, and everything in between.",
    activities: ["Atlanta BeltLine", "Ponce City Market", "Piedmont Park", "Georgia Aquarium", "Little Five Points", "Rooftop bar hopping"],
    neighborhoods: ["Midtown", "Buckhead", "Little Five Points", "East Atlanta", "Decatur", "Smyrna"],
    keywords: ["dating app Atlanta GA", "things to do Atlanta Georgia", "meet people Atlanta GA", "date night Atlanta Georgia", "activities Atlanta GA"],
  },
};

// Generate a generic city entry for unknown slugs
function buildGenericCity(slug: string): CityData {
  const parts = slug.split("-");
  const stateAbbr = parts[parts.length - 1]?.toUpperCase() ?? "";
  const cityParts = parts.slice(0, -1);
  const name = cityParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  return {
    name,
    state: stateAbbr,
    stateAbbr,
    slug,
    tagline: `Real Dates in ${name}, ${stateAbbr}`,
    description: `Meet locals in ${name} who actually want to go out. Find matches for activities, date nights, and real connections in your city.`,
    activities: ["Local dining", "Outdoor activities", "Live music", "Art & culture", "Sports events", "Community meetups"],
    neighborhoods: [],
    keywords: [`dating app ${name} ${stateAbbr}`, `things to do ${name}`, `meet people ${name}`, `date night ${name}`],
  };
}

export default function CityLanding() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [, navigate] = useLocation();
  const city = CITIES[citySlug ?? ""] ?? buildGenericCity(citySlug ?? "unknown");

  useSEO({
    title: `Dating App ${city.name} ${city.stateAbbr} — Just Putzit`,
    description: city.description,
    canonical: `https://justputzit.com/city/${city.slug}`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": `Just Putzit — ${city.name}`,
      "description": city.description,
      "url": `https://justputzit.com/city/${city.slug}`,
      "areaServed": {
        "@type": "City",
        "name": city.name,
        "containedInPlace": { "@type": "State", "name": city.state },
      },
      "applicationCategory": "SocialNetworkingApplication",
    },
  });

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="relative gradient-warm min-h-[70vh] flex flex-col">
        {/* Nav */}
        <div className="container flex items-center justify-between py-5">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src="/manus-storage/justputzit-logo_490fa7ec.png" alt="Just Putzit" className="h-10 w-auto object-contain" />
          </button>
          <a href={getLoginUrl()}>
            <Button className="gradient-sally text-white border-0 shadow-md rounded-full px-6">
              Join Free
            </Button>
          </a>
        </div>

        {/* Hero content */}
        <div className="container flex-1 flex flex-col items-center justify-center text-center py-16 gap-6">
          <Badge className="bg-primary/10 text-primary border-0 rounded-full px-4 py-1.5 text-sm font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {city.name}, {city.state}
          </Badge>
          <h1 className="font-display text-4xl lg:text-6xl font-bold text-foreground leading-tight max-w-3xl">
            The Dating App Built for <span className="text-primary">{city.name}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            {city.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <a href={getLoginUrl()}>
              <Button size="lg" className="gradient-sally text-white border-0 shadow-lg rounded-full px-8 text-lg gap-2">
                <Sparkles className="w-5 h-5" />
                Meet People in {city.name}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
          <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> Verified Profiles</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-primary" /> AI-Matched</span>
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-primary" /> Free to Join</span>
          </div>
        </div>
      </section>

      {/* Local Activities */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Things to Do in {city.name} with Your Match
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Just Putzit suggests real local activities based on what both of you love. No more "what do you want to do?" texts.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {city.activities.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-white hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">{activity}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 gradient-warm">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How Just Putzit Works in {city.name}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", icon: "🤖", title: "Meet Sally", desc: `Sally, our AI, learns your personality through a quick 90-second chat. She gets to know the real you — not just your photos.` },
              { step: "2", icon: "💙", title: "Get Matched", desc: `Sally matches you with ${city.name} locals who share your vibe, interests, and relationship goals. Quality over quantity.` },
              { step: "3", icon: "📍", title: "Go Out", desc: `Get activity suggestions tailored to ${city.name}. RSVP to local events together. Actually meet in person.` },
            ].map(s => (
              <div key={s.step} className="text-center p-8 rounded-3xl bg-white shadow-sm">
                <div className="w-16 h-16 rounded-full gradient-sally mx-auto mb-4 flex items-center justify-center text-2xl shadow-lg">{s.icon}</div>
                <Badge className="mb-3 bg-primary/10 text-primary border-0">{s.step}</Badge>
                <h3 className="font-display font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Neighborhoods */}
      {city.neighborhoods.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container text-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Serving All of {city.name}
            </h2>
            <p className="text-muted-foreground mb-8">Find matches near your neighborhood</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {city.neighborhoods.map(n => (
                <Badge key={n} className="bg-primary/10 text-primary border-0 rounded-full px-4 py-2 text-sm font-medium">
                  <MapPin className="w-3 h-3 mr-1" />{n}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 gradient-warm">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full gradient-sally mx-auto mb-6 flex items-center justify-center text-4xl shadow-xl">🤖</div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ready to Meet Someone in {city.name}?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join free. No credit card. Sally matches you in minutes.
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" className="gradient-sally text-white border-0 shadow-xl rounded-full px-10 text-lg gap-2">
                <Sparkles className="w-5 h-5" />
                Join Just Putzit — It's Free
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-4">Biometric verified · GPS location confirmed · Real people only</p>
          </div>
        </div>
      </section>

      {/* Hidden SEO keywords (screen-reader accessible, not spammy) */}
      <div className="sr-only">
        <h2>Just Putzit in {city.name}, {city.state}</h2>
        {city.keywords.map(k => <span key={k}>{k} </span>)}
      </div>
    </div>
  );
}
