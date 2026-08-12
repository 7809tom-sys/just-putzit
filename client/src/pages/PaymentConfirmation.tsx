import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { PAYMENT_CONFIRMATION_NAVIGATION } from "@/lib/paymentConfirmationNavigation";
import { CalendarDays, CheckCircle2, House, MapPin, ReceiptText, ShieldCheck, Ticket, Users } from "lucide-react";

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PaymentConfirmation() {
  const { isAuthenticated, loading } = useAuth();
  const [sessionId] = useState(() => new URLSearchParams(window.location.search).get("session_id") || "");
  const [isOpeningBookings, setIsOpeningBookings] = useState(false);
  const confirmation = trpc.marketplace.getPaymentConfirmation.useQuery(
    { sessionId },
    { enabled: isAuthenticated && sessionId.length >= 10, refetchInterval: (query) => query.state.data?.status === "processing" ? 1500 : false }
  );

  const handleViewBookings = () => {
    if (isOpeningBookings) return;
    setIsOpeningBookings(true);
    window.requestAnimationFrame(() => {
      window.location.assign(PAYMENT_CONFIRMATION_NAVIGATION.bookings.href);
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Spinner /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background"><div className="container max-w-md py-24 text-center">
        <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="font-display text-2xl font-bold">Sign in to view your confirmation</h1>
        <p className="mt-2 text-sm text-muted-foreground">For your privacy, booking details are available only in your Just Putzit account.</p>
        <Button className="mt-6 rounded-full" onClick={() => window.location.href = getLoginUrl()}>Sign in</Button>
      </div></div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background"><div className="container max-w-md py-24 text-center">
        <ReceiptText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Payment confirmation unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">This link is missing the secure payment reference. Your bookings are still available in your account.</p>
        <Button className="mt-6 rounded-full" asChild><a href="/bookings">View my bookings</a></Button>
      </div></div>
    );
  }

  if (confirmation.isLoading || confirmation.data?.status === "processing") {
    return (
      <div className="min-h-screen bg-background"><div className="container max-w-md py-24 text-center">
        <Spinner className="mx-auto mb-5 h-8 w-8" />
        <h1 className="font-display text-2xl font-bold">Confirming your payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">Stripe has your payment. We are finalizing your booking details now.</p>
      </div></div>
    );
  }

  if (confirmation.error || !confirmation.data?.booking) {
    return (
      <div className="min-h-screen bg-background"><div className="container max-w-md py-24 text-center">
        <ReceiptText className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h1 className="font-display text-2xl font-bold">We could not load this confirmation</h1>
        <p className="mt-2 text-sm text-muted-foreground">{confirmation.error?.message || "Your payment may still be processing. Check My Bookings in a moment."}</p>
        <div className="mt-6 flex justify-center gap-3"><Button variant="outline" className="rounded-full bg-card" asChild><a href="/marketplace">Marketplace</a></Button><Button className="rounded-full" asChild><a href="/bookings">My bookings</a></Button></div>
      </div></div>
    );
  }

  const { booking, activity, venue } = confirmation.data;
  return (
    <div className="min-h-screen bg-background py-10 sm:py-16">
      <main className="container max-w-2xl">
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-lg sm:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><CheckCircle2 className="h-8 w-8" /></div>
            <div>
              <Badge className="rounded-full">Payment confirmed</Badge>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">You’re booked!</h1>
              <p className="mt-2 text-sm text-muted-foreground">Your secure Stripe payment was received and your activity is confirmed.</p>
            </div>
          </div>

          <Card className="mt-7 border-border/80 bg-card shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-sally text-2xl">{activity?.imageEmoji ?? "🎟️"}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-bold">{activity?.title ?? "Your activity"}</h2>
                  {venue && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{venue.name}{venue.city ? `, ${venue.city}` : ""}</p>}
                </div>
              </div>
              <div className="mt-5 grid gap-3 border-t pt-5 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4 text-primary" />{booking.partySize} {booking.partySize === 1 ? "guest" : "guests"}</div>
                {booking.scheduledFor && <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4 text-primary" />{new Date(booking.scheduledFor).toLocaleString()}</div>}
                <div className="flex items-center gap-2 text-muted-foreground"><ReceiptText className="h-4 w-4 text-primary" />Paid {dollars(booking.totalPriceCents)}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Ticket className="h-4 w-4 text-primary" />Code <span className="font-mono font-semibold text-foreground">{booking.confirmationCode}</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button className="rounded-full" onClick={handleViewBookings} disabled={isOpeningBookings} aria-busy={isOpeningBookings}>
              {isOpeningBookings ? <Spinner className="mr-2 h-4 w-4" /> : <Ticket className="mr-2 h-4 w-4" />}
              {isOpeningBookings ? PAYMENT_CONFIRMATION_NAVIGATION.bookings.loadingLabel : PAYMENT_CONFIRMATION_NAVIGATION.bookings.label}
            </Button>
            <Button variant="outline" className="rounded-full bg-card" asChild><a href={PAYMENT_CONFIRMATION_NAVIGATION.home.href}><House className="mr-2 h-4 w-4" />{PAYMENT_CONFIRMATION_NAVIGATION.home.label}</a></Button>
          </div>
        </section>
      </main>
    </div>
  );
}
