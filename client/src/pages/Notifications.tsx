import { Bell, CheckCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getNotificationActionLabel, getNotificationDestination } from "@/lib/notificationDestination";

export default function Notifications() {
  const utils = trpc.useUtils();
  const { data: notifications = [], isLoading } = trpc.notifications.getAll.useQuery();
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.getAll.invalidate(),
  });
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <main className="min-h-screen gradient-warm">
      <section className="container max-w-2xl py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">YOUR UPDATES</p>
            <h1 className="font-display text-3xl font-bold text-foreground">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">Matches, messages, and Sally’s latest updates.</p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              className="shrink-0 rounded-full"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              {markAllRead.isPending ? "Saving…" : "Mark all read"}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-3xl bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bell className="h-7 w-7" /></div>
            <h2 className="font-display text-xl font-bold">You’re all caught up</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Sally will let you know when there is a new match, message, game, or local update.</p>
            <Link href="/">
              <Button className="mt-5 rounded-full">Go Home</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const destination = getNotificationDestination(notification.type, notification.relatedId);
              const actionLabel = getNotificationActionLabel(notification.type);
              return (
              <article key={notification.id} className={`rounded-2xl border p-4 shadow-sm ${notification.isRead ? "border-border bg-white" : "border-primary/25 bg-primary/5"}`}>
                <div className="flex gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${notification.isRead ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground">{notification.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{notification.body}</p>
                    {!notification.isRead && <span className="mt-2 inline-flex text-xs font-semibold text-primary">New</span>}
                    {destination && actionLabel && (
                      <Link href={destination}>
                        <Button size="sm" variant="outline" className="mt-3 rounded-full">{actionLabel}</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
