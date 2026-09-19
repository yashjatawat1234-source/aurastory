import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, PenLine, LogOut, Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Episode, Project } from "@/components/aura/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AuraStory writing studio" },
      {
        name: "description",
        content:
          "Every serialized story, novel and script you are writing, with episode counts and world rules at a glance.",
      },
      { property: "og:title", content: "Dashboard — AuraStory writing studio" },
      {
        property: "og:description",
        content: "Open a project and drop straight into a distraction-free writing canvas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [rules, setRules] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["all-episodes", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("episodes").select("*");
      if (error) throw error;
      return data as Episode[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in first");
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: user.id, title: title.trim() || "Untitled story", genre_and_rules: rules.trim() })
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: (p) => {
      setTitle("");
      setRules("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      navigate({ to: "/studio", search: { project: p.project_id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("project_id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["all-episodes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || !user) {
    return <main className="flex min-h-svh items-center justify-center text-muted-foreground">Loading…</main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-serif text-lg tracking-tight text-muted-foreground">
            Aura<span className="text-primary">Story</span>
          </p>
          <h1 className="font-serif text-4xl tracking-tight">Your writing desk</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="mr-2 size-4" /> New project
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="mt-8 space-y-3 rounded-2xl border border-border bg-card p-5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">New project</Label>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            rows={3}
            placeholder="Genre and rules of the world — tone, POV, magic system limits, taboos…"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
          />
          <Button disabled={create.isPending} onClick={() => create.mutate()}>
            Create and start writing
          </Button>
        </div>
      )}

      {isLoading && <p className="mt-10 text-sm text-muted-foreground">Loading your projects…</p>}

      {!isLoading && projects.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-serif text-2xl">No projects yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Start one and the canvas, story bible and assistant come with it.
          </p>
          <Button className="mt-5" onClick={() => setShowForm(true)}>
            Create your first project
          </Button>
        </div>
      )}

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {projects.map((p) => {
          const eps = episodes.filter((e) => e.project_id === p.project_id);
          const words = eps.reduce(
            (n, e) => n + (e.raw_text.trim() ? e.raw_text.trim().split(/\s+/).length : 0),
            0,
          );
          return (
            <li
              key={p.project_id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <Link
                to="/studio"
                search={{ project: p.project_id }}
                className="font-serif text-2xl tracking-tight hover:text-primary"
              >
                {p.title}
              </Link>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {p.genre_and_rules || "No genre notes yet"}
              </p>
              <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                {eps.length} episode{eps.length === 1 ? "" : "s"} · {words} words
              </p>
              {p.scratchpad?.trim() && (
                <p className="mt-3 line-clamp-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                  Notes: {p.scratchpad}
                </p>
              )}
              <div className="mt-5 flex items-center gap-2">
                <Button size="sm" asChild>
                  <Link to="/studio" search={{ project: p.project_id }}>
                    <PenLine className="mr-2 size-4" /> Open canvas
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${p.title}`}
                  onClick={() => remove.mutate(p.project_id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
