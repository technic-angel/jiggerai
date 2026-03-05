import { useCallback, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { useUIStore } from "@/store/uiStore";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "@/features/chat/ChatPanel";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const CHAT_MIN_WIDTH = 280;
const CHAT_DEFAULT_WIDTH = 320;

export function AppShell() {
  const isChatOpen = useUIStore((s) => s.isChatOpen);
  const toggleChat = useUIStore((s) => s.toggleChat);

  const [chatWidth, setChatWidth] = useState(CHAT_DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(CHAT_DEFAULT_WIDTH);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = chatWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(ev: MouseEvent) {
      /* v8 ignore next */
      if (!isDragging.current) return;
      const delta = startX.current - ev.clientX; // dragging left = wider chat
      const maxWidth = window.innerWidth * 0.5;
      const next = Math.min(
        maxWidth,
        Math.max(CHAT_MIN_WIDTH, startWidth.current + delta)
      );
      setChatWidth(next);
    }

    function onMouseUp() {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [chatWidth]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />

      {/* Main scrollable content area — renders the matched route */}
      <ScrollArea className="flex-1">
        <main className="p-8">
          <Outlet />
        </main>
      </ScrollArea>

      {/* Chat panel — right column with drag handle */}
      {isChatOpen && (
        <div className="relative flex shrink-0" style={{ width: chatWidth }}>
          {/* Drag handle */}
          <div
            onMouseDown={onMouseDown}
            className="absolute left-0 top-0 z-10 h-full w-1 cursor-col-resize bg-border hover:bg-teal-500/60 active:bg-teal-500 transition-colors"
            title="Drag to resize"
          />
          <ChatPanel width={chatWidth} />
        </div>
      )}

      {/* Floating toggle — shown only when chat is closed */}
      {!isChatOpen && (
        <Button
          onClick={toggleChat}
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-teal-500 text-white shadow-lg hover:bg-teal-600"
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
