import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { DockPanel } from "./DockPanel";
import { categoryLabels, type BibleCategory, type BibleEntry } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  entries: BibleEntry[];
};

export function StoryBibleDrawer({ open, onOpenChange, projectId, entries }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BibleCategory>("character");
  const [state, setState] = useState("");
  const [history, setHistory] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["bible", projectId] });

  const create = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Pick a project first");
      const { error } = await supabase.from("story_bible").insert({
        project_id: projectId,
        name: name.trim(),
        category,
        current_state: { summary: state.trim() },
        secrets_and_history: history.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setState("");
      setHistory("");
      invalidate();
      toast.success("Added to the story bible");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (payload: { id: string; patch: { current_state?: { summary: string }; secrets_and_history?: string } }) => {
      const { error } = await supabase
        .from("story_bible")
        .update(payload.patch)
        .eq("entity_id", payload.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("story_bible").delete().eq("entity_id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  if (!open) return null;

  return (
    <DockPanel
      side="left"
      title="Story Bible"
      description="Living state of everyone and everything in this story."
      onClose={() => onOpenChange(false)}
    >
          <div className="space-y-6">
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">New entry</Label>
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Select value={category} onValueChange={(v) => setCategory(v as BibleCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryLabels) as BibleCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabels[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Current state — injuries, mood, location, status…"
                value={state}
                onChange={(e) => setState(e.target.value)}
                rows={2}
              />
              <Textarea
                placeholder="Secrets & history"
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                rows={2}
              />
              <Button
                className="w-full"
                disabled={!name.trim() || create.isPending}
                onClick={() => create.mutate()}
              >
                <Plus className="size-4" /> Add entry
              </Button>
            </div>

            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
            ) : (
              entries.map((entry) => (
                <div key={entry.entity_id} className="space-y-2 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg">{entry.name}</span>
                      <Badge variant="secondary">{categoryLabels[entry.category]}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => remove.mutate(entry.entity_id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    defaultValue={String((entry.current_state as { summary?: string })?.summary ?? "")}
                    onBlur={(e) =>
                      update.mutate({
                        id: entry.entity_id,
                        patch: { current_state: { summary: e.target.value } },
                      })
                    }
                  />
                  <Textarea
                    rows={2}
                    placeholder="Secrets & history"
                    defaultValue={entry.secrets_and_history}
                    onBlur={(e) =>
                      update.mutate({ id: entry.entity_id, patch: { secrets_and_history: e.target.value } })
                    }
                  />
                </div>
              ))
            )}
          </div>
    </DockPanel>
  );
}
