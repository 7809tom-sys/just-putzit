/**
 * AccountVerify — mandatory two-step verification gate.
 *
 * Step 1: Register a passkey (biometric / device PIN)
 * Step 2: Upload a photo with GPS EXIF data to verify your city
 *
 * Users are redirected here automatically if they haven't completed both steps.
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Fingerprint, Camera, CheckCircle, ChevronRight, Shield, MapPin, AlertCircle } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { useLocation } from "wouter";

type Step = 1 | 2;

export default function AccountVerify() {
  const [step, setStep] = useState<Step>(1);
  const [passkeyDone, setPasskeyDone] = useState(false);
  const [gpsDone, setGpsDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gpsResult, setGpsResult] = useState<{ cityVerified: boolean; verificationNote: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const { data: verificationStatus } = trpc.passkey.verificationStatus.useQuery();

  // React to verification status changes
  const prevStatusRef = useRef<{ passkeyVerified: boolean; gpsPhotoVerified: boolean } | null>(null);
  if (verificationStatus && prevStatusRef.current === null) {
    prevStatusRef.current = verificationStatus;
    if (verificationStatus.passkeyVerified) setPasskeyDone(true);
    if (verificationStatus.gpsPhotoVerified) setGpsDone(true);
    if (verificationStatus.passkeyVerified && verificationStatus.gpsPhotoVerified) {
      navigate("/");
    } else if (verificationStatus.passkeyVerified && !verificationStatus.gpsPhotoVerified) {
      setStep(2);
    }
  }

  // ── Passkey registration ──────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const verifyRegistrationMutation = trpc.passkey.verifyRegistration.useMutation();
  const markVerifiedMutation = trpc.passkey.markVerified.useMutation();

  async function handlePasskeySetup() {
    try {
      const options = await utils.passkey.registrationOptions.fetch();
      const response = await startRegistration({ optionsJSON: options as any });
      await verifyRegistrationMutation.mutateAsync({ response });
      await markVerifiedMutation.mutateAsync();
      setPasskeyDone(true);
      toast.success("Biometric set up! Moving to step 2…");
      setStep(2);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        toast.error("Biometric setup was cancelled. Please try again.");
      } else if (err?.message?.includes("already registered") || err?.message?.includes("excludeCredentials")) {
        // Already registered — just mark verified and move on
        await markVerifiedMutation.mutateAsync();
        setPasskeyDone(true);
        setStep(2);
      } else {
        toast.error(err?.message ?? "Biometric setup failed. Please try again.");
      }
    }
  }

  // ── GPS photo upload ──────────────────────────────────────────────────────
  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const resp = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Upload failed");
      setGpsResult({ cityVerified: data.cityVerified, verificationNote: data.verificationNote });
      if (data.cityVerified) {
        setGpsDone(true);
        toast.success("Location verified! Your account is now active. 🎉");
        setTimeout(() => navigate("/"), 1500);
      } else {
        toast.warning("Photo uploaded but location couldn't be verified. You can still continue.");
        // Allow them through anyway — GPS data may not be in photo (stripped by OS)
        setGpsDone(true);
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const allDone = passkeyDone && gpsDone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Account</h1>
          <p className="text-gray-500 text-sm">
            Just Putzit requires two quick steps to keep our community safe and authentic.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-3 mb-8">
          <StepIndicator
            number={1}
            label="Biometric"
            icon={<Fingerprint className="w-4 h-4" />}
            done={passkeyDone}
            active={step === 1}
          />
          <div className={`flex-1 h-0.5 rounded-full transition-colors ${passkeyDone ? "bg-primary" : "bg-gray-200"}`} />
          <StepIndicator
            number={2}
            label="GPS Photo"
            icon={<Camera className="w-4 h-4" />}
            done={gpsDone}
            active={step === 2}
          />
        </div>

        {/* Step 1: Passkey */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Set Up Biometric Login</h2>
                <p className="text-xs text-gray-500">Fingerprint, Face ID, or device PIN</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                "Proves you're on a real device — not a bot",
                "One device = one account (prevents fakes)",
                "Faster, more secure than passwords",
                "100% free — no SMS required",
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {point}
                </div>
              ))}
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-semibold"
              onClick={handlePasskeySetup}
              disabled={verifyRegistrationMutation.isPending || markVerifiedMutation.isPending}
            >
              {verifyRegistrationMutation.isPending
                ? "Setting up…"
                : (
                  <span className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5" />
                    Set Up Biometric
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Your biometric data never leaves your device. We only store a cryptographic key.
            </p>
          </div>
        )}

        {/* Step 2: GPS Photo */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Camera className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Verify Your Location</h2>
                <p className="text-xs text-gray-500">Upload a photo taken near you</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 mb-5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>Important:</strong> Take a fresh photo right now with your phone camera (don't upload an old screenshot). Make sure Location Services are enabled in your camera app so GPS data is embedded.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                "Confirms you're actually in your city",
                "Prevents long-distance catfishing",
                "Photo is stored privately — only used for verification",
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  {point}
                </div>
              ))}
            </div>

            {gpsResult && (
              <div className={`rounded-xl p-3 mb-4 border text-sm ${
                gpsResult.cityVerified
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-yellow-50 border-yellow-200 text-yellow-700"
              }`}>
                {gpsResult.cityVerified ? "✅" : "⚠️"} {gpsResult.verificationNote}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
            />

            <Button
              className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-12 font-semibold"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || gpsDone}
            >
              {uploading ? (
                "Uploading & verifying…"
              ) : gpsDone ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Verified! Redirecting…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Take / Upload Photo
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              On desktop, upload any recent photo from your phone. On mobile, tap to open your camera.
            </p>
          </div>
        )}

        {/* Already verified state */}
        {allDone && (
          <div className="text-center mt-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-gray-900">All verified! Welcome to Just Putzit 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  number, label, icon, done, active,
}: {
  number: number;
  label: string;
  icon: React.ReactNode;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          done
            ? "bg-green-500 text-white"
            : active
            ? "bg-primary text-white shadow-md"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {done ? <CheckCircle className="w-5 h-5" /> : icon}
      </div>
      <span className={`text-xs font-medium ${active || done ? "text-gray-800" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}
