import { cn } from "@/lib/utils";

interface VolumeBarProps {
  volumeEighths: number; // 0–8
  className?: string;
}

export function VolumeBar({ volumeEighths, className }: VolumeBarProps) {
  const capped = Math.max(0, Math.min(8, volumeEighths));

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i < capped ? "bg-teal-400" : "bg-muted/40"
          )}
        />
      ))}
    </div>
  );
}
