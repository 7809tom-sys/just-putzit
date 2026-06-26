import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Flag, Users, AlertTriangle, CheckCircle, XCircle, Ban } from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("reports");

  const { data: reports, refetch: refetchReports } = trpc.safety.getReports.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: flags, refetch: refetchFlags } = trpc.safety.getFlags.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: allUsers } = trpc.safety.getAllUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const updateReport = trpc.safety.updateReport.useMutation({
    onSuccess: () => { refetchReports(); toast.success("Report updated"); },
  });
  const resolveFlag = trpc.safety.resolveFlag.useMutation({
    onSuccess: () => { refetchFlags(); toast.success("Flag resolved"); },
  });
  const suspendUser = trpc.safety.suspendUser.useMutation({
    onSuccess: () => { toast.success("User suspended"); },
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Access Restricted</h2>
          <p className="text-gray-500 mb-6">This area is for Just Putzit administrators only.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingReports = reports?.filter(r => r.status === "pending") ?? [];
  const unresolvedFlags = flags?.filter(f => !f.resolvedAt) ?? [];

  const reasonColors: Record<string, string> = {
    scammer: "bg-red-100 text-red-800",
    bot: "bg-orange-100 text-orange-800",
    harassment: "bg-purple-100 text-purple-800",
    fake_profile: "bg-yellow-100 text-yellow-800",
    inappropriate: "bg-pink-100 text-pink-800",
    other: "bg-gray-100 text-gray-800",
  };

  const severityColors: Record<string, string> = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Admin Moderation Panel</h1>
            <p className="text-gray-500 text-sm">Just Putzit Safety & Trust Dashboard</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pending Reports", value: pendingReports.length, icon: <AlertTriangle className="w-5 h-5 text-red-500" />, color: "border-red-200" },
            { label: "Open Flags", value: unresolvedFlags.length, icon: <Flag className="w-5 h-5 text-orange-500" />, color: "border-orange-200" },
            { label: "Total Users", value: allUsers?.length ?? 0, icon: <Users className="w-5 h-5 text-blue-500" />, color: "border-blue-200" },
            { label: "Total Reports", value: reports?.length ?? 0, icon: <Shield className="w-5 h-5 text-purple-500" />, color: "border-purple-200" },
          ].map((stat, i) => (
            <Card key={i} className={`border-2 ${stat.color}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  {stat.icon}
                  <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                </div>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Reports {pendingReports.length > 0 && <Badge className="bg-red-500 text-white text-xs ml-1">{pendingReports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="flags" className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Flags {unresolvedFlags.length > 0 && <Badge className="bg-orange-500 text-white text-xs ml-1">{unresolvedFlags.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>User Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {!reports || reports.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-500">No reports yet — the community is safe!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={reasonColors[report.reason] ?? "bg-gray-100 text-gray-800"}>
                                {report.reason.replace("_", " ")}
                              </Badge>
                              <Badge variant={report.status === "pending" ? "destructive" : "secondary"}>
                                {report.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Reporter ID:</strong> {report.reporterId} →{" "}
                              <strong>Reported ID:</strong> {report.reportedUserId}
                            </p>
                            {report.details && (
                              <p className="text-sm text-gray-500 bg-gray-50 rounded p-2 mt-2">
                                "{report.details}"
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(report.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {report.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-200"
                                  onClick={() => updateReport.mutate({ reportId: report.id, status: "reviewed" })}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" /> Review
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200"
                                  onClick={() => {
                                    updateReport.mutate({ reportId: report.id, status: "actioned" });
                                    suspendUser.mutate({ userId: report.reportedUserId });
                                  }}
                                >
                                  <Ban className="w-3 h-3 mr-1" /> Suspend
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateReport.mutate({ reportId: report.id, status: "dismissed" })}
                                >
                                  <XCircle className="w-3 h-3 mr-1" /> Dismiss
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flags Tab */}
          <TabsContent value="flags">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Generated Flags</CardTitle>
              </CardHeader>
              <CardContent>
                {!flags || flags.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-500">No flags — all clear!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flags.map((flag) => (
                      <div key={flag.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={severityColors[flag.severity ?? "low"] ?? "bg-gray-100"}>
                                {flag.severity} severity
                              </Badge>
                              <Badge variant="outline">{flag.flagType?.replace("_", " ")}</Badge>
                              {flag.resolvedAt && <Badge className="bg-green-100 text-green-800">Resolved</Badge>}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>User ID:</strong> {flag.userId}
                            </p>
                            {flag.notes && (
                              <p className="text-sm text-gray-500 bg-gray-50 rounded p-2 mt-2">{flag.notes}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(flag.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!flag.resolvedAt && (
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200"
                                onClick={() => resolveFlag.mutate({ flagId: flag.id })}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200"
                                onClick={() => {
                                  suspendUser.mutate({ userId: flag.userId });
                                  resolveFlag.mutate({ flagId: flag.id });
                                }}
                              >
                                <Ban className="w-3 h-3 mr-1" /> Suspend
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                {!allUsers || allUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No users yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3 bg-white">
                        <div>
                          <p className="font-medium text-gray-900">{u.name ?? "Unnamed User"}</p>
                          <p className="text-sm text-gray-500">{u.email ?? "No email"}</p>
                          <p className="text-xs text-gray-400">
                            Joined {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                          {u.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200"
                              onClick={() => suspendUser.mutate({ userId: u.id })}
                            >
                              <Ban className="w-3 h-3 mr-1" /> Suspend
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
