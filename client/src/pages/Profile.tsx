import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { MessageCircle, Shield, Star, Zap, MapPin, Heart, Camera, Trash2, CheckCircle2, XCircle, ImagePlus, User, Edit2, Gamepad2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile, isLoading, refetch: refetchProfile } = trpc.profile.get.useQuery();
  const { data: photos, refetch: refetchPhotos } = trpc.profile.getPhotos.useQuery();
  const setPrimary = trpc.profile.setPrimaryPhoto.useMutation({ onSuccess: () => refetchPhotos() });
  const deletePhoto = trpc.profile.deletePhoto.useMutation({ onSuccess: () => refetchPhotos() });
  const utils = trpc.useUtils();
  const updateIdentity = trpc.profile.updateIdentity.useMutation({
    onSuccess: (data) => {
      utils.profile.get.invalidate();
      utils.profile.getPhotos.invalidate();
      toast.success("Identity saved!");
      setIdentityOpen(false);
    },
    onError: (err) => {
      console.error("Identity save error:", err);
      toast.error("Failed to save identity: " + (err.message || "Unknown error"));
    },
  });

  const [uploading, setUploading] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [gender, setGender] = useState<string>("");
  const [orientation, setOrientation] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

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
    const birthdateStr = birthYear ? `${birthYear}-01-01` : undefined;
    updateIdentity.mutate({
      gender: (gender || undefined) as any,
      sexualOrientation: (orientation || undefined) as any,
      birthdate: birthdateStr,
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
                  {(!profileAny?.gender || !profileAny?.sexualOrientation || !profileAny?.birthdate) ? "Add identity info" : "Edit"}
                </Button>
              </div>
            </div>
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

      {/* Identity Edit Dialog */}
      <Dialog open={identityOpen} onOpenChange={setIdentityOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Your Identity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select gender..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="man">Man</SelectItem>
                  <SelectItem value="woman">Woman</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sexual Orientation</Label>
              <Select value={orientation} onValueChange={setOrientation}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select orientation..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight">Straight</SelectItem>
                  <SelectItem value="gay">Gay</SelectItem>
                  <SelectItem value="lesbian">Lesbian</SelectItem>
                  <SelectItem value="bisexual">Bisexual</SelectItem>
                  <SelectItem value="pansexual">Pansexual</SelectItem>
                  <SelectItem value="asexual">Asexual</SelectItem>
                  <SelectItem value="queer">Queer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Birth Year</Label>
              <Select value={birthYear} onValueChange={setBirthYear}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select birth year..." />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {Array.from({ length: 80 }, (_, i) => 2006 - i).map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
