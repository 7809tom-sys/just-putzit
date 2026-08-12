import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { showCalendarDownloadToast } from "@/components/CalendarDownloadToast";
import {
  buildBookingCalendarEvent,
  getBookingIcs,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  BOOKING_CALENDAR_PROVIDERS_TOOLTIP,
  type BookingCalendarInput,
} from "@/lib/bookingCalendar";

export function BookingCalendarMenu({ booking }: { booking: BookingCalendarInput }) {
  const event = buildBookingCalendarEvent(booking);
  if (!event) return null;

  const downloadAppleCalendar = () => {
    const blob = new Blob([getBookingIcs(event)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "just-putzit-booking.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showCalendarDownloadToast();
  };

  return <Tooltip><TooltipTrigger asChild><span className="inline-flex"><DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" aria-label={`Add booking to ${BOOKING_CALENDAR_PROVIDERS_TOOLTIP}`} className="group rounded-full bg-card transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"><CalendarPlus className="mr-1.5 h-3.5 w-3.5 transition-transform duration-150 group-hover:-rotate-6" />Add to calendar</Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem onClick={() => window.open(getGoogleCalendarUrl(event), "_blank", "noopener,noreferrer")}>Google Calendar</DropdownMenuItem><DropdownMenuItem onClick={() => window.open(getOutlookCalendarUrl(event), "_blank", "noopener,noreferrer")}>Outlook Calendar</DropdownMenuItem><DropdownMenuItem onClick={downloadAppleCalendar}>Download standard .ics file</DropdownMenuItem></DropdownMenuContent></DropdownMenu></span></TooltipTrigger><TooltipContent className="max-w-64"><p>Google, Outlook, or Apple Calendar.</p><p className="mt-1 text-muted-foreground">Other provider? Choose the standard .ics download.</p></TooltipContent></Tooltip>;
}
