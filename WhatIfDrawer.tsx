import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { brainstormWhatIf } from "@/lib/aura.functions";
import { DockPanel } from "./DockPanel";
import type { BibleEntry } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genreAndRules: string;
  bible: BibleEntry[];
  draftExcerpt: string;
  disabled: boolean;
};

export function WhatIfDrawer({ open, onOpenChange, genreAndRules, bible, draftExcerpt, disabled }: Props) {
  const [premise, setPremise] = useState("");
  const [answer, setAnswer] = useState("");
  const run = useServerFn(brainstormWhatIf);

  const ask = useMutation({
    mutationFn: async () =>
      run({
        data: {
          premise,
          genreAndRules,
          draftExcerpt,
          bible: bible.map((b) => ({
            name: b.name,
            category: b.category,
            current_state: b.current_state ?? {},
            secrets_and_history: b.secrets_and_history,
          })),
        },
      }),
    onSuccess: (res) => setAnswer(res.answer),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!open) return null;

  return (
    <DockPanel
      side="right"
      title="What-If sandbox"
      description="Test a plot direction without touching the manuscript."
      onClose={() => onOpenChange(false)}
    >
      <div className="space-y-4">
        {disabled ? (
          <p className="text-sm text-muted-foreground">
            Pure Text Mode is on. Switch it off in the control centre to brainstorm.
          </p>
        ) : (
          <>
            <Textarea
              rows={4}
              placeholder="What if the mentor was the one who set the fire?"
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
            />
            <Button className="w-full" disabled={!premise.trim() || ask.isPending} onClick={() => ask.mutate()}>
              <Sparkles className="size-4" />
              {ask.isPending ? "Thinking…" : "Explore this direction"}
            </Button>
            {answer && (
              <div className="whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
                {answer}
              </div>
            )}
          </>
        )}
      </div>
    </DockPanel>
  );
}
