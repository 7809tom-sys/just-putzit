import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { MessageCircle, Shield, Star, Zap, MapPin, Heart, Camera, Trash2, CheckCircle2, XCircle, ImagePlus, User, Edit2, Gamepad2, ArrowLeft, Sparkles, Brain, Fingerprint, Bookmark, CalendarDays, ExternalLink, Megaphone } from "lucide-react";
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
import { ProfileCompletenessCard } from "@/components/ProfileCompletenessCard";
import { formatProfileBirthday, getProfileAge, parseProfileBirthDate } from "../../../shared/profileBirthDate";
import { startRegistration } from "@simplewebauthn/browser";

export default function Profile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile, isLoading, refetch: refetchProfile } = trpc.profile.get.useQuery();
  const { data: latestLearning } = trpc.profile.latestLearning.useQuery();
  const { data: savedEvents, isLoading: savedEventsLoading } = trpc.activityBoard.savedEvents.useQuery();
  const { data: photos, refetch: refetchPhotos } = trpc.profile.getPhotos.useQuery();
  const { data: verificationStatus } = trpc.passkey.verificationStatus.useQuery();
  const deviceCheckComplete = verificationStatus?.passkeyVerified ?? false;
  const cityCheckComplete = verificationStatus?.gpsPhotoVerified ?? false;
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
  const verifyPasskeyRegistration = trpc.passkey.verifyRegistration.useMutation();
  const markPasskeyVerified = trpc.passkey.markVerified.useMutation({
    onSuccess: () => {
      utils.passkey.verificationStatus.invalidate();
    },
  });

  const handlePasskeyEnrollment = async () => {
    try {
      const options = await utils.passkey.registrationOptions.fetch();
      const response = await startRegistration({ optionsJSON: options as any });
      await verifyPasskeyRegistration.mutateAsync({ response });
      await markPasskeyVerified.mutateAsync();
      toast.success("Device passkey enabled", {
        description: "You can now use your device to help protect this account.",
      });
    } catch (error: any) {
      if (error?.name === "NotAllowedError") {
        toast.message("Device passkey setup was cancelled.");
        return;
      }
      toast.error(error?.message ?? "Device passkey setup could not be completed.");
    }
  };
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
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [friendshipEnabled, setFriendshipEnabled] = useState(false);
  const [datingEnabled, setDatingEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);

  const updateBirthday = trpc.profile.updateIdentity.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      setBirthdayOpen(false);
      toast.success("🎉 Birthday saved!", {
        description: "Your birthday has been updated.",
        duration: 3000,
      });
    },
    onError: (err) => {
      console.error("Birthday save error:", err);
      toast.error("Failed to save birthday: " + (err.message || "Unknown error"));
    },
  });

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
  const updateConnectionPreferences = trpc.profile.updateConnectionPreferences.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      toast.success("Connection settings saved", { description: "Your community, friendship, and dating choices stay private." });
      setConnectionOpen(false);
    },
    onError: (err) => toast.error("Couldn’t save connection settings", { description: err.message }),
  });
  const removeSavedEvent = trpc.activityBoard.toggleBookmark.useMutation({
    onSuccess: (result) => {
      void utils.activityBoard.savedEvents.invalidate();
      void utils.activityBoard.bookmarks.invalidate();
      toast.success(result.bookmarked ? "Event saved" : "Removed from saved events");
    },
    onError: () => toast.error("Couldn’t update saved events. Please try again."),
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
  const connectionPreferences = traits?.connectionPreferences ?? { community: true, friendship: false, dating: false };

  const age = getProfileAge(profileAny?.birthDate);
  const birthdayLabel = formatProfileBirthday(profileAny?.birthDate);

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
    setBirthYear(profileAny?.birthDate ? profileAny.birthDate.split('-')[0] : "");
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
    const monthNum = String(parseInt(birthMonth)).padStart(2, '0');
    const dayNum = String(parseInt(birthDay)).padStart(2, '0');
    const birthDateStr = `${birthYear}-${monthNum}-${dayNum}`;
    if (!parseProfileBirthDate(birthDateStr)) {
      toast.error("Please enter a real calendar date that is not in the future");
      return;
    }
    updateBirthday.mutate({
      birthDate: birthDateStr,
    });
  }

  function openConnectionPreferences() {
    setFriendshipEnabled(connectionPreferences.friendship === true);
    setDatingEnabled(connectionPreferences.dating === true);
    setConnectionOpen(true);
  }

  function saveConnectionPreferences() {
    updateConnectionPreferences.mutate({ friendship: friendshipEnabled, dating: datingEnabled });
  }



  return (
    <div className="min-h-screen gradient-warm">
      <div className="container py-8 max-w-2xl">
        {/* Back navigation */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground rounded-full"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
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
                {deviceCheckComplete && (
                  <Badge className="bg-green-100 text-green-700 border-0 gap-1">
                    <Fingerprint className="w-3 h-3" /> Device passkey verified
                  </Badge>
                )}
                {cityCheckComplete && (
                  <Badge className="bg-sky-100 text-sky-700 border-0 gap-1">
                    <MapPin className="w-3 h-3" /> City check complete
                  </Badge>
                )}
                {!deviceCheckComplete && !cityCheckComplete && (
                  <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 gap-1">
                    <Shield className="w-3 h-3" /> Checks are optional
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
                {birthdayLabel && (
                  <Badge className="rounded-full bg-pink-50 text-pink-700 border-0">
                    🎂 {birthdayLabel}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground rounded-full"
                  onClick={() => {
                    if (parseProfileBirthDate(profileAny?.birthDate)) {
                      const [y, m, d] = profileAny.birthDate.split('-');
                      setBirthYear(y || '');
                      setBirthMonth(String(parseInt(m || '0')));
                      setBirthDay(String(parseInt(d || '0')));
                    } else {
                      setBirthYear('');
                      setBirthMonth('');
                      setBirthDay('');
                    }
                    setBirthdayOpen(true);
                  }}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  {!birthdayLabel ? "Add birthday" : "Edit birthday"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full border-orange-300 bg-orange-50 px-2.5 text-xs text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                  onClick={() => navigate("/shout-out")}
                  aria-label="Invite friends to Just Putzit"
                >
                  <Megaphone className="mr-1 h-3 w-3" /> Invite friends
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

          <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">Connection settings</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Community activities are always on</p>
                <p className="mt-1 text-sm text-muted-foreground">Friendship and dating introductions only happen when both people choose the same option.</p>
              </div>
              <Button type="button" size="sm" variant="outline" className="rounded-full border-teal-200 bg-white" onClick={openConnectionPreferences}><Edit2 className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="rounded-full border-0 bg-teal-100 text-teal-800">🧡 Community</Badge>
              {connectionPreferences.friendship && <Badge className="rounded-full border-0 bg-blue-100 text-blue-800">🤝 Friendship</Badge>}
              {connectionPreferences.dating && <Badge className="rounded-full border-0 bg-rose-100 text-rose-800">💛 Dating</Badge>}
              {!connectionPreferences.friendship && !connectionPreferences.dating && <Badge variant="outline" className="rounded-full border-teal-200 bg-white text-teal-800">Community only</Badge>}
            </div>
          </div>

          <ProfileCompletenessCard
            bio={profile?.bio}
            aiSummary={traits?.aiSummary}
            city={profile?.city}
            interviewCount={profile?.interviewCount}
            onAddBio={openBioEdit}
            onSetLocation={() => navigate("/")}
            onChatWithSally={() => navigate("/interview")}
          />

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

          {/* Latest interview learning indicator */}
          {latestLearning?.latestInterviewAt && (
            <section className="mt-4 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-amber-50/70 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                  <Brain className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="text-sm font-bold text-violet-950">What Sally learned recently</h2>
                    <span className="inline-flex items-center gap-1 text-xs text-violet-700">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      Latest interview
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-violet-800/80">
                    {new Date(latestLearning.latestInterviewAt).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {latestLearning.learnedTraits.length > 0
                      ? " · These are the new details Sally added to your profile."
                      : " · Sally reviewed this chat, but did not add any new profile details."}
                  </p>

                  {latestLearning.learnedTraits.length > 0 && (
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                      {latestLearning.learnedTraits.map((trait, index) => (
                        <div
                          key={trait.key}
                          className={`${trait.status === "learned" ? "sally-new-trait" : ""} rounded-xl border border-violet-100 bg-white/90 px-3 py-2`}
                          style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
                        >
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                            {trait.label}
                            {trait.status === "updated" ? " · Updated" : " · New"}
                          </dt>
                          <dd className="mt-1 flex flex-wrap gap-1.5">
                            {trait.values.map((value) => (
                              <span key={`${trait.key}-${value}`} className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-950">
                                {value}
                              </span>
                            ))}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </div>
            </section>
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
              <Gamepad2 className="w-5 h-5 text-purple-500" /> {traits.wyrInsights?.length > 0 ? "Game Preference Insights" : "Game Insights"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {traits.wyrInsights?.length > 0
                ? "These are direct preference phrases saved from your Would You Rather selections. They are not personality scores, game performance, or a record of your full answers."
                : "Sally learned these things about you from your game play."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {traits.wyrInsights && traits.wyrInsights.length > 0 && (
                <TraitCard label="Would You Rather preferences" value={
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

        <section className="mb-6 rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Bookmark className="h-5 w-5 text-primary" /> Saved events & activities</h2>
              <p className="mt-1 text-sm text-muted-foreground">Only upcoming, recurring, or evergreen plans appear here.</p>
            </div>
            <Button type="button" size="sm" variant="outline" className="shrink-0 rounded-full" onClick={() => navigate("/events")}>Browse</Button>
          </div>
          {savedEventsLoading ? (
            <div className="mt-4 space-y-2"><div className="h-16 animate-pulse rounded-2xl bg-muted/50" /><div className="h-16 animate-pulse rounded-2xl bg-muted/50" /></div>
          ) : savedEvents && savedEvents.length > 0 ? (
            <div className="mt-4 space-y-2.5">
              {savedEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">{event.imageEmoji}</div>
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => navigate(`/events/${event.id}`)}>
                    <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" />{event.isRecurring ? event.recurringSchedule || "Recurring activity" : event.eventDate ? new Date(event.eventDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Available anytime"}</p>
                  </button>
                  <Button type="button" size="icon" variant="ghost" aria-label={`View ${event.title}`} className="h-8 w-8 shrink-0 rounded-full" onClick={() => navigate(`/events/${event.id}`)}><ExternalLink className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${event.title} from saved events`} disabled={removeSavedEvent.isPending} className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive" onClick={() => removeSavedEvent.mutate({ activityId: event.id })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-muted/45 px-4 py-3 text-sm text-muted-foreground">Save an event from its details page to keep the plan handy here.</p>
          )}
        </section>
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

        {/* Account and location checks */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Account & location checks
          </h2>
          <div className="space-y-3">
            <VettingItem icon="✅" label="Profile Created" status="complete" />
            <VettingItem icon="🎤" label="Sally profile refresh" status={profile?.interviewCount ? "complete" : "pending"} desc={`${profile?.interviewCount || 0} session${profile?.interviewCount !== 1 ? "s" : ""} completed`} />
            <VettingItem icon="🔐" label="Device passkey" status={deviceCheckComplete ? "complete" : "pending"} desc={deviceCheckComplete ? "A passkey is set up on this device." : "Optional device security check."} />
            {!deviceCheckComplete && (
              <div className="ml-10 rounded-2xl border border-primary/20 bg-primary/5 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-muted-foreground">Set up a device passkey any time. Your device handles the biometric check; Just Putzit receives only the passkey proof.</p>
                  <Button type="button" size="sm" className="shrink-0 rounded-xl" onClick={handlePasskeyEnrollment} disabled={verifyPasskeyRegistration.isPending || markPasskeyVerified.isPending}>
                    <Fingerprint className="mr-1.5 h-3.5 w-3.5" />
                    {verifyPasskeyRegistration.isPending || markPasskeyVerified.isPending ? "Setting up…" : "Set up passkey"}
                  </Button>
                </div>
              </div>
            )}
            <VettingItem icon="📍" label="City check" status={cityCheckComplete ? "complete" : "pending"} desc={cityCheckComplete ? `Optional city check completed${profile?.city ? ` for ${profile.city}` : ""}.` : "Optional city check is not complete."} />
            <VettingItem icon="📸" label="Photo city check" status={photos && photos.some((p: any) => p.cityVerified) ? "complete" : "pending"} desc={photos && photos.length > 0 ? `${photos.filter((p: any) => p.cityVerified).length}/${photos.length} photos include a city check` : "No photos uploaded"} />
          </div>
        </div>
      </div>

      {/* Connection Preference Dialog */}
      <Dialog open={connectionOpen} onOpenChange={setConnectionOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Your connection settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3"><p className="font-semibold text-teal-900">🧡 Community activities</p><p className="mt-1 text-xs text-teal-800">Always available. Joining an event does not put you in a dating pool.</p></div>
            <button type="button" onClick={() => setFriendshipEnabled((value) => !value)} className={`w-full rounded-2xl border-2 p-4 text-left ${friendshipEnabled ? "border-primary bg-primary/5" : "border-border bg-white"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">🤝 Open to new friendships</p><p className="mt-1 text-sm text-muted-foreground">Allow Sally to introduce public-activity companions.</p></div><span className={`flex h-6 w-6 items-center justify-center rounded-full ${friendshipEnabled ? "bg-primary text-white" : "border border-muted-foreground/40 text-transparent"}`}>✓</span></div></button>
            <button type="button" onClick={() => setDatingEnabled((value) => !value)} className={`w-full rounded-2xl border-2 p-4 text-left ${datingEnabled ? "border-primary bg-primary/5" : "border-border bg-white"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">💛 Open to dating introductions</p><p className="mt-1 text-sm text-muted-foreground">Only match with people who have chosen the same option.</p></div><span className={`flex h-6 w-6 items-center justify-center rounded-full ${datingEnabled ? "bg-primary text-white" : "border border-muted-foreground/40 text-transparent"}`}>✓</span></div></button>
            <p className="px-1 text-xs leading-relaxed text-muted-foreground">These choices are private. You can turn them off any time, and they never affect your access to local events.</p>
            <div className="flex gap-2 pt-1"><Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setConnectionOpen(false)}>Cancel</Button><Button type="button" className="flex-1 rounded-xl gradient-sally text-white" disabled={updateConnectionPreferences.isPending} onClick={saveConnectionPreferences}>{updateConnectionPreferences.isPending ? "Saving…" : "Save settings"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

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
              disabled={updateBirthday.isPending}
            >
              {updateBirthday.isPending ? "Saving..." : "Save Birthday"}
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
