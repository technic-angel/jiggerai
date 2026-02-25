import { X, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  agentName: string;
  onClose: () => void;
}

export function ChatHeader({ agentName, onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20">
          <img src="/jigger-logo.svg" alt="" className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          {agentName}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
