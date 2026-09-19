import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { FeatureSettings } from "@/hooks/useSettings";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: FeatureSettings;
  onChange: (patch: Partial<FeatureSettings>) => void;
};

const toggles: Array<{ key: keyof FeatureSettings; label: string; hint: string }> = [
  {
    key: "bibleMemory",
    label: "Living Story Bible Memory",
    hint: "Keeps character states, locations and lore in the assistant's context.",
  },
  {
    key: "continuityDetective",
    label: "Continuity Detective",
    hint: "Flags contradictions with the bible and earlier episodes.",
  },
  {
    key: "showDontTell",
    label: "Show-Don't-Tell Prompter",
    hint: "Calls out generic emotional description and flat pacing.",
  },
  {
    key: "dialogueAudit",
    label: "Dialogue Voice Audit",
    hint: "Checks dialogue for unnatural or off-character voice.",
  },
  {
    key: "synonymHelper",
    label: "Synonym Helper",
    hint: "Select a word on the canvas to see multilingual alternatives and spelling fixes.",
  },
  {
    key: "repetitionWarnings",
    label: "Repetition Warnings",
    hint: "Warns when a word or phrase is repeated too often in a passage and offers swaps.",
  },
  {
    key: "autoBible",
    label: "Automatic Story Bible",
    hint: "Quietly logs characters, locations, rules and open threads from your draft as you write.",
  },
  {
    key: "moodTint",
    label: "Mood Tint",
    hint: "Reads the scene's emotional temperature and gently colours the canvas to match.",
  },
  {
    key: "ghostText",
    label: "Ghost Text Autocomplete",
    hint: "Predicts the rest of your sentence in grey. Press Tab to accept it.",
  },
];

export function SettingsDialog({ open, onOpenChange, settings, onChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Control centre</DialogTitle>
          <DialogDescription>Every assistant feature can be switched off individually.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="pure-text" className="text-base font-medium">
                Pure Text Mode
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Master kill-switch. Turns off all tracking, proofreading and context. The canvas becomes a plain
                notepad.
              </p>
            </div>
            <Switch
              id="pure-text"
              checked={settings.pureTextMode}
              onCheckedChange={(v) => onChange({ pureTextMode: v })}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-5">
          {toggles.map((t) => (
            <div key={t.key} className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor={t.key} className="text-base font-medium">
                  {t.label}
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">{t.hint}</p>
              </div>
              <Switch
                id={t.key}
                disabled={settings.pureTextMode}
                checked={!settings.pureTextMode && Boolean(settings[t.key])}
                onCheckedChange={(v) => onChange({ [t.key]: v } as Partial<FeatureSettings>)}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
