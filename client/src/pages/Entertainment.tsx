import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Film, Music, Zap, Mountain, ExternalLink, Play, MapPin, Star, Clock, DollarSign, Ticket, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

// ─── Static data: Waukesha-area entertainment ─────────────────────────────────

const NOW_PLAYING_MOVIES = [
  {
    id: "mission-impossible-8",
    title: "Mission: Impossible – The Final Reckoning",
    genre: "Action / Thriller",
    rating: "PG-13",
    runtime: "169 min",
    score: "89%",
    poster: "https://image.tmdb.org/t/p/w500/z53D72EAOxGRqdr7KXXWp9dJiDe.jpg",
    trailerKey: "avz3HMpFCXQ",
    fandangoUrl: "https://www.fandango.com/mission-impossible-the-final-reckoning-2025-232434/movie-overview",
    description: "Ethan Hunt and his IMF team race to stop a terrifying new threat before it achieves global catastrophe.",
  },
  {
    id: "lilo-stitch-2025",
    title: "Lilo & Stitch",
    genre: "Family / Adventure",
    rating: "PG",
    runtime: "108 min",
    score: "76%",
    poster: "https://image.tmdb.org/t/p/w500/3bN0Ij8YDKN1ZNjBbHBqJxlEiJI.jpg",
    trailerKey: "OHBnrLTHBSA",
    fandangoUrl: "https://www.fandango.com/lilo-and-stitch-2025-232435/movie-overview",
    description: "A live-action reimagining of the beloved animated classic about a lonely Hawaiian girl and her alien best friend.",
  },
  {
    id: "thunderbolts",
    title: "Thunderbolts*",
    genre: "Action / Superhero",
    rating: "PG-13",
    runtime: "127 min",
    score: "91%",
    poster: "https://image.tmdb.org/t/p/w500/m9EtP1WMiMpCSmLBTmGJPBiMBMp.jpg",
    trailerKey: "6ZfuNTqbHE8",
    fandangoUrl: "https://www.fandango.com/thunderbolts-2025-232436/movie-overview",
    description: "Marvel's team of antiheroes and reformed villains are thrust into a dangerous mission.",
  },
  {
    id: "ballerina",
    title: "Ballerina",
    genre: "Action / Thriller",
    rating: "R",
    runtime: "115 min",
    score: "82%",
    poster: "https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggkl.jpg",
    trailerKey: "nnXi0125-Bw",
    fandangoUrl: "https://www.fandango.com/ballerina-2025-232437/movie-overview",
    description: "A John Wick spin-off following a young woman who seeks revenge against the assassins who killed her family.",
  },
];

const CONCERTS = [
  {
    id: "summerfest-2025",
    title: "Summerfest 2025",
    artist: "Various Artists",
    venue: "Henry Maier Festival Park",
    city: "Milwaukee, WI",
    date: "June 19 – July 5, 2025",
    category: "concert" as const,
    affiliateNetwork: "ticketmaster",
    ticketUrl: "https://www.ticketmaster.com/summerfest-tickets/artist/735450",
    estimatedCommissionPct: 3,
    priceFrom: "$25",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80",
    description: "The world's largest music festival returns to Milwaukee's lakefront with 1,000+ acts across 12 stages.",
  },
  {
    id: "american-family-insurance-amphitheater",
    title: "American Family Insurance Amphitheater",
    artist: "Summer Concert Series",
    venue: "AmFam Amphitheater",
    city: "Milwaukee, WI",
    date: "Summer 2025",
    category: "concert" as const,
    affiliateNetwork: "ticketmaster",
    ticketUrl: "https://www.ticketmaster.com/american-family-insurance-amphitheater-tickets-milwaukee/venue/77329",
    estimatedCommissionPct: 3,
    priceFrom: "$35",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80",
    description: "Milwaukee's premier outdoor amphitheater hosts top national acts all summer long.",
  },
  {
    id: "pabst-theater",
    title: "Pabst Theater",
    artist: "Various Artists",
    venue: "Pabst Theater",
    city: "Milwaukee, WI",
    date: "Year-round",
    category: "concert" as const,
    affiliateNetwork: "ticketmaster",
    ticketUrl: "https://www.ticketmaster.com/pabst-theater-tickets-milwaukee/venue/77330",
    estimatedCommissionPct: 3,
    priceFrom: "$20",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
    description: "Milwaukee's historic 1895 theater hosts intimate concerts, comedy, and live performances year-round.",
  },
  {
    id: "fiserv-forum-concerts",
    title: "Fiserv Forum",
    artist: "Major Arena Acts",
    venue: "Fiserv Forum",
    city: "Milwaukee, WI",
    date: "Year-round",
    category: "concert" as const,
    affiliateNetwork: "ticketmaster",
    ticketUrl: "https://www.ticketmaster.com/fiserv-forum-tickets-milwaukee/venue/77331",
    estimatedCommissionPct: 3,
    priceFrom: "$45",
    image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&q=80",
    description: "Home of the Milwaukee Bucks and top-tier arena concerts — Taylor Swift, Beyoncé, and more.",
  },
];

const THEME_PARKS_ADVENTURES = [
  {
    id: "six-flags-great-america",
    title: "Six Flags Great America",
    category: "theme_park" as const,
    venue: "Six Flags Great America",
    city: "Gurnee, IL",
    distance: "~45 min from Waukesha",
    affiliateNetwork: "flexoffers-sixflags",
    ticketUrl: "https://www.sixflags.com/greatamerica/plan-your-visit/tickets",
    estimatedCommissionPct: 5,
    priceFrom: "$39.99",
    image: "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=400&q=80",
    description: "One of the Midwest's largest theme parks with 50+ rides including Goliath, Raging Bull, and Superman.",
    highlights: ["50+ rides", "Water park included", "Fright Fest in fall", "Holiday in the Park"],
  },
  {
    id: "milwaukee-county-zoo",
    title: "Milwaukee County Zoo",
    category: "adventure" as const,
    venue: "Milwaukee County Zoo",
    city: "Milwaukee, WI",
    distance: "~20 min from Waukesha",
    affiliateNetwork: "viator",
    ticketUrl: "https://www.viator.com/Milwaukee/d4517-ttd",
    estimatedCommissionPct: 8,
    priceFrom: "$18",
    image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&q=80",
    description: "200+ acres of wildlife with 2,000+ animals. Perfect for a date or family outing.",
    highlights: ["2,000+ animals", "Train rides", "Special events", "200 acres"],
  },
  {
    id: "vertical-adventures-waukesha",
    title: "Vertical Adventures Rock Climbing",
    category: "adventure" as const,
    venue: "Vertical Adventures",
    city: "Waukesha, WI",
    distance: "Local",
    affiliateNetwork: "viator",
    ticketUrl: "https://www.viator.com/Waukesha/d4518-ttd",
    estimatedCommissionPct: 8,
    priceFrom: "$20",
    image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400&q=80",
    description: "Indoor rock climbing gym in Waukesha — great for active dates and meeting adventurous people.",
    highlights: ["All skill levels", "Gear rental", "Lessons available", "Group events"],
  },
  {
    id: "escape-room-waukesha",
    title: "Escape Room Waukesha",
    category: "adventure" as const,
    venue: "Escape Room Waukesha",
    city: "Waukesha, WI",
    distance: "Local",
    affiliateNetwork: "groupon",
    ticketUrl: "https://www.groupon.com/local/waukesha-wi/escape-rooms",
    estimatedCommissionPct: 7,
    priceFrom: "$28/person",
    image: "https://images.unsplash.com/photo-1559583109-3e7968136c99?w=400&q=80",
    description: "Team up with your date or group to solve puzzles and escape before time runs out.",
    highlights: ["Multiple themes", "60 min sessions", "2–8 players", "Great for dates"],
  },
  {
    id: "frame-park-mini-golf",
    title: "Frame Park Mini Golf",
    category: "adventure" as const,
    venue: "Frame Park",
    city: "Waukesha, WI",
    distance: "0.5 mi from downtown",
    affiliateNetwork: "direct",
    ticketUrl: "https://www.waukesha-wi.gov/parks/frame-park",
    estimatedCommissionPct: 0,
    priceFrom: "$5",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&q=80",
    description: "The local mini golf course right in Waukesha — casual, fun, and perfect for a first date.",
    highlights: ["18 holes", "Riverside views", "Picnic areas", "Open May–Oct"],
  },
  {
    id: "waukesha-farmers-market",
    title: "Waukesha Farmers Market",
    category: "adventure" as const,
    venue: "Waukesha Farmers Market",
    city: "Waukesha, WI",
    distance: "Downtown",
    affiliateNetwork: "direct",
    ticketUrl: "https://www.waukeshafarmersmarket.com",
    estimatedCommissionPct: 0,
    priceFrom: "Free admission",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&q=80",
    description: "Saturday mornings downtown — fresh produce, local vendors, live music. A classic Waukesha date.",
    highlights: ["Every Saturday", "Local vendors", "Live music", "Free entry"],
  },
  {
    id: "great-lakes-dragaway",
    title: "Great Lakes Dragaway",
    category: "sports" as const,
    venue: "Great Lakes Dragaway",
    city: "Union Grove, WI",
    distance: "~35 min from Waukesha",
    affiliateNetwork: "ticketmaster",
    ticketUrl: "https://www.greatlakesdragaway.com/tickets",
    estimatedCommissionPct: 3,
    priceFrom: "$15",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80",
    description: "Watch drag racing at one of the Midwest's premier drag strips — an adrenaline-fueled date night.",
    highlights: ["Drag racing", "Special events", "Family friendly", "Concessions"],
  },
  {
    id: "american-science-surplus",
    title: "Boerner Botanical Gardens",
    category: "adventure" as const,
    venue: "Boerner Botanical Gardens",
    city: "Hales Corners, WI",
    distance: "~15 min from Waukesha",
    affiliateNetwork: "viator",
    ticketUrl: "https://www.viator.com/Milwaukee-attractions/Boerner-Botanical-Gardens/d4517-a23456",
    estimatedCommissionPct: 8,
    priceFrom: "$8",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80",
    description: "40 acres of stunning gardens — rose garden, perennial garden, and seasonal blooms. Romantic and peaceful.",
    highlights: ["40 acres", "Rose garden", "Walking paths", "Photography friendly"],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface TrailerModalProps {
  movie: typeof NOW_PLAYING_MOVIES[0] | null;
  onClose: () => void;
  onBookTickets: (movie: typeof NOW_PLAYING_MOVIES[0]) => void;
}

function TrailerModal({ movie, onClose, onBookTickets }: TrailerModalProps) {
  if (!movie) return null;
  return (
    <Dialog open={!!movie} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
        <div className="aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&mute=1&rel=0&playsinline=1`}
            title={`${movie.title} Trailer`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{movie.title}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-1 mb-3 flex-wrap">
            <Badge variant="outline" className="text-xs">{movie.rating}</Badge>
            <Badge variant="outline" className="text-xs">{movie.genre}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{movie.runtime}</span>
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><Star className="w-3 h-3" />{movie.score}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{movie.description}</p>
          <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl mb-4">
            <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">Marcus Majestic Cinema</p>
              <p className="text-xs text-muted-foreground">770 N Springdale Rd, Waukesha, WI 53186</p>
            </div>
          </div>
          <Button
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white gap-2"
            onClick={() => onBookTickets(movie)}
          >
            <Ticket className="w-4 h-4" /> Book Tickets on Fandango
            <ExternalLink className="w-3.5 h-3.5 ml-auto" />
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">Affiliate link — booking supports Just Putzit ❤️</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Entertainment() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("movies");
  const [selectedMovie, setSelectedMovie] = useState<typeof NOW_PLAYING_MOVIES[0] | null>(null);

  const trackMovieClick = trpc.entertainment.trackMovieClick.useMutation();
  const trackEntertainmentClick = trpc.entertainment.trackEntertainmentClick.useMutation();

  function handleBookTickets(movie: typeof NOW_PLAYING_MOVIES[0]) {
    trackMovieClick.mutate({ movieId: movie.id, movieTitle: movie.title });
    // Build Fandango affiliate URL — replace YOUR_AFFILIATE_ID with actual CJ ID once signed up
    const affiliateId = import.meta.env.VITE_FANDANGO_AFFILIATE_ID || "";
    const url = affiliateId
      ? `${movie.fandangoUrl}?affiliateId=${affiliateId}`
      : movie.fandangoUrl;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Opening Fandango — enjoy the movie! 🍿");
    setSelectedMovie(null);
  }

  function handleEntertainmentClick(item: typeof CONCERTS[0] | typeof THEME_PARKS_ADVENTURES[0]) {
    trackEntertainmentClick.mutate({
      category: item.category,
      eventId: item.id,
      eventTitle: item.title,
      venueName: item.venue,
      venueCity: item.city,
      affiliateNetwork: item.affiliateNetwork,
      affiliateUrl: item.ticketUrl,
      estimatedCommissionPct: item.estimatedCommissionPct,
    });
    window.open(item.ticketUrl, "_blank", "noopener,noreferrer");
    toast.success("Opening ticket page — have a great time! 🎉");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">Entertainment Hub</h1>
          <p className="text-muted-foreground">Movies, concerts, theme parks & adventures near Waukesha</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 rounded-full flex-wrap h-auto gap-1">
            <TabsTrigger value="movies" className="rounded-full gap-1.5">
              <Film className="w-3.5 h-3.5" /> Movies
            </TabsTrigger>
            <TabsTrigger value="concerts" className="rounded-full gap-1.5">
              <Music className="w-3.5 h-3.5" /> Concerts
            </TabsTrigger>
            <TabsTrigger value="parks" className="rounded-full gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Theme Parks
            </TabsTrigger>
            <TabsTrigger value="adventures" className="rounded-full gap-1.5">
              <Mountain className="w-3.5 h-3.5" /> Adventures
            </TabsTrigger>
          </TabsList>

          {/* ── Movies ── */}
          <TabsContent value="movies">
            <div className="mb-4 flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-900">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Marcus Majestic Cinema — Waukesha, WI</p>
                <p className="text-xs text-muted-foreground">770 N Springdale Rd · (262) 798-4099 · UltraScreen + SuperScreen</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-1.5 shrink-0"
                onClick={() => window.open("https://www.fandango.com/marcus-majestic-cinema-of-brookfield-aauml/theater-page", "_blank")}
              >
                <ExternalLink className="w-3 h-3" /> All Showtimes
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {NOW_PLAYING_MOVIES.map((movie) => (
                <Card key={movie.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setSelectedMovie(movie)}>
                  <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&q=80"; }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-orange-500 ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white text-xs">{movie.score}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{movie.title}</p>
                    <p className="text-xs text-muted-foreground">{movie.genre}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">{movie.rating}</Badge>
                      <span className="text-xs text-muted-foreground">{movie.runtime}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Tap any movie to watch the trailer and book tickets · Powered by Fandango affiliate program
            </p>
          </TabsContent>

          {/* ── Concerts ── */}
          <TabsContent value="concerts">
            <div className="space-y-4">
              {CONCERTS.map((concert) => (
                <Card key={concert.id} className="border-none shadow-sm overflow-hidden">
                  <div className="flex gap-4 p-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
                      <img src={concert.image} alt={concert.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-base leading-tight">{concert.title}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">{concert.priceFrom}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{concert.artist}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" /> {concert.venue} · {concert.city}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{concert.description}</p>
                      <Button
                        size="sm"
                        className="rounded-full gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleEntertainmentClick(concert)}
                      >
                        <Ticket className="w-3.5 h-3.5" /> Get Tickets
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Tickets via Ticketmaster affiliate program · {3}% commission per sale
            </p>
          </TabsContent>

          {/* ── Theme Parks ── */}
          <TabsContent value="parks">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {THEME_PARKS_ADVENTURES.filter(i => i.category === "theme_park").map((item) => (
                <EntertainmentCard key={item.id} item={item} onBook={handleEntertainmentClick} />
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Tickets via Six Flags affiliate (FlexOffers) · up to 5% commission
            </p>
          </TabsContent>

          {/* ── Adventures ── */}
          <TabsContent value="adventures">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {THEME_PARKS_ADVENTURES.filter(i => i.category !== "theme_park").map((item) => (
                <EntertainmentCard key={item.id} item={item} onBook={handleEntertainmentClick} />
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Powered by Viator (8% commission) and Groupon (7% commission) affiliate programs
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <TrailerModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onBookTickets={handleBookTickets}
      />
    </div>
  );
}

function EntertainmentCard({
  item,
  onBook,
}: {
  item: typeof THEME_PARKS_ADVENTURES[0];
  onBook: (item: typeof THEME_PARKS_ADVENTURES[0]) => void;
}) {
  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-40 bg-muted overflow-hidden">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-base leading-tight">{item.title}</p>
          <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
            <MapPin className="w-3 h-3" /> {item.city} · {item.distance}
          </div>
        </div>
        {item.estimatedCommissionPct > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-500 text-white text-xs">{item.estimatedCommissionPct}% commission</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
        {(item as typeof THEME_PARKS_ADVENTURES[0] & { highlights?: string[] }).highlights && (
          <div className="flex flex-wrap gap-1 mb-3">
            {((item as typeof THEME_PARKS_ADVENTURES[0] & { highlights?: string[] }).highlights ?? []).map((h) => (
              <Badge key={h} variant="secondary" className="text-xs">{h}</Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
            <DollarSign className="w-3.5 h-3.5" /> From {item.priceFrom}
          </div>
          <Button
            size="sm"
            className="rounded-full gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => onBook(item)}
          >
            <Ticket className="w-3.5 h-3.5" />
            {item.affiliateNetwork === "direct" ? "Learn More" : "Get Tickets"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
