import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Crown, Search, Shield, ShieldCheck, ShieldOff, UserRoundCog, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAdminDate } from "@shared/adminDates";

type MemberRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin" | "banned";
  adminPromotedAt: Date | string | null;
  lastSignedIn: Date | string | null;
};


export default function AdminMembers() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const searchInput = useMemo(() => ({ query: search, limit: 100, offset: 0 }), [search]);
  const { data: members, isLoading } = trpc.safety.searchUsers.useQuery(searchInput, {
    enabled: user?.role === "admin",
  });
  const setAdministratorRole = trpc.safety.setAdministratorRole.useMutation({
    onSuccess: (_result, variables) => {
      utils.safety.searchUsers.invalidate();
      toast.success(variables.role === "admin" ? "Administrator access granted." : "Administrator access removed.");
    },
    onError: (error) => toast.error(error.message || "Unable to update administrator access."),
  });

  if (user?.role !== "admin") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md text-center shadow-sm">
          <CardContent className="p-8">
            <Shield className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h1 className="font-display text-2xl font-bold">Administrator access required</h1>
            <p className="mt-2 text-sm text-muted-foreground">Only current administrators can manage member roles.</p>
            <Link href="/"><Button className="mt-5 rounded-full">Go Home</Button></Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const visibleMembers = (members ?? []) as MemberRow[];
  const administrators = visibleMembers.filter((member) => member.role === "admin");

  const changeRole = (member: MemberRow, nextRole: "user" | "admin") => {
    const action = nextRole === "admin" ? "grant administrator access to" : "remove administrator access from";
    if (!window.confirm(`Are you sure you want to ${action} ${member.name ?? member.email ?? "this member"}?`)) return;
    setAdministratorRole.mutate({ userId: member.id, role: nextRole });
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="container max-w-5xl py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRoundCog className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold text-primary">ADMINISTRATION</p>
              <h1 className="font-display text-3xl font-bold">Manage administrators</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Grant trusted members access to the administration area or remove access when it is no longer needed.</p>
            </div>
          </div>
          <Link href="/admin"><Button variant="outline" className="rounded-full"><ArrowLeft className="mr-2 h-4 w-4" />Admin panel</Button></Link>
        </div>

        <Card className="mb-6 border-primary/15 bg-primary/[0.03] shadow-sm">
          <CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p><strong className="text-foreground">Safety guardrails:</strong> banned accounts cannot become administrators; you cannot remove your own access; and the owner administrator cannot be demoted from this page.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Member access</CardTitle>
              <CardDescription>{administrators.length} administrator{administrators.length === 1 ? "" : "s"} shown in this search.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 rounded-full pl-9" placeholder="Find a member by name or email" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Loading members…</p>
            ) : visibleMembers.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No members match that search.</p>
            ) : (
              <div className="divide-y divide-border">
                {visibleMembers.map((member) => {
                  const isAdministrator = member.role === "admin";
                  const isCurrentUser = member.id === user.id;
                  const isBanned = member.role === "banned";
                  return (
                    <div key={member.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${isAdministrator ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{(member.name ?? member.email ?? "?")[0]?.toUpperCase()}</div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{member.name ?? "Unnamed member"}</p>
                          <p className="truncate text-sm text-muted-foreground">{member.email ?? "No email on file"}</p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                            <span><strong className="font-semibold text-foreground/70">Promoted:</strong> {isAdministrator ? formatAdminDate(member.adminPromotedAt) : "—"}</span>
                            <span><strong className="font-semibold text-foreground/70">Last active:</strong> {formatAdminDate(member.lastSignedIn)}</span>
                          </div>
                        </div>
                        <Badge variant={isAdministrator ? "default" : isBanned ? "destructive" : "secondary"} className="shrink-0 capitalize">{isAdministrator && <Crown className="mr-1 h-3 w-3" />}{member.role}</Badge>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {isAdministrator ? (
                          <Button variant="outline" className="rounded-full" disabled={isCurrentUser || setAdministratorRole.isPending} onClick={() => changeRole(member, "user")}>
                            <ShieldOff className="mr-2 h-4 w-4" />{isCurrentUser ? "Your access" : "Remove admin"}
                          </Button>
                        ) : (
                          <Button className="rounded-full" disabled={isBanned || setAdministratorRole.isPending} onClick={() => changeRole(member, "admin")}>
                            <ShieldCheck className="mr-2 h-4 w-4" />{isBanned ? "Banned account" : "Make admin"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
