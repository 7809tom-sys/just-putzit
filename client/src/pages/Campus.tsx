import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap, Users, MapPin, CheckCircle, Search, Heart } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function CampusPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [browseCampusId, setBrowseCampusId] = useState<number | null>(null);

  const { data: campuses, refetch } = trpc.campus.listAll.useQuery(undefined, { enabled: !!user });
  const { data: members } = trpc.campus.browseMembers.useQuery(
    { campusId: browseCampusId! },
    { enabled: browseCampusId !== null }
  );

  const joinMutation = trpc.campus.join.useMutation({
    onSuccess: () => { toast.success("Joined campus dating pool!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const leaveMutation = trpc.campus.leave.useMutation({
    onSuccess: () => { toast.success("Left campus dating pool."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (campuses ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: Waukesha first, then by member count
  const sorted = [...filtered].sort((a, b) => {
    if (a.city === "Waukesha" && b.city !== "Waukesha") return -1;
    if (b.city === "Waukesha" && a.city !== "Waukesha") return 1;
    return (b.memberCount ?? 0) - (a.memberCount ?? 0);
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-sm w-full mx-4 text-center p-8">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h2 className="text-xl font-bold mb-2">Campus Dating Pool</h2>
          <p className="text-muted-foreground mb-4">Sign in to join your university's dating pool and meet people from your campus.</p>
          <Button asChild><Link href="/">Get Started</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold">Campus Dating Pool</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Join your university's dating pool and connect with people from your campus. No email verification required — just tap to join!
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search universities by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Campus Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((campus) => (
            <Card
              key={campus.id}
              className={`relative overflow-hidden transition-all hover:shadow-md ${campus.isMember ? "ring-2 ring-orange-400" : ""}`}
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: campus.colorHex ?? "#f97316" }}
              />
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base leading-tight">{campus.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{campus.city}, {campus.state}</span>
                    </div>
                  </div>
                  {campus.isMember && (
                    <Badge className="bg-orange-500 text-white shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Joined
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>
                      <strong className="text-foreground">{campus.memberCount ?? 0}</strong> members
                    </span>
                    {campus.mascot && (
                      <span className="ml-2 text-xs">· {campus.mascot}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {campus.isMember && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBrowseCampusId(campus.id)}
                          >
                            <Heart className="w-3 h-3 mr-1" />
                            Browse
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{campus.name} — Dating Pool</DialogTitle>
                          </DialogHeader>
                          {!members || members.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                              <p>No other members yet. Invite your classmates!</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {members.map((m, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                                  <Avatar>
                                    <AvatarFallback className="bg-orange-100 text-orange-700">
                                      {(m.displayName ?? "?")[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{m.displayName ?? "Anonymous"}</p>
                                    {m.city && (
                                      <p className="text-xs text-muted-foreground">{m.city}</p>
                                    )}
                                    {m.bio && (
                                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{m.bio}</p>
                                    )}
                                  </div>
                                  {m.gender && (
                                    <Badge variant="secondary" className="text-xs shrink-0">{m.gender}</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                    {campus.isMember ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-600 hover:border-red-300"
                        onClick={() => leaveMutation.mutate({ campusId: campus.id })}
                        disabled={leaveMutation.isPending}
                      >
                        Leave
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => joinMutation.mutate({ campusId: campus.id })}
                        disabled={joinMutation.isPending}
                      >
                        Join Pool
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No universities found matching "{search}"</p>
          </div>
        )}

        {/* Recommend a Friend Banner */}
        <div className="mt-10 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-1">Know someone who should be here?</h3>
          <p className="text-orange-100 mb-4">Recommend a friend and help grow your campus community!</p>
          <Button asChild variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold">
            <Link href="/shout-out">Recommend a Friend</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
