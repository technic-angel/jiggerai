import type { Bottle } from "@/types";
import { BottleCard } from "./BottleCard";

interface BottleGridProps {
  bottles: Bottle[];
}

export function BottleGrid({ bottles }: BottleGridProps) {
  if (bottles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Your bar is empty</p>
        <p className="mt-1 text-sm">Add your first bottle to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {bottles.map((bottle) => (
        <BottleCard key={bottle.id} bottle={bottle} />
      ))}
    </div>
  );
}
