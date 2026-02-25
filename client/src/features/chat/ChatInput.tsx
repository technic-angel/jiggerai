import { useState, useRef, type KeyboardEvent } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed && attachedFiles.length === 0) return;
    onSend(trimmed, attachedFiles.length > 0 ? attachedFiles : undefined);
    setValue("");
    setAttachedFiles([]);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setAttachedFiles((prev) => [...prev, ...files]);
    // Reset input so the same file can be reattached if removed
    e.target.value = "";
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col border-t border-border bg-card">
      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pt-2">
          {attachedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground"
            >
              <Paperclip className="h-3 w-3 shrink-0" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                onClick={() => removeFile(i)}
                className="ml-0.5 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          aria-label="Attach files"
        />

        {/* Attach button */}
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Send message..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSend}
          disabled={disabled || (!value.trim() && attachedFiles.length === 0)}
          className="h-9 w-9 shrink-0 text-teal-400 hover:bg-teal-400/10 hover:text-teal-300 disabled:opacity-30"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
