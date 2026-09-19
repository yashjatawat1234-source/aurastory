import { Link } from "@tanstack/react-router";
import { BookOpen, FlaskConical, Plus, Settings2, LogOut, NotebookPen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Episode, Project } from "./types";

type Props = {
  projects: Project[];
  projectId: string | null;
  onProjectChange: (id: string) => void;
  episodes: Episode[];
  episodeId: string | null;
  onEpisodeChange: (id: string) => void;
  onNewEpisode: () => void;
  onOpenBible: () => void;
  onOpenWhatIf: () => void;
  onOpenScratchpad: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  pureTextMode: boolean;
};

export function TopBar(props: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link to="/" className="mr-2 font-serif text-lg tracking-tight">
          Aura<span className="text-primary">Story</span>
        </Link>

        <Select value={props.projectId ?? ""} onValueChange={props.onProjectChange}>
          <SelectTrigger className="w-[9.5rem] border-none bg-secondary sm:w-52">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {props.projects.map((p) => (
              <SelectItem key={p.project_id} value={p.project_id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={props.episodeId ?? ""} onValueChange={props.onEpisodeChange}>
          <SelectTrigger className="hidden w-44 border-none bg-secondary sm:flex">
            <SelectValue placeholder="Episode" />
          </SelectTrigger>
          <SelectContent>
            {props.episodes.map((e) => (
              <SelectItem key={e.episode_id} value={e.episode_id}>
                Ep {e.episode_number} · {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" onClick={props.onNewEpisode} aria-label="New episode">
          <Plus className="size-4" />
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={props.onOpenBible} aria-label="Story bible">
            <BookOpen className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={props.onOpenScratchpad} aria-label="Scratchpad">
            <NotebookPen className="size-4" />
          </Button>
          {!props.pureTextMode && (
            <Button variant="ghost" size="icon" onClick={props.onOpenWhatIf} aria-label="What-if sandbox">
              <FlaskConical className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={props.onOpenSettings} aria-label="Control centre">
            <Settings2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={props.onSignOut} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
