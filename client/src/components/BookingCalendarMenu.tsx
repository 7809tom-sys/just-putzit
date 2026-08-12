import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  buildBookingCalendarEvent,
  getBookingIcs,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
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
    toast.success("Calendar file downloaded.");
  };

  return <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="rounded-full bg-card"><CalendarPlus className="mr-1.5 h-3.5 w-3.5" />Add to calendar</Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem onClick={() => window.open(getGoogleCalendarUrl(event), "_blank", "noopener,noreferrer")}>Google Calendar</DropdownMenuItem><DropdownMenuItem onClick={() => window.open(getOutlookCalendarUrl(event), "_blank", "noopener,noreferrer")}>Outlook Calendar</DropdownMenuItem><DropdownMenuItem onClick={downloadAppleCalendar}>Apple Calendar (.ics)</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
