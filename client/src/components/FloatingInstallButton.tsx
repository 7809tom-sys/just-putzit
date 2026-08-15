import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

/**
 * Floating PWA install button — appears in the bottom-right corner on all pages.
 * On Android Chrome: triggers the native beforeinstallprompt for one-tap install.
 * On other browsers: shows a small tooltip with manual install instructions.
 * Disappears once the app is installed or the user dismisses it.
 */
export function FloatingInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed
    const dismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Listen for the install prompt (Android Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Small delay so it doesn't pop up immediately on page load
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // For non-Chrome browsers, show after a delay anyway (manual instructions)
    const timer = setTimeout(() => {
      if (!installPrompt) {
        setIsVisible(true);
      }
    }, 5000);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsVisible(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setIsVisible(false);
      }
      setInstallPrompt(null);
    } else {
      // No native prompt — show manual instructions tooltip
      setShowTooltip((v) => !v);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setIsVisible(false);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  };

  if (isInstalled || isDismissed || !isVisible) return null;

  // Detect iOS Safari
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-2 z-50 flex flex-col items-end gap-2 sm:hidden"
      style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.18))" }}
    >
      {/* Tooltip for manual install */}
      {showTooltip && (
        <div className="bg-popover text-popover-foreground rounded-2xl p-4 max-w-[220px] text-sm shadow-xl border border-border animate-in slide-in-from-bottom-2">
          <p className="font-semibold mb-2 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-primary" />
            Install Just Putzit
          </p>
          {isIOS ? (
            <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
              <li>Open in <strong>Safari</strong></li>
              <li>Tap the <strong>Share</strong> button ↑</li>
              <li>Tap <strong>"Add to Home Screen"</strong></li>
            </ol>
          ) : (
            <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
              <li>Open in <strong>Chrome</strong></li>
              <li>Tap the <strong>⋮ menu</strong></li>
              <li>Tap <strong>"Add to Home screen"</strong></li>
            </ol>
          )}
        </div>
      )}

      {/* Floating button */}
      <div className="relative flex items-center gap-2">
        {/* Dismiss control is available on larger screens; on mobile the compact
            install icon stays out of the event-action row. */}
        <button
          onClick={handleDismiss}
          className="hidden h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground sm:flex"
          aria-label="Dismiss install prompt"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Main install button */}
        <button
          onClick={handleInstall}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3 sm:text-sm sm:font-semibold"
          aria-label="Install Just Putzit app"
          title="Install Just Putzit app"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      </div>
    </div>
  );
}
