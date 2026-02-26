import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Save, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAddBottle } from "@/hooks/useInventory";

// ─── Category options (mirrors SpiritSelector tiles) ─────────────────────────

const SPIRIT_CATEGORIES = [
  "Bourbon", "Whiskey", "Scotch", "Gin", "Tequila", "Rum",
  "Vodka", "Brandy", "Mezcal", "Liqueur", "Beer", "Wine",
];
const INGREDIENT_CATEGORIES = [
  "Lime Juice", "Lemon Juice", "Simple Syrup", "Bitters",
  "Vermouth", "Soda Water", "Mint", "Orange Peel", "Fruit", "Other",
];
const ALL_CATEGORIES = [...SPIRIT_CATEGORIES, ...INGREDIENT_CATEGORIES];

// ─── Form field component ─────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400/30 disabled:opacity-50";

// ─── Main view ────────────────────────────────────────────────────────────────

interface BottleFormState {
  spiritName: string;
  category: string;
  volumeEighths: number;
  unopenedCount: number;
  purchasePrice: string;
  notes: string;
}

const INITIAL: BottleFormState = {
  spiritName: "",
  category: "",
  volumeEighths: 8,
  unopenedCount: 0,
  purchasePrice: "",
  notes: "",
};

export function AddBottleView() {
  const navigate = useNavigate();
  const [form, setForm] = useState<BottleFormState>(INITIAL);
  const [isLooking, setIsLooking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [error, setError] = useState("");
  const addBottle = useAddBottle();

  function set<K extends keyof BottleFormState>(key: K, value: BottleFormState[K]) {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Simulate AI lookup — Phase B: POST /api/ai/lookup-spirit */
  async function handleAILookup() {
    if (!form.spiritName.trim()) {
      setError("Enter a spirit name first.");
      return;
    }
    setError("");
    setIsLooking(true);
    await new Promise((r) => setTimeout(r, 1400));
    // Mock AI fill-in based on name keywords
    const name = form.spiritName.toLowerCase();
    const guessedCategory =
      name.includes("bourbon") || name.includes("maker") || name.includes("buffalo")
        ? "Bourbon"
        : name.includes("scotch") || name.includes("glen") || name.includes("johnnie")
        ? "Scotch"
        : name.includes("gin") || name.includes("hendrick") || name.includes("tanqueray")
        ? "Gin"
        : name.includes("tequila") || name.includes("patron") || name.includes("casamigos")
        ? "Tequila"
        : name.includes("rum") || name.includes("bacardi") || name.includes("mount gay")
        ? "Rum"
        : name.includes("vodka") || name.includes("grey goose") || name.includes("ketel")
        ? "Vodka"
        : name.includes("mezcal") || name.includes("del maguey")
        ? "Mezcal"
        : name.includes("limoncello") || name.includes("cointreau") || name.includes("campari")
        ? "Liqueur"
        : name.includes("beer") || name.includes("lager") || name.includes("ale")
        ? "Beer"
        : name.includes("wine") || name.includes("pinot") || name.includes("chardonnay")
        ? "Wine"
        : "Whiskey";

    setForm((f) => ({
      ...f,
      category: f.category || guessedCategory,
      notes:
        f.notes ||
        `A well-regarded ${guessedCategory.toLowerCase()} — ask the AI assistant for full tasting notes.`,
    }));
    setIsLooking(false);
  }

  function validate(): boolean {
    if (!form.spiritName.trim()) { setError("Spirit name is required."); return false; }
    if (!form.category) { setError("Category is required."); return false; }
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    setError("");
    addBottle.mutate(
      {
        spiritName: form.spiritName.trim(),
        category: form.category,
        volumeEighths: form.volumeEighths,
        unopenedCount: form.unopenedCount,
        purchasePrice: form.purchasePrice || null,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setIsEditing(false);
          setTimeout(() => navigate("/my-bar"), 800);
        },
        onError: () => setError("Failed to save. Is the server running?"),
      }
    );
  }

  function handleEdit() {
    setSaved(false);
    setIsEditing(true);
  }

  const disabled = !isEditing;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/my-bar")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to My Bar
        </Button>
        <div className="flex items-center gap-2">
          {saved && !isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={disabled || addBottle.isPending}
            size="sm"
            className="gap-2 bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40"
          >
            {addBottle.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? "Saved" : addBottle.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Item to My Bar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track any bottle, ingredient, or mixer in your home bar.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {saved && (
        <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300">
          ✓ Item saved to your bar! Redirecting…
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-5">
        {/* Spirit name + AI lookup */}
        <Field label="Spirit / Item Name" required>
          <div className="flex gap-2">
            <input
              className={cn(inputCls, "flex-1")}
              placeholder="e.g. Hendrick's Gin, Agave Syrup…"
              value={form.spiritName}
              onChange={(e) => set("spiritName", e.target.value)}
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAILookup}
              disabled={disabled || isLooking || !form.spiritName.trim()}
              className="shrink-0 gap-2 border-teal-400/40 text-teal-300 hover:border-teal-400 hover:bg-teal-400/10"
              title="Let AI auto-fill the details"
            >
              {isLooking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {isLooking ? "Looking…" : "AI Lookup"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter a name and click <strong>AI Lookup</strong> to auto-fill category and notes.
          </p>
        </Field>

        {/* Category */}
        <Field label="Category" required>
          <select
            className={cn(inputCls, "cursor-pointer")}
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            disabled={disabled}
          >
            <option value="">Select a category…</option>
            <optgroup label="Spirits">
              {SPIRIT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="Ingredients / Mixers">
              {INGREDIENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
          </select>
        </Field>

        {/* Volume */}
        <Field label="Current Volume" hint={`${form.volumeEighths}/8 of the bottle remaining`}>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={form.volumeEighths}
              onChange={(e) => set("volumeEighths", Number(e.target.value))}
              disabled={disabled}
              className="flex-1 accent-teal-400"
            />
            <span className="w-12 shrink-0 rounded-lg border border-border bg-background px-2 py-1 text-center text-sm font-medium text-foreground">
              {form.volumeEighths}/8
            </span>
          </div>
          {/* Visual eighths */}
          <div className="flex gap-1 mt-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full",
                  i < form.volumeEighths ? "bg-teal-400" : "bg-muted"
                )}
              />
            ))}
          </div>
        </Field>

        {/* Unopened bottles */}
        <Field label="Unopened Bottles" hint="How many sealed bottles do you have in addition to the open one?">
          <input
            type="number"
            min={0}
            max={99}
            className={cn(inputCls, "w-32")}
            value={form.unopenedCount}
            onChange={(e) => set("unopenedCount", Math.max(0, Number(e.target.value)))}
            disabled={disabled}
          />
        </Field>

        {/* Purchase Price */}
        <Field label="Purchase Price" hint="Optional — used for bar cost tracking">
          <div className="relative w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <input
              type="text"
              className={cn(inputCls, "pl-7")}
              placeholder="0.00"
              value={form.purchasePrice}
              onChange={(e) => set("purchasePrice", e.target.value)}
              disabled={disabled}
            />
          </div>
        </Field>

        {/* Notes */}
        <Field label="Notes" hint="Tasting notes, where you bought it, gift from a friend, etc.">
          <textarea
            rows={3}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400/30 resize-none disabled:opacity-50"
            placeholder="e.g. Floral, citrusy gin with a hint of cucumber…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            disabled={disabled}
          />
        </Field>
      </div>

      {/* Footer actions */}
      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => navigate("/my-bar")}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={disabled || addBottle.isPending}
          className="gap-2 bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40"
        >
          {addBottle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {addBottle.isPending ? "Saving…" : "Save to My Bar"}
        </Button>
      </div>
    </div>
  );
}
