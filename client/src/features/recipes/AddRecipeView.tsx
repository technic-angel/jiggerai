import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Save, Pencil, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RECIPE_BASE_SPIRITS, RECIPE_CATEGORIES } from "./recipeSeed";

// ─── Form field ───────────────────────────────────────────────────────────────

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

// ─── Main form state ──────────────────────────────────────────────────────────

interface RecipeFormState {
  name: string;
  category: string;
  baseSpirit: string;
  abv: string;
  glassType: string;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: string[];
  instructions: string;
  youtubeUrl: string;
  imageUrl: string;
  notes: string;
}

const INITIAL: RecipeFormState = {
  name: "",
  category: "",
  baseSpirit: "",
  abv: "",
  glassType: "",
  difficulty: "Easy",
  ingredients: [""],
  instructions: "",
  youtubeUrl: "",
  imageUrl: "",
  notes: "",
};

const GLASS_TYPES = ["Rocks", "Coupe", "Highball", "Collins", "Martini", "Julep Cup", "Copper Mug", "Nick & Nora", "Flute", "Snifter", "Other"];

export function AddRecipeView() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RecipeFormState>(INITIAL);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof RecipeFormState>(key: K, value: RecipeFormState[K]) {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── Ingredients list management ──────────────────────────────────────────────

  function setIngredient(index: number, value: string) {
    const next = [...form.ingredients];
    next[index] = value;
    setForm((f) => ({ ...f, ingredients: next }));
  }

  function addIngredient() {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, ""] }));
  }

  function removeIngredient(index: number) {
    const next = form.ingredients.filter((_, i) => i !== index);
    setForm((f) => ({ ...f, ingredients: next.length > 0 ? next : [""] }));
  }

  // ── AI autocomplete ──────────────────────────────────────────────────────────

  async function handleAutocomplete() {
    if (!form.name.trim()) return;
    setError("");
    setIsAutocompleting(true);
    await new Promise((r) => setTimeout(r, 1600));

    const name = form.name.toLowerCase();
    // Mock completions — Phase B: POST /api/ai/autocomplete-recipe
    const mock: Partial<RecipeFormState> = name.includes("old fashioned")
      ? {
          category: "Stirred", baseSpirit: "Whiskey", abv: "32%",
          glassType: "Rocks", difficulty: "Easy",
          ingredients: ["2 oz Bourbon", "2 dashes Angostura Bitters", "1 tsp Simple Syrup", "Orange peel"],
          instructions: "Add bitters and simple syrup to a rocks glass. Add ice and bourbon. Stir gently. Express orange peel over glass and drop in.",
        }
      : name.includes("margarita")
      ? {
          category: "Shaken", baseSpirit: "Tequila", abv: "18%",
          glassType: "Rocks", difficulty: "Easy",
          ingredients: ["2 oz Tequila", "1 oz Lime Juice", "0.75 oz Triple Sec", "Salt rim"],
          instructions: "Shake tequila, lime, and triple sec with ice. Strain into a salt-rimmed rocks glass over ice.",
        }
      : name.includes("negroni")
      ? {
          category: "Stirred", baseSpirit: "Gin", abv: "24%",
          glassType: "Rocks", difficulty: "Easy",
          ingredients: ["1 oz Gin", "1 oz Sweet Vermouth", "1 oz Campari", "Orange peel"],
          instructions: "Combine gin, vermouth, and Campari in a mixing glass with ice. Stir 30 sec. Strain over ice. Garnish with orange peel.",
        }
      : {
          notes: `Ask the AI assistant for the full ${form.name} recipe by clicking the chat icon!`,
        };

    setForm((f) => ({ ...f, ...mock }));
    setIsAutocompleting(false);
  }

  // ── Save / Edit ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    if (!form.name.trim()) { setError("Recipe name is required."); return false; }
    if (!form.baseSpirit) { setError("Base spirit is required."); return false; }
    if (!form.category) { setError("Style / category is required."); return false; }
    if (form.ingredients.every((i) => !i.trim())) { setError("Add at least one ingredient."); return false; }
    if (!form.instructions.trim()) { setError("Instructions are required."); return false; }
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    setError("");
    // Phase B: POST /api/recipes
    setSaved(true);
    setIsEditing(false);
  }

  const disabled = !isEditing;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/recipes")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Recipes
        </Button>
        <div className="flex items-center gap-2">
          {saved && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => { setSaved(false); setIsEditing(true); }} className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          <Button onClick={handleSave} disabled={disabled} size="sm" className="gap-2 bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40">
            <Save className="h-3.5 w-3.5" />
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Recipe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new cocktail recipe in your collection.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {saved && (
        <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300">
          ✓ Recipe saved! (Phase B: syncs to database)
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-5">
        {/* Recipe name + autocomplete */}
        <Field label="Recipe Name" required>
          <div className="flex gap-2">
            <input
              ref={nameRef}
              className={cn(inputCls, "flex-1")}
              placeholder="e.g. Old Fashioned, Penicillin…"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutocomplete}
              disabled={disabled || isAutocompleting || !form.name.trim()}
              className="shrink-0 gap-2 border-teal-400/40 text-teal-300 hover:border-teal-400 hover:bg-teal-400/10"
            >
              {isAutocompleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isAutocompleting ? "Filling…" : "Autocomplete"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Type a cocktail name and click <strong>Autocomplete</strong> to let AI fill in the details.
          </p>
        </Field>

        {/* Base spirit + Category row */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Base Spirit" required>
            <select className={cn(inputCls, "cursor-pointer")} value={form.baseSpirit} onChange={(e) => setField("baseSpirit", e.target.value)} disabled={disabled}>
              <option value="">Select…</option>
              {RECIPE_BASE_SPIRITS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Style / Category" required>
            <select className={cn(inputCls, "cursor-pointer")} value={form.category} onChange={(e) => setField("category", e.target.value)} disabled={disabled}>
              <option value="">Select…</option>
              {RECIPE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        {/* ABV + Glass + Difficulty row */}
        <div className="grid grid-cols-3 gap-4">
          <Field label="ABV">
            <input className={inputCls} placeholder="e.g. 18%" value={form.abv} onChange={(e) => setField("abv", e.target.value)} disabled={disabled} />
          </Field>
          <Field label="Glass Type">
            <select className={cn(inputCls, "cursor-pointer")} value={form.glassType} onChange={(e) => setField("glassType", e.target.value)} disabled={disabled}>
              <option value="">Select…</option>
              {GLASS_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Difficulty">
            <select className={cn(inputCls, "cursor-pointer")} value={form.difficulty} onChange={(e) => setField("difficulty", e.target.value as RecipeFormState["difficulty"])} disabled={disabled}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </Field>
        </div>

        {/* Ingredients */}
        <Field label="Ingredients" required hint="One ingredient per line with measures (e.g. '2 oz Gin')">
          <div className="flex flex-col gap-2">
            {form.ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={cn(inputCls, "flex-1")}
                  placeholder={`Ingredient ${i + 1}…`}
                  value={ing}
                  onChange={(e) => setIngredient(i, e.target.value)}
                  disabled={disabled}
                />
                {form.ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(i)} disabled={disabled} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-red-400/40 hover:text-red-400 disabled:opacity-40">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {!disabled && (
              <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="self-start gap-2 text-teal-300 border-teal-400/40 hover:border-teal-400 hover:bg-teal-400/10">
                <Plus className="h-3.5 w-3.5" />
                Add ingredient
              </Button>
            )}
          </div>
        </Field>

        {/* Instructions */}
        <Field label="Instructions" required hint="Write the full recipe steps. Separate steps with a period.">
          <textarea
            rows={5}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400/30 resize-y disabled:opacity-50"
            placeholder="1. Combine all ingredients... 2. Shake with ice..."
            value={form.instructions}
            onChange={(e) => setField("instructions", e.target.value)}
            disabled={disabled}
          />
        </Field>

        {/* Optional: YouTube + Image */}
        <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <Field label="YouTube URL" hint="Optional — video tutorial link">
            <input
              className={inputCls}
              placeholder="https://youtube.com/watch?v=…"
              value={form.youtubeUrl}
              onChange={(e) => setField("youtubeUrl", e.target.value)}
              disabled={disabled}
            />
          </Field>
          <Field label="Image URL" hint="Optional — photo of the cocktail">
            <input
              className={inputCls}
              placeholder="https://…"
              value={form.imageUrl}
              onChange={(e) => setField("imageUrl", e.target.value)}
              disabled={disabled}
            />
          </Field>
        </div>

        {/* Notes */}
        <Field label="Notes" hint="Personal notes, sourcing info, tips, etc.">
          <textarea
            rows={2}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400/30 resize-none disabled:opacity-50"
            placeholder="e.g. My grandma's twist on a classic…"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            disabled={disabled}
          />
        </Field>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => navigate("/recipes")}>Cancel</Button>
        <Button onClick={handleSave} disabled={disabled} className="gap-2 bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40">
          <Save className="h-4 w-4" />
          Save Recipe
        </Button>
      </div>
    </div>
  );
}
