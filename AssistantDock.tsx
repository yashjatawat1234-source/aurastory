import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Feather, RefreshCw, X, BookOpen, Search, PenLine, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyzeDraft, type AssistantCard } from "@/lib/aura.functions";
import type { FeatureSettings } from "@/hooks/useSettings";
import type { BibleEntry } from "./types";

type Props = {
  settings: FeatureSettings;
  genreAndRules: string;
  previousCliffhanger: string;
  bible: BibleEntry[];
  text: string;
  otherEpisodes: Array<{ number: number; title: string; excerpt: string }>;
};

const kindMeta = {
  context: { label: "Smart context", icon: BookOpen },
  continuity: { label: "Continuity", icon: Search },
  style: { label: "Style audit", icon: PenLine },
  character: { label: "Character drift", icon: UserRound },
} as const;

const severityClass: Record<AssistantCard["severity"], string> = {
  info: "border-border",
  warning: "border-warning/50",
  critical: "border-destructive/60",
};

export function AssistantDock({
  settings,
  genreAndRules,
  previousCliffhanger,
  bible,
  text,
  otherEpisodes,
}: Props) {
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState<AssistantCard[]>([]);
  const run = useServerFn(analyzeDraft);

  const analyze = useMutation({
    mutationFn: async () =>
      run({
        data: {
          text,
          genreAndRules,
          previousCliffhanger,
          otherEpisodes,
          bible: bible.map((b) => ({
            name: b.name,
            category: b.category,
            current_state: b.current_state ?? {},
            secrets_and_history: b.secrets_and_history,
          })),
          features: {
            bibleMemory: settings.bibleMemory,
            continuityDetective: settings.continuityDetective,
            showDontTell: settings.showDontTell,
            dialogueAudit: settings.dialogueAudit,
          },
        },
      }),
    onSuccess: (res) => setCards(res.cards),
    onError: (e: Error) => toast.error(e.message),
  });

  if (settings.pureTextMode) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex max-h-[70svh] w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-[var(--shadow-panel)]">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <span className="font-serif text-lg">Assistant</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={analyze.isPending}
                onClick={() => analyze.mutate()}
                aria-label="Re-run assistant"
              >
                <RefreshCw className={analyze.isPending ? "size-4 animate-spin" : "size-4"} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close assistant">
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
            {analyze.isPending && <p className="text-sm text-muted-foreground">Reading your draft…</p>}
            {!analyze.isPending && cards.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing yet. Run the assistant to pull context, continuity checks and a style audit.
              </p>
            )}
            {cards.map((card, i) => {
              const meta = kindMeta[card.kind] ?? kindMeta.context;
              const Icon = meta.icon;
              return (
                <div
                  key={i}
                  className={`space-y-2 rounded-xl border bg-card p-4 ${severityClass[card.severity] ?? ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0 text-primary" />
                    <span className="text-sm font-medium">{card.title}</span>
                    <Badge variant="secondary" className="ml-auto shrink-0 text-[10px] uppercase tracking-wider">
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                  {card.suggestion && (
                    <p className="rounded-lg bg-secondary p-3 font-serif text-sm leading-relaxed">
                      {card.suggestion}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full ember-glow"
        aria-label="Open writing assistant"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && cards.length === 0 && text.trim()) analyze.mutate();
        }}
      >
        <Feather className="size-6" />
      </Button>
    </>
  );
}
