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
import { MapPin, Plus, Trash2, Users, Calendar, Mic, MicOff } from "lucide-react";
import { getFamilyGenderSelectionToast, getFamilyInvalidGenderToast, normalizeFamilyChildGender, type FamilyChildGender } from "@/lib/familySelection";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export default function Family() {
  const [familyName, setFamilyName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childGender, setChildGender] = useState<FamilyChildGender | "">("");
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { isSupported: speechSupported, isListening, error: speechError, startListening, stopListening } = useSpeechRecognition((transcript) => {
    setBio((current) => current ? `${current} ${transcript}` : transcript);
  });

  // Queries
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = trpc.family.getProfile.useQuery();
  const { data: children, isLoading: childrenLoading, refetch: refetchChildren } = trpc.family.getChildren.useQuery();
  const { data: matches, isLoading: matchesLoading } = trpc.family.findMatches.useQuery({});
  const { data: events, isLoading: eventsLoading } = trpc.family.getFamilyEvents.useQuery({
    lat: geoLocation?.lat,
    lng: geoLocation?.lng,
  });

  // Mutations
  const setupMutation = trpc.family.setup.useMutation({
    onSuccess: () => {
      toast.success("Family profile created!");
      setIsSetupOpen(false);
      refetchProfile();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to setup family profile");
    },
  });

  const addChildMutation = trpc.family.addChild.useMutation({
    onSuccess: () => {
      toast.success("Child added!");
      setIsAddChildOpen(false);
      setChildAge("");
      setChildGender("");
      refetchChildren();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add child");
    },
  });

  const removeChildMutation = trpc.family.removeChild.useMutation({
    onSuccess: () => {
      toast.success("Child removed");
      refetchChildren();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove child");
    },
  });

  const connectFamilyMutation = trpc.family.connectFamily.useMutation({
    onSuccess: () => {
      toast.success("Family connected! Check your matches.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to connect");
    },
  });

  // Get user's geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          console.log("Geolocation permission denied");
        }
      );
    }
  }, []);

  // Pre-fill form if profile exists
  useEffect(() => {
    if (profile) {
      setFamilyName(profile.familyName || "");
      setBio(profile.bio || "");
      setCity(profile.neighborhoodCity || "");
      setInterests(profile.interests || []);
    }
  }, [profile]);

  useEffect(() => {
    if (speechError) toast.error(speechError);
  }, [speechError]);

  const handleAddInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleSetupFamily = () => {
    if (!familyName.trim() || !city.trim()) {
      toast.error("Please fill in family name and city");
      return;
    }
    setupMutation.mutate({
      familyName: familyName.trim(),
      bio: bio.trim(),
      neighborhoodCity: city.trim(),
      interests,
    });
  };

  const handleAddChild = () => {
    if (!childAge || parseInt(childAge) < 0 || parseInt(childAge) > 25) {
      toast.error("Please enter a valid child age (0-25)");
      return;
    }
    const gender = normalizeFamilyChildGender(childGender);
    if (!gender) {
      const feedback = getFamilyInvalidGenderToast();
      toast.error(feedback.title, { description: feedback.description });
      return;
    }
    addChildMutation.mutate({
      ageYears: parseInt(childAge),
      gender,
    });
  };

  const renderBioEditor = (rows: number, id: string) => (
    <div>
      <div className="relative">
        <Textarea
          id={id}
          placeholder="Tell other families about yourselves..."
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={rows}
          className="pr-12"
        />
        {speechSupported && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`absolute bottom-2 right-2 h-8 w-8 rounded-full p-0 ${isListening ? "bg-red-100 text-red-600 hover:bg-red-200" : "text-muted-foreground hover:bg-blue-50 hover:text-blue-700"}`}
            onClick={isListening ? stopListening : startListening}
            aria-label={isListening ? "Stop recording family bio" : "Speak your family bio"}
            title={isListening ? "Stop recording" : "Speak your family bio"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {isListening && <p className="mt-1 flex items-center gap-1 text-xs text-red-600"><span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" /> Listening… speak now</p>}
      {!isListening && speechSupported && <p className="mt-1 text-xs text-muted-foreground">Use the microphone to add words, then review the bio before saving.</p>}
      {!speechSupported && <p className="mt-1 text-xs text-muted-foreground">Voice input is unavailable in this browser. You can still type your family bio.</p>}
    </div>
  );

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // If no profile, show setup screen
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Family Network</h1>
            <p className="text-lg text-gray-600">Connect with other families and find kid-friendly activities</p>
          </div>

          <Card className="p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Create Your Family Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Name</label>
                <Input
                  placeholder="e.g., The Johnsons"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood / City</label>
                <Input
                  placeholder="e.g., Shorewood, WI"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Your Family</label>
                {renderBioEditor(4, "family-bio-setup")}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add an interest..."
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddInterest()}
                  />
                  <Button onClick={handleAddInterest} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveInterest(interest)}>
                      {interest} ✕
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSetupFamily}
                disabled={setupMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              >
                {setupMutation.isPending ? "Setting up..." : "Create Family Profile"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Profile exists — show dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{profile.familyName}</h1>
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin size={20} />
            <span>{profile.neighborhoodCity}</span>
          </div>
          {profile.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}
          <div className="flex flex-wrap gap-2 mb-6">
            {profile.interests?.map((interest) => (
              <Badge key={interest} variant="outline">
                {interest}
              </Badge>
            ))}
          </div>

          <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Family Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Family Name</label>
                  <Input
                    placeholder="Family name"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <Input
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  {renderBioEditor(3, "family-bio-edit")}
                </div>
                <Button onClick={handleSetupFamily} disabled={setupMutation.isPending} className="w-full">
                  {setupMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Children Section */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users size={24} />
              Children ({children?.length || 0})
            </h2>
            <Dialog open={isAddChildOpen} onOpenChange={setIsAddChildOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={20} />
                  Add Child
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Child</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
                    <Input
                      type="number"
                      min="0"
                      max="25"
                      placeholder="Age"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <Select
                      value={childGender}
                      onValueChange={(value: string) => {
                        const nextGender = normalizeFamilyChildGender(value);
                        if (!nextGender) return;
                        setChildGender(nextGender);
                        const feedback = getFamilyGenderSelectionToast(nextGender);
                        toast.success(feedback.title, { description: feedback.description });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boy">Boy</SelectItem>
                        <SelectItem value="girl">Girl</SelectItem>
                        <SelectItem value="nonbinary">Non-binary</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddChild} disabled={addChildMutation.isPending} className="w-full">
                    {addChildMutation.isPending ? "Adding..." : "Add Child"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {childrenLoading ? (
            <Spinner />
          ) : children && children.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {children.map((child) => (
                <Card key={child.id} className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{child.ageYears} years old</p>
                      <p className="text-sm text-gray-600 capitalize">{child.gender?.replace("_", " ")}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChildMutation.mutate({ childId: child.id })}
                      disabled={removeChildMutation.isPending}
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No children added yet. Add one to get started!</p>
          )}
        </Card>

        {/* Family Matches */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Other Families</h2>
          {matchesLoading ? (
            <Spinner />
          ) : matches && matches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matches.map((match) => (
                <Card key={match.id} className="p-4 border-2 border-gray-200 hover:border-blue-500 transition">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{match.familyName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin size={16} />
                    {match.neighborhoodCity}
                  </div>
                  {match.bio && <p className="text-sm text-gray-700 mb-3">{match.bio}</p>}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {match.interests?.slice(0, 3).map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    onClick={() => connectFamilyMutation.mutate({ otherFamilyId: match.id })}
                    disabled={connectFamilyMutation.isPending}
                    className="w-full"
                  >
                    Connect
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No other families nearby yet. Check back soon!</p>
          )}
        </Card>

        {/* Kid-Friendly Events */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={24} />
            Kid-Friendly Activities
          </h2>
          {eventsLoading ? (
            <Spinner />
          ) : events && events.length > 0 ? (
            <div className="space-y-4">
              {events.slice(0, 10).map((event) => (
                <Card key={event.id} className="p-4 bg-green-50 border-green-200">
                  <h3 className="font-bold text-gray-900 mb-1">{event.title}</h3>
                  <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                    <Badge variant="outline" className="text-xs">
                      {event.source}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No kid-friendly events found nearby.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
