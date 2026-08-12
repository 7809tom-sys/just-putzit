import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { TOAST_STACK_EXPANDED, TOAST_STACK_GAP, TOAST_STACK_POSITION, TOAST_STACK_VISIBLE_COUNT } from "@/lib/toastStack";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={TOAST_STACK_POSITION}
      visibleToasts={TOAST_STACK_VISIBLE_COUNT}
      gap={TOAST_STACK_GAP}
      expand={TOAST_STACK_EXPANDED}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
