import { useCallback, useEffect, useState } from "react";

export type FeatureSettings = {
  pureTextMode: boolean;
  bibleMemory: boolean;
  continuityDetective: boolean;
  showDontTell: boolean;
  dialogueAudit: boolean;
  synonymHelper: boolean;
  repetitionWarnings: boolean;
  autoBible: boolean;
  moodTint: boolean;
  ghostText: boolean;
  manualTint: string | null;
};

export const defaultSettings: FeatureSettings = {
  pureTextMode: false,
  bibleMemory: true,
  continuityDetective: true,
  showDontTell: true,
  dialogueAudit: true,
  synonymHelper: true,
  repetitionWarnings: true,
  autoBible: true,
  moodTint: true,
  ghostText: true,
  manualTint: null,
};

const KEY = "aurastory.settings.v1";

export function useSettings() {
  const [settings, setSettings] = useState<FeatureSettings>(defaultSettings);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback((patch: Partial<FeatureSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { settings, update };
}
