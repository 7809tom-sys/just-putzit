import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getBookingCheckInError } from "@shared/attendanceProof";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

type BookingAttendanceCheckInProps = {
  bookingId: number;
  status: string;
  scheduledFor?: Date | string | null;
  compact?: boolean;
};

export function BookingAttendanceCheckIn({ bookingId, status, scheduledFor, compact = false }: BookingAttendanceCheckInProps) {
  const utils = trpc.useUtils();
  const checkInError = getBookingCheckInError(status, scheduledFor);
  const checkIn = trpc.marketplace.checkInBooking.useMutation({
    onSuccess: () => {
      toast.success("Attendance confirmed", {
        description: "Thanks for the private check-in. Partners see only aggregate totals.",
      });
      utils.marketplace.myBookings.invalidate();
      utils.dashboard.get.invalidate();
      utils.vendor.impactResults.invalidate();
    },
    onError: (error) => toast.error(error.message || "We could not record your check-in."),
  });

  if (status === "checked_in") {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800"><CheckCircle2 className="h-3.5 w-3.5" />Attendance confirmed</span>;
  }
  if (checkInError) return null;

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="rounded-full bg-card text-teal-800 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
      disabled={checkIn.isPending}
      onClick={() => checkIn.mutate({ bookingId })}
      aria-label="Confirm that you attended this activity"
    >
      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
      {checkIn.isPending ? "Confirming…" : compact ? "I went" : "I went"}
    </Button>
  );
}
