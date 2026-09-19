export type BibleCategory = "character" | "location" | "lore_rule" | "unresolved_plot";

export type Project = {
  project_id: string;
  user_id: string;
  title: string;
  genre_and_rules: string;
  scratchpad: string;
  created_at: string;
};

export type BibleEntry = {
  entity_id: string;
  project_id: string;
  category: BibleCategory;
  name: string;
  current_state: Record<string, unknown> | null;
  secrets_and_history: string;
  updated_at: string;
};

export type Episode = {
  episode_id: string;
  project_id: string;
  episode_number: number;
  title: string;
  raw_text: string;
  cliffhanger_state: string;
  created_at: string;
};

export const categoryLabels: Record<BibleCategory, string> = {
  character: "Character",
  location: "Location",
  lore_rule: "Lore rule",
  unresolved_plot: "Unresolved plot",
};
