import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Calendar, CalendarPlus, Plus, Trash2, Download, MapPin, Clock, ExternalLink } from "lucide-react";
import { buildTripGoogleCalendarUrl } from "../../../shared/tripGoogleCalendar";
import { useLocation } from "wouter";
import { TripPlannerActivitySearch, type TripPlannerDiscoverableEvent } from "@/components/TripPlannerActivitySearch";

interface TripPlanFormData {
  title: string;
  tripDate: string;
  city: string;
  notes: string;
}

export default function TripPlanner() {
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDate, setItemDate] = useState("");
  const [itemTime, setItemTime] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("activity");
  const [, navigate] = useLocation();
  const [pendingActivity, setPendingActivity] = useState<{ title: string; time: string; location: string; notes: string; type: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const title = params.get("title")?.trim();
    return title ? {
      title,
      time: params.get("time") ?? "",
      location: params.get("location") ?? "",
      notes: params.get("notes") ?? "",
      type: params.get("type") ?? "activity",
    } : null;
  });

  const [formData, setFormData] = useState<TripPlanFormData>({
    title: "",
    tripDate: "",
    city: "",
    notes: "",
  });

  // Queries
  const { data: tripPlans, isLoading: tripsLoading, refetch: refetchTrips } = trpc.family.getTripPlans.useQuery();

  // Mutations
  const createTripMutation = trpc.family.createTripPlan.useMutation({
    onSuccess: () => {
      toast.success("Trip created!");
      setIsCreateTripOpen(false);
      setFormData({ title: "", tripDate: "", city: "", notes: "" });
      refetchTrips();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create trip");
    },
  });

  const addItemMutation = trpc.family.addTripItem.useMutation({
    onSuccess: async () => {
      toast.success("Item added!");
      setIsAddItemOpen(false);
      setItemTitle("");
      setItemDate("");
      setItemTime("");
      setItemDescription("");
      setItemCategory("activity");
      const refreshed = await refetchTrips();
      if (selectedTrip?.id) {
        const updatedTrip = (refreshed.data ?? []).find((trip: any) => trip.id === selectedTrip.id);
        if (updatedTrip) setSelectedTrip(updatedTrip);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add item");
    },
  });

  const removeItemMutation = trpc.family.removeTripItem.useMutation({
    onSuccess: () => {
      toast.success("Item removed");
      refetchTrips();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to remove item");
    },
  });

  const deleteTripMutation = trpc.family.deleteTripPlan.useMutation({
    onSuccess: () => {
      toast.success("Trip deleted");
      setSelectedTrip(null);
      refetchTrips();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete trip");
    },
  });

  // Generate ICS calendar file
  const generateICS = (trip: any) => {
    const events = trip.items || [];
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Just Putzit//Trip Planner//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${trip.title}
X-WR-TIMEZONE:America/Chicago
BEGIN:VTIMEZONE
TZID:America/Chicago
BEGIN:STANDARD
DTSTART:20231105T020000
TZOFFSETFROM:-0500
TZOFFSETTO:-0600
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:20230312T020000
TZOFFSETFROM:-0600
TZOFFSETTO:-0500
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
END:VTIMEZONE
`;

    events.forEach((item: any) => {
      const eventDate = item.time ? item.time.split("T")[0].replace(/-/g, "") : trip.tripDate.replace(/-/g, "");
      const eventTime = item.time ? item.time.split("T")[1]?.replace(/:/g, "") : "120000";
      const dtstart = `${eventDate}T${eventTime}00`;

      icsContent += `BEGIN:VEVENT
UID:${item.id}@justputzit.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART;TZID=America/Chicago:${dtstart}
SUMMARY:${item.title}
DESCRIPTION:${item.notes || ""}
LOCATION:${item.location || trip.city}
CATEGORIES:${item.type}
END:VEVENT
`;
    });

    icsContent += `END:VCALENDAR`;
    return icsContent;
  };

  const downloadICS = (trip: any) => {
    const icsContent = generateICS(trip);
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${trip.title.replace(/\s+/g, "_")}_itinerary.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Calendar exported!");
  };

  const openGoogleCalendar = (trip: any) => {
    const url = buildTripGoogleCalendarUrl(trip);
    if (!url) {
      toast.error("Add a trip title and date before sending it to Google Calendar.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCreateTrip = () => {
    if (!formData.title.trim() || !formData.tripDate || !formData.city.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    createTripMutation.mutate({
      title: formData.title,
      tripDate: formData.tripDate,
      city: formData.city,
      notes: formData.notes,
    });
  };

  const handleAddItem = () => {
    if (!selectedTrip || !itemTitle.trim() || !itemDate) {
      toast.error("Please fill in title and date");
      return;
    }

    addItemMutation.mutate({
      planId: selectedTrip.id,
      title: itemTitle,
      type: itemCategory as any,
      time: itemTime,
      location: itemDescription,
      url: undefined,
      notes: itemDescription,
    });
  };

  const addEventToTrip = (event: TripPlannerDiscoverableEvent) => {
    if (!selectedTrip) {
      toast.error("Choose a trip before adding an activity.");
      return;
    }
    const eventDate = event.eventDate ? new Date(event.eventDate) : null;
    addItemMutation.mutate({
      planId: selectedTrip.id,
      title: event.title,
      type: "event",
      time: eventDate && !Number.isNaN(eventDate.getTime()) ? eventDate.toISOString() : "",
      location: [event.venueName, event.address, event.city].filter(Boolean).join(" · ") || undefined,
      url: event.externalUrl || undefined,
      notes: event.description || undefined,
    });
  };

  const selectTrip = (trip: any) => {
    setSelectedTrip(trip);
    if (!pendingActivity) return;
    setItemTitle(pendingActivity.title);
    setItemDate(pendingActivity.time.slice(0, 10));
    setItemTime(pendingActivity.time);
    setItemDescription(pendingActivity.location || pendingActivity.notes);
    setItemCategory(["activity", "event", "venue", "custom"].includes(pendingActivity.type) ? pendingActivity.type : "activity");
    setPendingActivity(null);
    setIsAddItemOpen(true);
    navigate("/trip-planner");
  };

  const handleRemoveItem = (itemId: string) => {
    if (!selectedTrip) return;
    removeItemMutation.mutate({
      planId: selectedTrip.id,
      itemId,
    });
  };

  const handleDeleteTrip = () => {
    if (!selectedTrip) return;
    deleteTripMutation.mutate({ planId: selectedTrip.id });
  };

  if (tripsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Calendar size={32} />
              Trip Planner
            </h1>
            <p className="text-gray-600">Plan your family adventures and export to your calendar</p>
          </div>

          <Dialog open={isCreateTripOpen} onOpenChange={setIsCreateTripOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} />
                New Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Trip</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name</label>
                  <Input
                    placeholder="e.g., Summer Vacation 2024"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City / Destination</label>
                  <Input
                    placeholder="e.g., Orlando, FL"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip Date</label>
                  <Input
                    type="date"
                    value={formData.tripDate}
                    onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <Textarea
                    placeholder="Trip notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              <Button onClick={handleCreateTrip} disabled={createTripMutation.isPending} className="w-full">
                {createTripMutation.isPending ? "Creating..." : "Create Trip"}
              </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trips List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">My Trips</h2>
              {trips.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No trips yet. Create one to get started!</p>
              ) : (
                <div className="space-y-2">
                  {pendingActivity && <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">Choose a trip to review and add “{pendingActivity.title}”.</p>}
                  {trips.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => selectTrip(trip)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedTrip?.id === trip.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      <p className="font-semibold">{trip.title}</p>
                      <p className="text-xs opacity-75">{new Date(trip.tripDate).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Trip Details */}
          <div className="lg:col-span-2">
            {selectedTrip ? (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedTrip.title}</h2>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin size={18} />
                      {selectedTrip.city}
                    </div>
                    <p className="text-sm text-gray-600">{new Date(selectedTrip.tripDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openGoogleCalendar(selectedTrip)}
                      variant="outline"
                      className="gap-2"
                      title="Open itinerary in Google Calendar"
                    >
                      <CalendarPlus size={18} />
                      Google Calendar
                    </Button>
                    <Button
                      onClick={() => downloadICS(selectedTrip)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Download size={18} />
                      Export
                    </Button>
                    <Button
                      onClick={handleDeleteTrip}
                      variant="destructive"
                      size="sm"
                      disabled={deleteTripMutation.isPending}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>

                {selectedTrip.notes && (
                  <p className="text-gray-700 mb-6">{selectedTrip.notes}</p>
                )}

                <TripPlannerActivitySearch onAddEvent={addEventToTrip} isAdding={addItemMutation.isPending} />

                {/* Itinerary Items */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Itinerary</h3>
                    <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <Plus size={16} />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Itinerary Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <Input
                              placeholder="e.g., Visit Magic Kingdom"
                              value={itemTitle}
                              onChange={(e) => setItemTitle(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                              </label>
                              <Input
                                type="date"
                                value={itemDate}
                                onChange={(e) => setItemDate(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time
                              </label>
                              <Input
                                type="time"
                                value={itemTime}
                                onChange={(e) => setItemTime(e.target.value)}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Type
                            </label>
                            <Select value={itemCategory} onValueChange={setItemCategory}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="activity">Activity</SelectItem>
                                <SelectItem value="event">Event</SelectItem>
                                <SelectItem value="venue">Venue</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <Textarea
                              placeholder="Details..."
                              value={itemDescription}
                              onChange={(e) => setItemDescription(e.target.value)}
                              rows={2}
                            />
                          </div>
                          <Button onClick={handleAddItem} disabled={addItemMutation.isPending} className="w-full">
                            {addItemMutation.isPending ? "Adding..." : "Add Item"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {selectedTrip.items && selectedTrip.items.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTrip.items
                        .sort((a: any, b: any) => {
                          const timeA = a.time || selectedTrip.tripDate;
                          const timeB = b.time || selectedTrip.tripDate;
                          return new Date(timeA).getTime() - new Date(timeB).getTime();
                        })
                        .map((item: any) => (
                          <Card key={item.id} className="p-4 bg-blue-50 border-blue-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-gray-900">{item.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {item.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  {item.time && <span>{new Date(item.time).toLocaleDateString()}</span>}
                                  {item.time && (
                                    <div className="flex items-center gap-1">
                                      <Clock size={14} />
                                      {item.time.split("T")[1]?.substring(0, 5)}
                                    </div>
                                  )}
                                </div>
                                {item.location && (
                                  <p className="text-sm text-gray-700 mt-2">{item.location}</p>
                                )}
                                {item.notes && (
                                  <p className="text-sm text-gray-700 mt-1">{item.notes}</p>
                                )}
                                {item.url && (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 underline underline-offset-2">
                                    Official details / book <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={removeItemMutation.isPending}
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">No items yet. Add one to build your itinerary!</p>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-800 text-lg font-semibold">Create or select a trip to start planning</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">Once you choose a trip, enter a ZIP code to find current nearby activities, add them to your itinerary, and open official booking pages.</p>
                <Button className="mt-5 gap-2" onClick={() => setIsCreateTripOpen(true)}><Plus size={16} />Create a trip</Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
