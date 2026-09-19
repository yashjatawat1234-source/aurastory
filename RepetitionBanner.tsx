import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Repeat2, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { suggestAlternatives } from "@/lib/aura.functions";

type Props = {
  text: string;
  onReplace: (phrase: string, replacement: string) => void;
};

const STOP = new Set([
  "that","this","with","from","they","them","their","there","then","when","what","which","were","have","been","into",
  "about","would","could","should","because","after","before","while","your","yours","said","says","just","very",
  "also","like","over","under","again","still","being","does","done","each","other","than","some","such","only",
]);

export type Repetition = { phrase: string; count: number };

function findRepetitions(text: string): Repetition[] {
  const window = text.slice(-4000);
  const words = window.toLowerCase().match(/[\p{L}\p{M}']+/gu) ?? [];
  const found: Repetition[] = [];

  const single = new Map<string, number>();
  for (const w of words) {
    if (w.length < 5 || STOP.has(w)) continue;
    single.set(w, (single.get(w) ?? 0) + 1);
  }
  for (const [w, n] of single) if (n > 3) found.push({ phrase: w, count: n });

  const phrases = new Map<string, number>();
  for (let i = 0; i + 2 < words.length; i++) {
    const tri = words.slice(i, i + 3).join(" ");
    phrases.set(tri, (phrases.get(tri) ?? 0) + 1);
  }
  for (const [p, n] of phrases) if (n > 2) found.push({ phrase: p, count: n });

  return found.sort((a, b) => b.count - a.count).slice(0, 4);
}

export function RepetitionBanner({ text, onReplace }: Props) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const run = useServerFn(suggestAlternatives);

  const reps = useMemo(
    () => findRepetitions(text).filter((r) => !dismissed.includes(r.phrase)),
    [text, dismissed],
  );

  const ask = useMutation({
    mutationFn: async (phrase: string) => run({ data: { phrase, context: text.slice(-2500) } }),
    onSuccess: (res) => setOptions(res.alternatives),
    onError: () => setOptions([]),
  });

  if (reps.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl border border-warning/40 bg-warning/5 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Repeat2 className="size-4 shrink-0 text-warning" />
        <span className="text-muted-foreground">Repeated close together:</span>
        {reps.map((r) => (
          <button
            key={r.phrase}
            type="button"
            onClick={() => {
              setActive(r.phrase);
              setOptions([]);
              ask.mutate(r.phrase);
            }}
            className={`rounded-lg px-2 py-0.5 font-serif ${
              active === r.phrase ? "bg-warning/20" : "bg-secondary hover:bg-accent"
            }`}
          >
            “{r.phrase}” ×{r.count}
          </button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-7"
          aria-label="Dismiss repetition warnings"
          onClick={() => setDismissed((d) => [...d, ...reps.map((r) => r.phrase)])}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {active && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-warning/20 pt-3">
          {ask.isPending && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Finding alternatives for “{active}”…
            </span>
          )}
          {!ask.isPending && options.length === 0 && (
            <span className="text-sm text-muted-foreground">No alternatives came back.</span>
          )}
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onReplace(active, o);
                setActive(null);
                setOptions([]);
              }}
              className="rounded-lg bg-secondary px-2 py-1 text-sm hover:bg-accent"
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
