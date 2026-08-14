import { useState } from "react";
import { Ban, Flag, MoreHorizontal, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const REPORT_REASONS = [
  ["harassment", "Harassment or unwanted contact"],
  ["scammer", "Scam or request for money"],
  ["fake_profile", "Fake profile or misleading identity"],
  ["bot", "Bot or suspicious automated behavior"],
  ["inappropriate", "Inappropriate content"],
  ["other", "Something else"],
] as const;

type MemberSafetyActionsProps = {
  targetUserId: number;
  targetName: string;
  compact?: boolean;
  onBlocked?: () => void;
};

export function MemberSafetyActions({ targetUserId, targetName, compact = false, onBlocked }: MemberSafetyActionsProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number][0]>("harassment");
  const [details, setDetails] = useState("");
  const report = trpc.safety.report.useMutation({
    onSuccess: () => {
      toast.success("Report received", { description: "Your report is private and will be reviewed by the Just Putzit safety team." });
      setReportOpen(false);
      setDetails("");
    },
    onError: (error) => toast.error("Couldn’t submit report", { description: error.message }),
  });
  const block = trpc.safety.block.useMutation({
    onSuccess: () => {
      toast.success(`${targetName} is blocked`, { description: "They can no longer appear in your matches or send you messages." });
      setBlockOpen(false);
      onBlocked?.();
    },
    onError: (error) => toast.error("Couldn’t block this member", { description: error.message }),
  });

  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size={compact ? "icon" : "sm"} className={compact ? "h-9 w-9 rounded-full text-muted-foreground hover:bg-muted" : "rounded-full text-muted-foreground"} aria-label={`Safety actions for ${targetName}`}>
          {compact ? <MoreHorizontal className="h-4 w-4" /> : <><ShieldAlert className="mr-1.5 h-3.5 w-3.5" />Safety</>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
        <DropdownMenuLabel>Keep your space comfortable</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setReportOpen(true)}><Flag className="mr-2 h-4 w-4 text-orange-600" />Report {targetName}</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setBlockOpen(true)}><Ban className="mr-2 h-4 w-4" />Block {targetName}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Report {targetName}</DialogTitle>
          <DialogDescription>Your report is private. {targetName} will not be told who sent it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label htmlFor={`report-reason-${targetUserId}`}>What happened?</Label><select id={`report-reason-${targetUserId}`} value={reason} onChange={(event) => setReason(event.target.value as typeof reason)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">{REPORT_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="space-y-1.5"><Label htmlFor={`report-details-${targetUserId}`}>Anything else we should know? <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id={`report-details-${targetUserId}`} value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1000} rows={4} placeholder="Share only the details needed for a fair review." className="resize-none rounded-xl" /></div>
          <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">If you feel unsafe, stop engaging and use Block as well. For an immediate emergency, contact local emergency services.</p>
          <div className="flex gap-2"><Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setReportOpen(false)}>Cancel</Button><Button type="button" className="flex-1 rounded-xl bg-orange-600 text-white hover:bg-orange-700" disabled={report.isPending} onClick={() => report.mutate({ reportedUserId: targetUserId, reason, details: details.trim() || undefined })}>{report.isPending ? "Sending…" : "Send private report"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader><AlertDialogTitle>Block {targetName}?</AlertDialogTitle><AlertDialogDescription>This immediately removes the member from your matches and closes your conversation. They are not notified that you blocked them.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Keep conversation</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={block.isPending} onClick={(event) => { event.preventDefault(); block.mutate({ blockedUserId: targetUserId }); }}>{block.isPending ? "Blocking…" : "Block member"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
