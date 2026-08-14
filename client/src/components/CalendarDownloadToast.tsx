import { CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { BOOKING_ICS_DOWNLOAD_DESCRIPTION, BOOKING_ICS_DOWNLOAD_SUCCESS } from "@/lib/bookingCalendar";

export const CALENDAR_DOWNLOAD_TOAST_DURATION = 5000;

function CalendarDownloadToast({ toastId, description }: { toastId: string | number; description: string }) {
  return <div role="status" aria-live="polite" className="relative w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-emerald-200 bg-white p-4 pr-10 shadow-xl shadow-emerald-950/10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" /><div><p className="font-semibold text-foreground">{BOOKING_ICS_DOWNLOAD_SUCCESS}</p><p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{description}</p></div></div><button type="button" aria-label="Dismiss download confirmation" className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => toast.dismiss(toastId)}><X className="h-4 w-4" /></button><div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-100" aria-hidden="true"><div className="h-full w-full origin-left bg-emerald-500 motion-safe:animate-calendar-toast-progress" /></div></div>;
}

export function showCalendarDownloadToast(description = BOOKING_ICS_DOWNLOAD_DESCRIPTION) {
  toast.custom((toastId) => <CalendarDownloadToast toastId={toastId} description={description} />, { duration: CALENDAR_DOWNLOAD_TOAST_DURATION });
}
