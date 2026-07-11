import { useEffect, useRef } from "react";

interface AdSenseSlotProps {
  /** AdSense ad slot ID — get this from your AdSense account after approval */
  slot: string;
  /** Layout style: "in-feed" for between content cards, "display" for banner */
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
  /** Publisher ID — replace with your real ca-pub-XXXXXXXXXXXXXXXX after AdSense approval */
  publisherId?: string;
}

const DEFAULT_PUBLISHER_ID = "ca-pub-XXXXXXXXXXXXXXXX"; // Replace after AdSense approval

/**
 * Google AdSense ad slot component.
 *
 * Usage:
 *   <AdSenseSlot slot="1234567890" format="auto" className="my-4" />
 *
 * After Google AdSense approval:
 *   1. Replace DEFAULT_PUBLISHER_ID with your real ca-pub-XXXXXXXXXXXXXXXX
 *   2. Replace the slot prop values with your real ad unit IDs from AdSense
 *   3. Uncomment the AdSense script in client/index.html
 */
export function AdSenseSlot({
  slot,
  format = "auto",
  className = "",
  publisherId = DEFAULT_PUBLISHER_ID,
}: AdSenseSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      // Push the ad after the component mounts
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
      }
    } catch {
      // AdSense not loaded yet (expected in dev or before approval)
    }
  }, []);

  // In development or before AdSense approval, show a placeholder
  const isDev = publisherId === DEFAULT_PUBLISHER_ID;

  if (isDev) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/30 border border-dashed border-border rounded-xl text-xs text-muted-foreground ${className}`}
        style={{ minHeight: 90 }}
      >
        <span className="px-4 py-2 text-center">
          Ad slot · Replace publisher ID after AdSense approval
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
