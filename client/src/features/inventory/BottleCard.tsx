import type { Bottle } from "@/types";
import { VolumeBar } from "@/components/ui/volume-bar";
import { cn } from "@/lib/utils";

interface BottleCardProps {
  bottle: Bottle;
  className?: string;
}

export function BottleCard({ bottle, className }: BottleCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col items-center rounded-xl border border-border bg-card p-4 transition-colors hover:border-teal-400/40",
        className
      )}
    >
      {/* Bottle image */}
      <div className="flex h-36 w-full items-center justify-center">
        {bottle.imageUrl ? (
          <img
            src={bottle.imageUrl}
            alt={bottle.spiritName}
            className="h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-20 items-center justify-center rounded-lg bg-muted/30 text-2xl font-bold text-muted-foreground">
            {bottle.spiritName
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}
      </div>

      {/* Volume bar */}
      <VolumeBar volumeEighths={bottle.volumeEighths} className="mt-3 w-full" />

      {/* Volume label */}
      <span className="mt-1.5 text-xs text-muted-foreground">
        {bottle.volumeEighths}/8 full
      </span>

      {/* Spirit name */}
      <p className="mt-1 line-clamp-2 text-center text-sm font-medium text-foreground">
        {bottle.spiritName}
      </p>
    </div>
  );
}
