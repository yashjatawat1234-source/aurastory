import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MessageSquareDashed, Save, SpellCheck2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { TopBar } from "@/components/aura/TopBar";
import { StoryBibleDrawer } from "@/components/aura/StoryBibleDrawer";
import { WhatIfDrawer } from "@/components/aura/WhatIfDrawer";
import { SettingsDialog } from "@/components/aura/SettingsDialog";
import { AssistantDock } from "@/components/aura/AssistantDock";
import { Scratchpad } from "@/components/aura/Scratchpad";
import { ProofCanvas } from "@/components/aura/ProofCanvas";
import { RepetitionBanner } from "@/components/aura/RepetitionBanner";
import { BrainstormSandbox } from "@/components/aura/BrainstormSandbox";
import { TintPicker, tintFromHue } from "@/components/aura/TintPicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { extractBibleEntries, proofreadDraft, senseMood, type ProofIssue } from "@/lib/aura.functions";
import type { BibleCategory, BibleEntry, Episode, Project } from "@/components/aura/types";

export const Route = createFileRoute("/studio")({
  validateSearch: (search: Record<string, unknown>) => ({
    project: typeof search["project"] === "string" ? (search["project"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Writing studio — AuraStory" },
      {
        name: "description",
        content:
          "A dark, quiet writing canvas with a living story bible, continuity checks, a scratchpad and a what-if sandbox.",
      },
      { property: "og:title", content: "Writing studio — AuraStory" },
      {
        property: "og:description",
        content: "Draft episodes on a distraction-free canvas with continuity and style help on demand.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

function Studio() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { settings, update } = useSettings();
  const { project: projectParam } = Route.useSearch();

  const [projectId, setProjectId] = useState<string | null>(projectParam || null);
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [issues, setIssues] = useState<ProofIssue[]>([]);
  const [bibleOpen, setBibleOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState<"scratchpad" | "whatif" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [mood, setMood] = useState<{ mood: string; hue: number; intensity: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bibleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMoodText = useRef("");
  const lastBibleText = useRef("");
  const runProofread = useServerFn(proofreadDraft);
  const runMood = useServerFn(senseMood);
  const runExtract = useServerFn(extractBibleEntries);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: projects = [] } = useQuery({
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
    queryKey: ["episodes", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("project_id", projectId!)
        .order("episode_number", { ascending: true });
      if (error) throw error;
      return data as Episode[];
    },
  });

  const { data: bible = [] } = useQuery({
    queryKey: ["bible", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("story_bible")
        .select("*")
        .eq("project_id", projectId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as BibleEntry[];
    },
  });

  const createEpisode = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Pick a project first");
      const nextNumber = (episodes.at(-1)?.episode_number ?? 0) + 1;
      const { data, error } = await supabase
        .from("episodes")
        .insert({ project_id: projectId, episode_number: nextNumber, title: `Episode ${nextNumber}` })
        .select()
        .single();
      if (error) throw error;
      return data as Episode;
    },
    onSuccess: (ep) => {
      qc.invalidateQueries({ queryKey: ["episodes", projectId] });
      setEpisodeId(ep.episode_id);
      setText("");
      setTitle(ep.title);
      setIssues([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (!projectId && projects.length > 0) setProjectId(projects[0]!.project_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  useEffect(() => {
    if (!projectId) return;
    if (episodes.length === 0) {
      if (episodeId !== null) {
        setEpisodeId(null);
        setText("");
        setTitle("");
        setIssues([]);
      }
      return;
    }
    const first = episodes[0];
    if (first && !episodes.some((e) => e.episode_id === episodeId)) {
      setEpisodeId(first.episode_id);
      setText(first.raw_text);
      setTitle(first.title);
      setIssues([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodes, projectId]);

  const activeProject = projects.find((p) => p.project_id === projectId) ?? null;
  const activeEpisode = episodes.find((e) => e.episode_id === episodeId) ?? null;

  const previousCliffhanger = useMemo(() => {
    if (!activeEpisode) return "";
    const prev = episodes.filter((e) => e.episode_number < activeEpisode.episode_number).at(-1);
    return prev?.cliffhanger_state || prev?.raw_text.slice(-600) || "";
  }, [episodes, activeEpisode]);

  const otherEpisodes = useMemo(
    () =>
      episodes
        .filter((e) => e.episode_id !== episodeId)
        .map((e) => ({ number: e.episode_number, title: e.title, excerpt: e.raw_text.slice(0, 2500) })),
    [episodes, episodeId],
  );

  async function persist(patch: { raw_text?: string; title?: string }) {
    if (!episodeId) return;
    setSaving(true);
    const { error } = await supabase.from("episodes").update(patch).eq("episode_id", episodeId);
    setSaving(false);
    if (error) {
      toast.error("Could not save your draft");
      return;
    }
    setDirty(false);
    qc.invalidateQueries({ queryKey: ["episodes", projectId] });
  }

  function scheduleSave(patch: { raw_text?: string; title?: string }) {
    if (!episodeId) return;
    setDirty(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(patch), 900);
  }

  const proofread = useMutation({
    mutationFn: async () => runProofread({ data: { text: text.slice(0, 20000) } }),
    onSuccess: (res) => {
      setIssues(res.issues);
      toast.success(res.issues.length ? `${res.issues.length} things to look at` : "No spelling or grammar issues");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mood tint: re-read the scene a while after typing pauses.
  const moodEnabled = settings.moodTint && !settings.pureTextMode && !settings.manualTint;
  useEffect(() => {
    if (!moodEnabled) return;
    const sample = text.slice(-4000);
    if (sample.trim().length < 120 || sample === lastMoodText.current) return;
    if (moodTimer.current) clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => {
      lastMoodText.current = sample;
      runMood({ data: { text: sample, genreAndRules: activeProject?.genre_and_rules ?? "" } })
        .then(setMood)
        .catch(() => {});
    }, 6000);
    return () => {
      if (moodTimer.current) clearTimeout(moodTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, moodEnabled]);

  // Automatic story bible: extract entities in the background after a longer pause.
  const autoBibleEnabled = settings.autoBible && !settings.pureTextMode && Boolean(projectId);
  useEffect(() => {
    if (!autoBibleEnabled || !activeEpisode) return;
    if (text.trim().length < 200 || text === lastBibleText.current) return;
    if (bibleTimer.current) clearTimeout(bibleTimer.current);
    bibleTimer.current = setTimeout(async () => {
      lastBibleText.current = text;
      try {
        const res = await runExtract({
          data: {
            text,
            episodeNumber: activeEpisode.episode_number,
            episodeTitle: activeEpisode.title,
            existing: bible.map((b) => ({
              name: b.name,
              category: b.category,
              summary: String((b.current_state as { summary?: string } | null)?.summary ?? ""),
            })),
          },
        });
        if (res.entries.length === 0) return;
        for (const e of res.entries) {
          const match = bible.find(
            (b) => b.category === e.category && b.name.toLowerCase() === e.name.toLowerCase(),
          );
          const payload = {
            current_state: { summary: e.summary },
            secrets_and_history: e.history || match?.secrets_and_history || "",
          };
          if (match) {
            await supabase.from("story_bible").update(payload).eq("entity_id", match.entity_id);
          } else {
            await supabase.from("story_bible").insert({
              project_id: projectId!,
              name: e.name,
              category: e.category as BibleCategory,
              ...payload,
            });
          }
        }
        qc.invalidateQueries({ queryKey: ["bible", projectId] });
        toast.message("Story bible updated", { description: `${res.entries.length} entries refreshed from your draft.` });
      } catch {
        /* background job — stay quiet */
      }
    }, 20000);
    return () => {
      if (bibleTimer.current) clearTimeout(bibleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, autoBibleEnabled, activeEpisode?.episode_id]);

  const tint = settings.pureTextMode
    ? null
    : settings.manualTint
      ? settings.manualTint
      : settings.moodTint && mood && mood.intensity > 0
        ? tintFromHue(mood.hue, mood.intensity)
        : null;

  function pullIntoStory(snippet: string) {
    const glue = text.length === 0 || text.endsWith("\n") ? "" : text.endsWith("\n\n") ? "" : "\n\n";
    const next = text + glue + snippet.trim() + "\n";
    setText(next);
    scheduleSave({ raw_text: next });
    toast.success("Pulled into the story");
  }

  function replacePhrase(phrase: string, replacement: string) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    let n = 0;
    const next = text.replace(re, (m) => {
      n += 1;
      return n === 1 ? m : replacement;
    });
    setText(next);
    scheduleSave({ raw_text: next });
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (loading || !user) {
    return <main className="flex min-h-svh items-center justify-center text-muted-foreground">Loading…</main>;
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <TopBar
        projects={projects}
        projectId={projectId}
        onProjectChange={(id) => {
          setProjectId(id);
          setEpisodeId(null);
          setIssues([]);
        }}
        episodes={episodes}
        episodeId={episodeId}
        onEpisodeChange={(id) => {
          const ep = episodes.find((e) => e.episode_id === id);
          setEpisodeId(id);
          setText(ep?.raw_text ?? "");
          setTitle(ep?.title ?? "");
          setIssues([]);
        }}
        onNewEpisode={() => createEpisode.mutate()}
        onOpenBible={() => setBibleOpen((v) => !v)}
        onOpenWhatIf={() => setRightPanel((p) => (p === "whatif" ? null : "whatif"))}
        onOpenScratchpad={() => setRightPanel((p) => (p === "scratchpad" ? null : "scratchpad"))}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/auth" });
        }}
        pureTextMode={settings.pureTextMode}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <StoryBibleDrawer open={bibleOpen} onOpenChange={setBibleOpen} projectId={projectId} entries={bible} />

        <main className="mx-auto h-full w-full max-w-3xl min-w-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-40 pt-12">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => void persist({ raw_text: text, title })} disabled={saving || !episodeId}>
              <Save className="mr-2 size-4" />
              {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            </Button>
            {!settings.pureTextMode && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={proofread.isPending || !text.trim()}
                  onClick={() => proofread.mutate()}
                >
                  <SpellCheck2 className="mr-2 size-4" />
                  {proofread.isPending ? "Checking…" : "Check spelling & grammar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSandboxOpen(true)} title="Or press space twice">
                  <MessageSquareDashed className="mr-2 size-4" /> Brainstorm
                </Button>
                <TintPicker
                  manualTint={settings.manualTint}
                  moodTint={settings.moodTint}
                  mood={mood?.mood ?? ""}
                  onManual={(t) => update({ manualTint: t })}
                  onMoodToggle={(on) => update({ moodTint: on })}
                />
              </>
            )}
            {issues.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setIssues([])}>
                Clear marks
              </Button>
            )}
          </div>

          {!episodeId ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="font-serif text-2xl">No episodes yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Nothing is created for you. Start the first one whenever you're ready.
              </p>
              <Button className="mt-5" disabled={createEpisode.isPending} onClick={() => createEpisode.mutate()}>
                Create the first episode
              </Button>
            </div>
          ) : (
            <>
              <Input
                value={title}
                placeholder="Episode title"
                onChange={(e) => {
                  setTitle(e.target.value);
                  scheduleSave({ title: e.target.value });
                }}
                className="mb-8 h-auto border-none bg-transparent px-0 font-serif text-3xl tracking-tight shadow-none focus-visible:ring-0 md:text-4xl"
              />

              {!settings.pureTextMode && settings.repetitionWarnings && (
                <RepetitionBanner text={text} onReplace={replacePhrase} />
              )}

              <ProofCanvas
                value={text}
                onChange={(v) => {
                  setText(v);
                  scheduleSave({ raw_text: v });
                }}
                issues={settings.pureTextMode ? [] : issues}
                spellCheck={!settings.pureTextMode}
                placeholder="Begin where the last episode left you…"
                tint={tint}
                synonymHelper={!settings.pureTextMode && settings.synonymHelper}
                ghostText={!settings.pureTextMode && settings.ghostText}
                genreAndRules={activeProject?.genre_and_rules ?? ""}
                onDoubleSpace={settings.pureTextMode ? undefined : () => setSandboxOpen(true)}
              />
            </>
          )}
        </main>

        <Scratchpad
          open={rightPanel === "scratchpad"}
          onOpenChange={(o) => setRightPanel(o ? "scratchpad" : null)}
          projectId={projectId}
          value={activeProject?.scratchpad ?? ""}
        />
        <WhatIfDrawer
          open={rightPanel === "whatif"}
          onOpenChange={(o) => setRightPanel(o ? "whatif" : null)}
          genreAndRules={activeProject?.genre_and_rules ?? ""}
          bible={settings.bibleMemory ? bible : []}
          draftExcerpt={text}
          disabled={settings.pureTextMode}
        />
      </div>

      <footer className="pointer-events-none fixed bottom-6 left-6 z-30 text-xs text-muted-foreground">
        {words} words · {saving ? "saving…" : dirty ? "unsaved changes" : "saved"}
        {settings.pureTextMode && " · pure text mode"}
        {!settings.pureTextMode && !settings.manualTint && settings.moodTint && mood?.mood && ` · ${mood.mood}`}
      </footer>

      <BrainstormSandbox
        open={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
        genreAndRules={activeProject?.genre_and_rules ?? ""}
        draftExcerpt={text}
        onPull={pullIntoStory}
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} onChange={update} />
      <AssistantDock
        settings={settings}
        genreAndRules={activeProject?.genre_and_rules ?? ""}
        previousCliffhanger={previousCliffhanger}
        bible={bible}
        text={text}
        otherEpisodes={settings.continuityDetective ? otherEpisodes : []}
      />
    </div>
  );
}
