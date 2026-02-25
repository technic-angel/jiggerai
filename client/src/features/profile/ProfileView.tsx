import { useState } from "react";
import { Pencil, Save, X, Camera, Wine, Star, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  displayName: string;
  username: string;
  email: string;              // read-only
  bio: string;
  location: string;
  favoriteSpirit: string;
  barType: string;
  experienceLevel: string;
  notifications: boolean;
  publicProfile: boolean;
}

const INITIAL_PROFILE: ProfileData = {
  displayName: "Melissa",
  username: "melissa_mixes",
  email: "melissa@example.com",
  bio: "Home bartender and cocktail enthusiast. Always experimenting with new flavors.",
  location: "San Francisco, CA",
  favoriteSpirit: "Gin",
  barType: "Home Bar",
  experienceLevel: "Intermediate",
  notifications: true,
  publicProfile: false,
};

const SPIRIT_OPTIONS = [
  "Gin", "Bourbon", "Scotch", "Whiskey", "Tequila", "Rum",
  "Vodka", "Mezcal", "Brandy", "Liqueur", "No preference",
];

const BAR_TYPES = [
  "Home Bar", "Professional Bar", "Pop-up Bar", "Just Getting Started",
];

const EXPERIENCE_LEVELS = [
  "Beginner", "Intermediate", "Advanced", "Professional",
];

// ─── Field components ─────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
  hint?: string;
  readonly?: boolean;
  type?: string;
}

function InputField({ label, value, onChange, disabled, placeholder, hint, readonly, type = "text" }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || readonly}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-lg border px-3 text-sm transition-colors",
          "placeholder:text-muted-foreground focus:outline-none",
          readonly
            ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
            : disabled
            ? "border-border bg-card text-foreground opacity-50"
            : "border-border bg-card text-foreground focus:border-teal-400/60 focus:ring-1 focus:ring-teal-400/30"
        )}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  options: string[];
}

function SelectField({ label, value, onChange, disabled, options }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "h-10 w-full cursor-pointer rounded-lg border border-border bg-card px-3 text-sm text-foreground",
          "focus:border-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400/30",
          "disabled:opacity-50"
        )}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}

function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors focus:outline-none",
          checked ? "bg-teal-500" : "bg-muted",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-4 text-center">
      <div className="text-teal-400">{icon}</div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function ProfileView() {
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const [draft, setDraft] = useState<ProfileData>(INITIAL_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  function setDraftField<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleEdit() {
    setDraft({ ...profile });
    setIsEditing(true);
    setSaved(false);
  }

  function handleCancel() {
    setDraft({ ...profile });
    setIsEditing(false);
  }

  function handleSave() {
    // Phase B: PATCH /api/profile
    setProfile({ ...draft });
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const data = isEditing ? draft : profile;
  const disabled = !isEditing;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2">
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-2 bg-teal-500 text-white hover:bg-teal-600">
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {saved && (
        <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300">
          ✓ Profile saved successfully!
        </div>
      )}

      {/* Avatar + name card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/20 text-3xl font-bold text-teal-400 border-2 border-teal-400/30">
              {data.displayName.charAt(0).toUpperCase()}
            </div>
            {isEditing && (
              <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-lg font-bold text-foreground">{profile.displayName}</p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <span className="mt-1 inline-flex items-center rounded-full border border-teal-400/30 bg-teal-400/10 px-2.5 py-0.5 text-xs font-medium text-teal-300">
              {profile.experienceLevel}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard icon={<Wine className="h-5 w-5" />}     label="Bottles"   value="41" />
          <StatCard icon={<BookOpen className="h-5 w-5" />} label="Recipes"   value="25" />
          <StatCard icon={<Star className="h-5 w-5" />}     label="Favorites" value="8"  />
        </div>
      </div>

      {/* Account info */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">Account Info</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Display Name" value={data.displayName} onChange={(v) => setDraftField("displayName", v)} disabled={disabled} placeholder="Your name" />
          <InputField label="Username" value={data.username} onChange={(v) => setDraftField("username", v)} disabled={disabled} placeholder="@username" />
        </div>

        <InputField
          label="Email"
          value={data.email}
          onChange={() => {}}
          disabled={true}
          readonly={true}
          hint="Email cannot be changed here. Contact support to update your email address."
          type="email"
        />

        <InputField label="Location" value={data.location} onChange={(v) => setDraftField("location", v)} disabled={disabled} placeholder="City, State" />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Bio</label>
          <textarea
            rows={3}
            value={data.bio}
            onChange={(e) => setDraftField("bio", e.target.value)}
            disabled={disabled}
            placeholder="Tell us about your cocktail journey…"
            className={cn(
              "w-full rounded-lg border px-3 py-2.5 text-sm resize-none",
              "placeholder:text-muted-foreground focus:outline-none transition-colors",
              disabled
                ? "border-border bg-card text-foreground opacity-50"
                : "border-border bg-card text-foreground focus:border-teal-400/60 focus:ring-1 focus:ring-teal-400/30"
            )}
          />
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">Bar Preferences</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SelectField label="Favorite Spirit" value={data.favoriteSpirit} onChange={(v) => setDraftField("favoriteSpirit", v)} disabled={disabled} options={SPIRIT_OPTIONS} />
          <SelectField label="Bar Type" value={data.barType} onChange={(v) => setDraftField("barType", v)} disabled={disabled} options={BAR_TYPES} />
          <SelectField label="Experience Level" value={data.experienceLevel} onChange={(v) => setDraftField("experienceLevel", v)} disabled={disabled} options={EXPERIENCE_LEVELS} />
        </div>
      </div>

      {/* Settings / toggles */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
        <h2 className="mb-2 text-base font-semibold text-foreground">Settings</h2>
        <div className="divide-y divide-border/50">
          <ToggleRow label="Email Notifications" description="Receive cocktail suggestions and bar tips via email" checked={data.notifications} onChange={(v) => setDraftField("notifications", v)} disabled={disabled} />
          <ToggleRow label="Public Profile" description="Allow other users to see your bar and recipes" checked={data.publicProfile} onChange={(v) => setDraftField("publicProfile", v)} disabled={disabled} />
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex flex-col gap-3 mb-6">
        <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">These actions are irreversible. Please be certain.</p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:border-red-400 hover:bg-red-400/10">Export my data</Button>
          <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:border-red-400 hover:bg-red-400/10">Delete account</Button>
        </div>
      </div>
    </div>
  );
}

