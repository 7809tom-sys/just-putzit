import { CalendarPlus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { showCalendarDownloadToast } from "@/components/CalendarDownloadToast";
import { buildBookingCalendarEvent, getBookingIcs, getGoogleCalendarUrl, getOutlookCalendarUrl, BOOKING_CALENDAR_PROVIDERS_TOOLTIP } from "@/lib/bookingCalendar";
import { shareLibraryEvent } from "@/lib/libraryEventShare";
import { toast } from "sonner";

export type LibraryCalendarProgram = {
  id: number;
  title: string;
  eventDate: Date | string;
  venueName?: string | null;
  address?: string | null;
  externalUrl?: string | null;
};

export function LibraryCalendarMenu({ program, dark = false }: { program: LibraryCalendarProgram; dark?: boolean }) {
  const event = buildBookingCalendarEvent({
    title: program.title,
    start: program.eventDate,
    durationMinutes: 90,
    location: [program.venueName ?? "Waukesha Public Library", program.address].filter(Boolean).join(" · "),
    details: `Waukesha Public Library program from Just Putzit.${program.externalUrl ? ` Official details: ${program.externalUrl}` : ""}`,
    confirmationCode: `waukesha-library-${program.id}`,
  });
  if (!event) return null;
  const buttonClass = dark ? "border-sky-300/30 bg-white/10 text-white hover:bg-white/20" : "border-sky-200 bg-white text-foreground hover:bg-sky-50";
  const downloadIcs = () => {
    const blob = new Blob([getBookingIcs(event)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "waukesha-library-program.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showCalendarDownloadToast("Open the .ics file to add this library program to your calendar.");
  };
  const shareEvent = async () => {
    const outcome = await shareLibraryEvent(program);
    if (outcome === "shared") toast.success("Ready to share", { description: "Choose an app or contact to send this public program." });
    if (outcome === "copied") toast.success("Event details copied", { description: "Paste them into an email, message, or social post." });
    if (outcome === "unavailable") toast.error("Sharing is unavailable", { description: "Try copying the official library link instead." });
  };

  return <div className="flex flex-wrap gap-2"><Tooltip><TooltipTrigger asChild><span className="inline-flex"><DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" aria-label={`Save ${program.title} to ${BOOKING_CALENDAR_PROVIDERS_TOOLTIP}`} className={`group rounded-full ${buttonClass}`}><CalendarPlus className="mr-1.5 h-3.5 w-3.5 transition-transform duration-150 group-hover:-rotate-6" />Save to calendar</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => window.open(getGoogleCalendarUrl(event), "_blank", "noopener,noreferrer")}>Google Calendar</DropdownMenuItem><DropdownMenuItem onClick={() => window.open(getOutlookCalendarUrl(event), "_blank", "noopener,noreferrer")}>Outlook Calendar</DropdownMenuItem><DropdownMenuItem onClick={downloadIcs}>Download standard .ics file</DropdownMenuItem></DropdownMenuContent></DropdownMenu></span></TooltipTrigger><TooltipContent className="max-w-64"><p>Google, Outlook, or Apple Calendar.</p><p className="mt-1 text-muted-foreground">Other provider? Choose the standard .ics download.</p></TooltipContent></Tooltip><Button size="sm" variant="outline" aria-label={`Share ${program.title}`} className={`rounded-full ${buttonClass}`} onClick={shareEvent}><Share2 className="mr-1.5 h-3.5 w-3.5" />Share event</Button></div>;
}
