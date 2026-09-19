import { useEffect, useRef, useState } from "react";
import { NotebookPen } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { DockPanel } from "./DockPanel";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  value: string;
};

export function Scratchpad({ open, onOpenChange, projectId, value }: Props) {
  const [notes, setNotes] = useState(value);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotes(value);
  }, [value, projectId]);

  function save(next: string) {
    if (!projectId) return;
    setSaving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const { error } = await supabase.from("projects").update({ scratchpad: next }).eq("project_id", projectId);
      setSaving(false);
      if (error) toast.error("Could not save your notes");
    }, 700);
  }

  if (!open) return null;

  return (
    <DockPanel
      side="right"
      title={
        <span className="flex items-center gap-2">
          <NotebookPen className="size-5 text-primary" /> Scratchpad
        </span>
      }
      description="Future references, loose ideas and reminders. Saved with this project."
      onClose={() => onOpenChange(false)}
      footer={<p className="px-5 pb-3 text-xs text-muted-foreground">{saving ? "saving…" : "saved"}</p>}
    >
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          save(e.target.value);
        }}
        placeholder="Ideas, names, half-formed scenes, things to plant in later episodes…"
        className="min-h-[50svh] flex-1 resize-none rounded-xl border border-border bg-secondary/40 p-4 font-serif text-base leading-relaxed outline-none placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring"
      />
    </DockPanel>
  );
}
