import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Camera, CheckCircle2, XCircle, MapPin, Shield, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// EXIF GPS extraction using exifr (loaded dynamically to keep bundle lean)
async function extractExifGps(file: File): Promise<{ lat: number; lng: number; timestamp?: number } | null> {
  try {
    // Dynamic import — exifr is installed as a dep
    const exifr = await import("exifr");
    const result = await exifr.default.gps(file);
    if (!result || result.latitude == null || result.longitude == null) return null;
    // Also try to get the photo timestamp
    const full = await exifr.default.parse(file, ["DateTimeOriginal", "CreateDate"]);
    let timestamp: number | undefined;
    if (full?.DateTimeOriginal) {
      timestamp = new Date(full.DateTimeOriginal).getTime();
    }
    return { lat: result.latitude, lng: result.longitude, timestamp };
  } catch {
    return null;
  }
}

type VerifyState = "idle" | "capturing" | "preview" | "checking" | "verified" | "failed" | "no_gps";

export default function Verify() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [state, setState] = useState<VerifyState>("idle");
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{ verified: boolean; distanceKm: number; cityLabel: string } | null>(null);
  const [claimedCity, setClaimedCity] = useState("milwaukee");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: verifyStatus } = trpc.verification.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const checkGpsMutation = trpc.verification.checkGps.useMutation({
    onSuccess: (data) => {
      setResultData(data);
      setState(data.verified ? "verified" : "failed");
      if (data.verified) {
        toast.success(`Location verified! You're in ${data.cityLabel}.`);
      } else {
        toast.error(`Location check failed — you appear to be ${data.distanceKm}km from ${data.cityLabel}.`);
      }
    },
    onError: () => {
      setState("failed");
      toast.error("Verification failed. Please try again.");
    },
  });

  useEffect(() => {
    return () => {
      // Clean up camera stream on unmount
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const startCamera = useCallback(async () => {
    setState("capturing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      toast.error("Camera access denied. Please allow camera access and try again.");
      setState("idle");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Stop stream
    streamRef.current?.getTracks().forEach(t => t.stop());

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `verify_${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setCapturedFile(file);
      setPreviewUrl(url);
      setState("preview");
    }, "image/jpeg", 0.92);
  }, []);

  const runVerification = useCallback(async () => {
    if (!capturedFile) return;
    setState("checking");

    // Try EXIF GPS first
    const gps = await extractExifGps(capturedFile);

    if (gps) {
      // We have GPS from EXIF — send to server for radius check
      checkGpsMutation.mutate({
        lat: gps.lat,
        lng: gps.lng,
        claimedCity,
        photoTimestamp: gps.timestamp,
      });
    } else {
      // No EXIF GPS — fall back to browser Geolocation API
      if (!navigator.geolocation) {
        setState("no_gps");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          checkGpsMutation.mutate({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            claimedCity,
            // No photo timestamp when using browser geo
          });
        },
        () => {
          setState("no_gps");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [capturedFile, claimedCity, checkGpsMutation]);

  const reset = useCallback(() => {
    setState("idle");
    setCapturedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResultData(null);
  }, [previewUrl]);

  if (loading) return null;

  // Already verified
  if (verifyStatus?.locationVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-green-500/30">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-display font-bold">Already Verified!</h2>
            <p className="text-muted-foreground">
              Your location in <strong>{verifyStatus.gpsVerifiedCity}</strong> has been confirmed.
              You have the Location Verified badge on your profile.
            </p>
            <Button className="gradient-sally text-white" onClick={() => navigate("/profile")}>
              View my profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-orange-950/10">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 mx-auto flex items-center justify-center">
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-display font-bold">Location Verification</h1>
          <p className="text-muted-foreground text-sm">
            Prove you're really in Milwaukee/Waukesha — not a remote fake.
          </p>
        </div>

        {/* How it works */}
        {state === "idle" && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">How it works</CardTitle>
              <CardDescription>Takes about 30 seconds. Free. No data stored.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <p>Take a live selfie using your phone camera right now.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <p>Your phone embeds GPS coordinates in the photo automatically.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <p>We check the GPS against Milwaukee/Waukesha. If you're here, you're verified.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                <p className="text-muted-foreground">The photo is <strong>not stored</strong> — only your pass/fail result and approximate city are saved.</p>
              </div>

              <div className="pt-2 space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your city</label>
                <div className="flex gap-2">
                  {[
                    { value: "milwaukee", label: "Milwaukee" },
                    { value: "waukesha", label: "Waukesha / Carroll" },
                  ].map(c => (
                    <button
                      key={c.value}
                      onClick={() => setClaimedCity(c.value)}
                      className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                        claimedCity === c.value
                          ? "border-orange-500 bg-orange-500/10 text-orange-500"
                          : "border-border text-muted-foreground hover:border-orange-500/50"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full gradient-sally text-white font-semibold mt-2" onClick={startCamera}>
                <Camera className="w-4 h-4 mr-2" />
                Take verification selfie
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Camera */}
        {state === "capturing" && (
          <Card className="border-orange-500/30 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative bg-black aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-60 rounded-full border-2 border-orange-400/60 border-dashed" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-sm text-center mb-3">Center your face in the oval</p>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    onClick={capturePhoto}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take photo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {state === "preview" && previewUrl && (
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black">
                <img src={previewUrl} alt="Verification selfie" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Looks good? We'll check the GPS location embedded in this photo.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={reset}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                  <Button className="flex-1 gradient-sally text-white font-semibold" onClick={runVerification}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Verify location
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checking */}
        {state === "checking" && (
          <Card className="border-border/50">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 mx-auto flex items-center justify-center animate-pulse">
                <MapPin className="w-8 h-8 text-orange-500" />
              </div>
              <p className="font-medium">Checking your location...</p>
              <p className="text-sm text-muted-foreground">Reading GPS coordinates from your photo.</p>
            </CardContent>
          </Card>
        )}

        {/* Verified */}
        {state === "verified" && resultData && (
          <Card className="border-green-500/30">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-500/10 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-green-500">Location Verified!</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  You're confirmed in <strong>{resultData.cityLabel}</strong> ({resultData.distanceKm}km from city center).
                </p>
              </div>
              <Badge className="bg-green-500/10 text-green-500 border-green-500/30 px-3 py-1">
                <Shield className="w-3 h-3 mr-1" />
                Location Verified Badge Earned
              </Badge>
              <Button className="w-full gradient-sally text-white font-semibold" onClick={() => navigate("/profile")}>
                View my profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Failed */}
        {state === "failed" && resultData && (
          <Card className="border-destructive/30">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">Location Mismatch</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Your photo GPS shows you're <strong>{resultData.distanceKm}km</strong> from {resultData.cityLabel}.
                  Just Putzit is for people who are actually here.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={reset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No GPS */}
        {state === "no_gps" && (
          <Card className="border-yellow-500/30">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">GPS Not Found</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Your photo doesn't have GPS data, and location access was denied.
                  Make sure your phone's location services are on, then try again.
                </p>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 text-left space-y-1">
                <p className="font-medium">Tips to fix this:</p>
                <p>• iPhone: Settings → Privacy → Location Services → turn on</p>
                <p>• Android: Settings → Location → turn on</p>
                <p>• Make sure your camera app has location permission</p>
              </div>
              <Button variant="outline" className="w-full" onClick={reset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
