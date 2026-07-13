import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { MapPin, CalendarDays, Ticket, Users, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

function dollars(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(0)}`;
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-primary text-primary-foreground",
  checked_in: "bg-green-600 text-white",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function Bookings() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const { data: bookings, isLoading } = trpc.marketplace.myBookings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const cancelMutation = trpc.marketplace.cancel.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled.");
      utils.marketplace.myBookings.invalidate();
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32"><Spinner /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md py-24 text-center">
          <div className="text-5xl mb-4">🎟️</div>
          <h1 className="font-display text-2xl font-bold mb-2">Your bookings</h1>
          <p className="text-muted-foreground mb-6">Sign in to see your upcoming activities.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())} className="rounded-full">Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">My Bookings</h1>
            <p className="text-sm text-muted-foreground">Your upcoming and past activities.</p>
          </div>
          <Button variant="outline" className="rounded-full bg-card gap-2" asChild>
            <a href="/marketplace"><Ticket className="w-4 h-4" /> Browse more</a>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map(b => (
              <Card key={b.id} className="border-none shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-sally flex items-center justify-center text-2xl shrink-0">
                    {b.activity?.imageEmoji ?? "🎉"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{b.activity?.title ?? "Activity"}</h3>
                      <Badge className={`rounded-full text-[10px] capitalize ${STATUS_STYLE[b.status] ?? ""}`}>
                        {b.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-1">
                      {b.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.venue.name}</span>}
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {b.partySize}</span>
                      {b.scheduledFor && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> {new Date(b.scheduledFor).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1">
                      Confirmation <span className="font-mono font-semibold">{b.confirmationCode}</span> · {dollars(b.totalPriceCents)}
                    </p>
                  </div>
                  {b.status === "confirmed" && (
                    <Button
                      variant="ghost" size="sm"
                      className="text-destructive rounded-full shrink-0"
                      onClick={() => cancelMutation.mutate({ bookingId: b.id })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-10 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm text-muted-foreground mb-4">No bookings yet. Let's find something fun!</p>
              <Button className="rounded-full" asChild><a href="/marketplace">Browse activities</a></Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
