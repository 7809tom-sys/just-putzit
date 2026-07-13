import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { MessageCircle, Shield, Star, Zap, MapPin, Heart, Camera, Trash2, CheckCircle2, XCircle, ImagePlus, User, Edit2, Gamepad2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Pencil, Check, X } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile, isLoading, refetch: refetchProfile } = trpc.profile.get.useQuery();
  const { data: photos, refetch: refetchPhotos } = trpc.profile.getPhotos.useQuery();
  const setPrimary = trpc.profile.setPrimaryPhoto.useMutation({
    onSuccess: () => {
      refetchPhotos();
      toast.success("✨ Primary photo updated!", {
        description: "This photo is now your profile picture.",
        duration: 2000,
      });
    },
  });
  const deletePhoto = trpc.profile.deletePhoto.useMutation({
    onSuccess: () => {
      refetchPhotos();
      toast.success("✨ Photo deleted!", {
        description: "The photo has been removed from your profile.",
        duration: 2000,
      });
    },
  });
  const utils = trpc.useUtils();
  const updateIdentity = trpc.profile.updateIdentity.useMutation({
    onSuccess: (data) => {
      utils.profile.get.invalidate();
      utils.profile.getPhotos.invalidate();
      // Show specific success message based on what was saved
      const savedItems = [];
      if (gender) savedItems.push("Gender");
      if (orientation) savedItems.push("Orientation");
      if (birthYear) savedItems.push("Birth year");
      const message = savedItems.length > 0 
        ? `✨ ${savedItems.join(", ")} saved!`
        : "✨ Identity saved!";
      toast.success(message, {
        description: "Your profile has been updated.",
        duration: 3000,
      });
      setIdentityOpen(false);
    },
    onError: (err) => {
      console.error("Identity save error:", err);
      toast.error("Failed to save identity: " + (err.message || "Unknown error"));
    },
  });

  const [uploading, setUploading] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [gender, setGender] = useState<string>("");
  const [orientation, setOrientation] = useState<string>("");
  const [birthMonth, setBirthMonth] = useState<string>("");
  const [birthDay, setBirthDay] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Bio edit state
  const [bioEditOpen, setBioEditOpen] = useState(false);
  const [bioText, setBioText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const updateBio = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      toast.success("✨ Bio saved!", {
        description: "Your bio has been updated.",
        duration: 3000,
      });
      setBioEditOpen(false);
    },
    onError: (err) => toast.error("Failed to save bio: " + err.message),
  });

  function openBioEdit() {
    setBioText(profile?.bio || "");
    setBioEditOpen(true);
  }

  function saveBio() {
    updateBio.mutate({ bio: bioText });
  }

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Try Chrome on Android or Safari on iOS.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setBioText(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
    setIsListening(true);
  }, []);

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  // Stop recognition when dialog closes
  useEffect(() => {
    if (!bioEditOpen) stopListening();
  }, [bioEditOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-sally animate-pulse flex items-center justify-center text-2xl">🤖</div>
      </div>
    );
  }

  const traits = profile?.traits as any;
  const profileAny = profile as any;

  // Compute age from birthdate
  const age = profileAny?.birthdate
    ? Math.floor((Date.now() - new Date(profileAny.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const genderLabel: Record<string, string> = {
    man: "Man", woman: "Woman", non_binary: "Non-binary", other: "Other", prefer_not_to_say: "Prefer not to say",
  };
  const orientationLabel: Record<string, string> = {
    straight: "Straight", gay: "Gay", lesbian: "Lesbian", bisexual: "Bisexual",
    pansexual: "Pansexual", asexual: "Asexual", queer: "Queer", other: "Other", prefer_not_to_say: "Prefer not to say",
  };

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const resp = await fetch("/api/photos/upload", { method: "POST", body: formData });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Upload failed");
      refetchPhotos();
      toast.success(data.verificationNote || "Photo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function openIdentityDialog() {
    setGender(profileAny?.gender || "");
    setOrientation(profileAny?.sexualOrientation || "");
    setBirthYear(profileAny?.birthdate ? String(new Date(profileAny.birthdate).getFullYear()) : "");
    setIdentityOpen(true);
  }

  function saveIdentity() {
    updateIdentity.mutate({
      gender: (gender || undefined) as any,
      sexualOrientation: (orientation || undefined) as any,
    });
  }

  function saveBirthday() {
    if (!birthMonth || !birthDay || !birthYear) {
      toast.error("Please select month, day, and year");
      return;
    }
    const birthdateStr = `${birthYear}-${String(parseInt(birthMonth)).padStart(2, '0')}-${String(parseInt(birthDay)).padStart(2, '0')}`;
    const birthdate = new Date(birthdateStr);
    updateIdentity.mutate({
      birthdate: birthdate.toISOString(),
    });
    setBirthdayOpen(false);
    toast.success("✨ Birthday saved!", {
      description: `Your birthday is now ${new Date(birthdate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
      duration: 3000,
    });
  }



  return (
    <div className="min-h-screen gradient-warm">
      <div className="container py-8 max-w-2xl">
        {/* Profile card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg flex-shrink-0"
              style={{ background: profile?.avatarColor || "#f97316" }}
            >
              {profile?.avatarEmoji || "😊"}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <h1 className="font-display font-bold text-2xl">{profile?.displayName || user?.name}</h1>
                {profile?.isVerified ? (
                  <Badge className="bg-green-100 text-green-700 border-0 gap-1">
                    <Shield className="w-3 h-3" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
                    <Shield className="w-3 h-3" /> Verification pending
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-3">{user?.email}</p>
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <Badge variant="secondary" className="rounded-full capitalize">
                  {profile?.networkType === "singles" ? "💙" : profile?.networkType === "couples" ? "💚" : "🧡"} {profile?.networkType} Network
                </Badge>
                <Badge variant="secondary" className="rounded-full gap-1">
                  <Star className="w-3 h-3" /> {profile?.interviewCount || 0} Sally chats
                </Badge>
                {profile?.city && (
                  <Badge variant="secondary" className="rounded-full gap-1">
                    <MapPin className="w-3 h-3" /> {profile.city}
                  </Badge>
                )}
              </div>

              {/* Identity badges */}
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap mt-2">
                {profileAny?.gender && (
                  <Badge className="rounded-full bg-blue-50 text-blue-700 border-0 gap-1">
                    <User className="w-3 h-3" /> {genderLabel[profileAny.gender] || profileAny.gender}
                  </Badge>
                )}
                {profileAny?.sexualOrientation && (
                  <Badge className="rounded-full bg-purple-50 text-purple-700 border-0 gap-1">
                    🏳️‍🌈 {orientationLabel[profileAny.sexualOrientation] || profileAny.sexualOrientation}
                  </Badge>
                )}
                {age !== null && (
                  <Badge className="rounded-full bg-orange-50 text-orange-700 border-0">
                    {age} years old
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground rounded-full"
                  onClick={openIdentityDialog}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  {(!profileAny?.gender || !profileAny?.sexualOrientation) ? "Add identity info" : "Edit identity"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground rounded-full"
                  onClick={() => setBirthdayOpen(true)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  {!profileAny?.birthdate ? "Add birthday" : "Edit birthday"}
                </Button>
              </div>
            </div>
          </div>

          {/* Bio section */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">About Me</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground rounded-full" onClick={openBioEdit}>
                <Pencil className="w-3 h-3 mr-1" />{profile?.bio ? "Edit" : "Add bio"}
              </Button>
            </div>
            {profile?.bio ? (
              <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Tap "Add bio" to tell people about yourself — or use your voice!</p>
            )}
          </div>

          {/* AI Summary */}
          {traits?.aiSummary && (
            <div className="mt-6 bg-primary/5 rounded-2xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full gradient-sally flex items-center justify-center text-xs">🤖</div>
                <span className="text-xs font-semibold text-primary">Sally's take on you</span>
              </div>
              <p className="text-sm text-foreground italic">"{traits.aiSummary}"</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              className="flex-1 gradient-sally text-white border-0 rounded-xl btn-scale gap-2"
              onClick={() => navigate("/interview")}
            >
              <MessageCircle className="w-4 h-4" /> Chat with Sally
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl gap-2"
              onClick={() => navigate("/matches")}
            >
              <Heart className="w-4 h-4" /> My Matches
            </Button>
          </div>
        </div>

        {/* Photos section */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" /> My Photos
            </h2>
            <Button
              size="sm"
              className="gradient-sally text-white border-0 rounded-full gap-2 btn-scale"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus className="w-4 h-4" />
              {uploading ? "Uploading..." : "Add Photo"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {(!photos || photos.length === 0) ? (
            <div
              className="border-2 border-dashed border-border rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Add your first photo</p>
              <p className="text-xs text-muted-foreground">Photos with GPS data will be verified against your city</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo: any) => (
                <div key={photo.id} className="relative group rounded-2xl overflow-hidden aspect-square bg-muted">
                  <img
                    src={photo.url}
                    alt="Profile photo"
                    className="w-full h-full object-cover"
                  />
                  {/* Primary badge */}
                  {photo.isPrimary && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary text-white border-0 text-xs rounded-full">Primary</Badge>
                    </div>
                  )}
                  {/* City verification badge */}
                  <div className="absolute top-2 right-2">
                    {photo.cityVerified ? (
                      <div title={photo.verificationNote || "City verified"}>
                        <CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow" />
                      </div>
                    ) : photo.exifCity ? (
                      <div title={photo.verificationNote || "City mismatch"}>
                        <XCircle className="w-5 h-5 text-red-400 drop-shadow" />
                      </div>
                    ) : null}
                  </div>
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2">
                    {!photo.isPrimary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs rounded-full h-7 px-3"
                        onClick={() => setPrimary.mutate({ photoId: photo.id })}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs rounded-full h-7 px-2"
                      onClick={() => deletePhoto.mutate({ photoId: photo.id })}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {/* City label */}
                  {photo.exifCity && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                      📍 {photo.exifCity}
                    </div>
                  )}
                </div>
              ))}
              {/* Add more button */}
              <div
                className="aspect-square border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Add photo</span>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3 text-center">
            ✅ = photo GPS matches your city &nbsp;|&nbsp; ❌ = city mismatch &nbsp;|&nbsp; No icon = no GPS data
          </p>
        </div>

        {/* Game Insights */}
        {traits && (traits.wyrInsights?.length > 0 || traits.gameInsights?.length > 0 || traits.triviaStrengths?.length > 0) && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-500" /> Game Insights
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Sally learned these things about you from your game play:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {traits.wyrInsights && traits.wyrInsights.length > 0 && (
                <TraitCard label="Would You Rather" value={
                  <div className="flex flex-wrap gap-1 mt-1">
                    {traits.wyrInsights.map((k: string) => (
                      <Badge key={k} variant="secondary" className="rounded-full text-xs bg-purple-50 text-purple-700">{k}</Badge>
                    ))}
                  </div>
                } />
              )}
              {traits.triviaStrengths && traits.triviaStrengths.length > 0 && (
                <TraitCard label="Trivia Strengths" value={
                  <div className="flex flex-wrap gap-1 mt-1">
                    {traits.triviaStrengths.map((k: string) => (
                      <Badge key={k} variant="secondary" className="rounded-full text-xs bg-blue-50 text-blue-700">{k}</Badge>
                    ))}
                  </div>
                } />
              )}
              {traits.gameInsights && traits.gameInsights.length > 0 && (
                <TraitCard label="Game Personality" value={
                  <div className="flex flex-wrap gap-1 mt-1">
                    {traits.gameInsights.map((k: string) => (
                      <Badge key={k} variant="secondary" className="rounded-full text-xs bg-green-50 text-green-700">{k}</Badge>
                    ))}
                  </div>
                } />
              )}
              {traits.competitiveStyle && (
                <TraitCard label="Play Style" value={traits.competitiveStyle} />
              )}
            </div>
          </div>
        )}
        {/* Traits */}
        {traits && Object.keys(traits).filter(k => k !== "aiSummary").length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Your Personality Insights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {traits.personalityKeywords && (
                <TraitCard label="Personality" value={
                  <div className="flex flex-wrap gap-1 mt-1">
                    {traits.personalityKeywords.map((k: string) => (
                      <Badge key={k} variant="secondary" className="rounded-full text-xs">{k}</Badge>
                    ))}
                  </div>
                } />
              )}
              {traits.hobbies && (
                <TraitCard label="Hobbies" value={
                  <div className="flex flex-wrap gap-1 mt-1">
                    {traits.hobbies.map((h: string) => (
                      <Badge key={h} variant="secondary" className="rounded-full text-xs">{h}</Badge>
                    ))}
                  </div>
                } />
              )}
              {traits.perfectSunday && <TraitCard label="Perfect Sunday" value={traits.perfectSunday} />}
              {traits.idealDate && <TraitCard label="Ideal Date" value={traits.idealDate} />}
              {traits.dreamVacation && <TraitCard label="Dream Vacation" value={traits.dreamVacation} />}
              {traits.favoriteFood && <TraitCard label="Favorite Food" value={traits.favoriteFood} />}
              {traits.morningOrNight && <TraitCard label="Morning or Night?" value={traits.morningOrNight} />}
              {traits.lookingFor && <TraitCard label="Looking For" value={traits.lookingFor} />}
              {traits.funFact && <TraitCard label="Fun Fact" value={traits.funFact} />}
              {traits.guiltPleasure && <TraitCard label="Guilty Pleasure" value={traits.guiltPleasure} />}
            </div>
          </div>
        )}

        {/* Vetting status */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Continuous Vetting Status
          </h2>
          <div className="space-y-3">
            <VettingItem icon="✅" label="Profile Created" status="complete" />
            <VettingItem icon="🎤" label="Dynamic Re-Interview" status={profile?.interviewCount ? "complete" : "pending"} desc={`${profile?.interviewCount || 0} session${profile?.interviewCount !== 1 ? "s" : ""} completed`} />
            <VettingItem icon="🔒" label="Live Background Audit" status="pending" desc="Coming soon" />
            <VettingItem icon="📍" label="GPS Location Verification" status={profile?.latitude ? "complete" : "pending"} desc={profile?.city || "Not set"} />
            <VettingItem icon="📸" label="Photo Verification" status={photos && photos.some((p: any) => p.cityVerified) ? "complete" : "pending"} desc={photos && photos.length > 0 ? `${photos.filter((p: any) => p.cityVerified).length}/${photos.length} photos city-verified` : "No photos uploaded"} />
          </div>
        </div>
      </div>

      {/* Bio Edit Dialog */}
      <Dialog open={bioEditOpen} onOpenChange={setBioEditOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">About Me</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">Write your bio or tap the mic to speak it — your words, not AI.</p>
            <div className="relative">
              <Textarea
                value={bioText}
                onChange={e => setBioText(e.target.value)}
                placeholder="Tell people about yourself, what you enjoy, what you're looking for..."
                className="min-h-[120px] rounded-xl resize-none pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full transition-colors ${
                  isListening ? "bg-red-100 text-red-600 hover:bg-red-200" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
                onClick={isListening ? stopListening : startListening}
                title={isListening ? "Stop recording" : "Speak your bio"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>
            {isListening && (
              <p className="text-xs text-red-500 flex items-center gap-1 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Listening... speak now
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setBioEditOpen(false)}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button
                className="flex-1 gradient-sally text-white border-0 rounded-xl btn-scale"
                onClick={saveBio}
                disabled={updateBio.isPending}
              >
                <Check className="w-4 h-4 mr-1" />{updateBio.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Identity Edit Dialog — uses native <select> for full Android Chrome compatibility */}
      <Dialog open={identityOpen} onOpenChange={setIdentityOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Your Identity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="id-gender">Gender</Label>
              <select
                id="id-gender"
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select gender…</option>
                <option value="man">Man</option>
                <option value="woman">Woman</option>
                <option value="non_binary">Non-binary</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="id-orientation">Sexual Orientation</Label>
              <select
                id="id-orientation"
                value={orientation}
                onChange={e => setOrientation(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select orientation…</option>
                <option value="straight">Straight</option>
                <option value="gay">Gay</option>
                <option value="lesbian">Lesbian</option>
                <option value="bisexual">Bisexual</option>
                <option value="pansexual">Pansexual</option>
                <option value="asexual">Asexual</option>
                <option value="queer">Queer</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <Button
              className="w-full gradient-sally text-white border-0 rounded-xl btn-scale"
              onClick={saveIdentity}
              disabled={updateIdentity.isPending}
            >
              {updateIdentity.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Birthday Dialog */}
      <Dialog open={birthdayOpen} onOpenChange={setBirthdayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Your Birthday</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="bd-month">Month</Label>
                <select
                  id="bd-month"
                  value={birthMonth}
                  onChange={e => setBirthMonth(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Month</option>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                    <option key={i} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bd-day">Day</Label>
                <select
                  id="bd-day"
                  value={birthDay}
                  onChange={e => setBirthDay(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={String(d)}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bd-year">Year</Label>
                <select
                  id="bd-year"
                  value={birthYear}
                  onChange={e => setBirthYear(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Year</option>
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              className="w-full gradient-sally text-white border-0 rounded-xl btn-scale"
              onClick={saveBirthday}
              disabled={updateIdentity.isPending}
            >
              {updateIdentity.isPending ? "Saving..." : "Save Birthday"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TraitCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-muted/30 rounded-xl p-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      {typeof value === "string" ? <p className="text-sm text-foreground">{value}</p> : value}
    </div>
  );
}

function VettingItem({ icon, label, status, desc }: { icon: string; label: string; status: "complete" | "pending"; desc?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Badge className={status === "complete" ? "bg-green-100 text-green-700 border-0" : "bg-muted text-muted-foreground border-0"}>
        {status === "complete" ? "✓ Done" : "Pending"}
      </Badge>
    </div>
  );
}
