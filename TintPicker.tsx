import { Palette, Wand2 } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export const tintSwatches: Array<{ name: string; hue: number }> = [
  { name: "Ember", hue: 40 },
  { name: "Gold", hue: 85 },
  { name: "Moss", hue: 150 },
  { name: "Ice", hue: 210 },
  { name: "Night", hue: 260 },
  { name: "Violet", hue: 300 },
  { name: "Rose", hue: 345 },
];

export function tintFromHue(hue: number, intensity = 0.6) {
  const chroma = (0.02 + intensity * 0.05).toFixed(3);
  return `oklch(0.19 ${chroma} ${hue})`;
}

type Props = {
  manualTint: string | null;
  moodTint: boolean;
  mood: string;
  onManual: (tint: string | null) => void;
  onMoodToggle: (on: boolean) => void;
};

export function TintPicker({ manualTint, moodTint, mood, onManual, onMoodToggle }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" aria-label="Canvas colour">
          <Palette className="size-4" />
          <span className="hidden sm:inline">{manualTint ? "Custom tint" : moodTint && mood ? mood : "Canvas colour"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Canvas colour</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-label="No tint"
            onClick={() => onManual(null)}
            className={`size-7 rounded-full border border-border bg-background ${!manualTint ? "ring-2 ring-primary" : ""}`}
          />
          {tintSwatches.map((s) => {
            const value = tintFromHue(s.hue, 0.8);
            return (
              <button
                key={s.name}
                type="button"
                title={s.name}
                aria-label={s.name}
                onClick={() => onManual(value)}
                style={{ backgroundColor: value }}
                className={`size-7 rounded-full border border-border ${manualTint === value ? "ring-2 ring-primary" : ""}`}
              />
            );
          })}
        </div>
        <Button
          size="sm"
          variant={moodTint ? "secondary" : "outline"}
          className="w-full"
          onClick={() => onMoodToggle(!moodTint)}
        >
          <Wand2 className="size-3.5" />
          {moodTint ? "Mood tint on" : "Tint by scene mood"}
        </Button>
        <p className="text-xs text-muted-foreground">
          A manual colour overrides the mood reader. Clear it to let the scene set the tone.
        </p>
      </PopoverContent>
    </Popover>
  );
}
