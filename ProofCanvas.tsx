import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Replace } from "lucide-react";

import { suggestContinuation, suggestSynonyms, type ProofIssue } from "@/lib/aura.functions";

type Props = {
  value: string;
  onChange: (value: string) => void;
  issues: ProofIssue[];
  spellCheck: boolean;
  placeholder?: string;
  tint?: string | null;
  synonymHelper?: boolean;
  ghostText?: boolean;
  genreAndRules?: string;
  onDoubleSpace?: (() => void) | undefined;
};

type Segment = { text: string; issue?: ProofIssue };

function buildSegments(text: string, issues: ProofIssue[]): Segment[] {
  const marks: Array<{ start: number; end: number; issue: ProofIssue }> = [];

  for (const issue of issues) {
    let from = 0;
    while (from <= text.length) {
      const at = text.indexOf(issue.quote, from);
      if (at === -1) break;
      const overlaps = marks.some((m) => at < m.end && at + issue.quote.length > m.start);
      if (!overlaps) marks.push({ start: at, end: at + issue.quote.length, issue });
      from = at + issue.quote.length;
    }
  }

  marks.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const m of marks) {
    if (m.start > cursor) segments.push({ text: text.slice(cursor, m.start) });
    segments.push({ text: text.slice(m.start, m.end), issue: m.issue });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

function sentenceAround(text: string, start: number, end: number) {
  const from = Math.max(0, text.lastIndexOf(".", start - 1), text.lastIndexOf("\n", start - 1));
  const dot = text.indexOf(".", end);
  const to = dot === -1 ? Math.min(text.length, end + 200) : dot + 1;
  return text.slice(from, to).trim();
}

export function ProofCanvas({
  value,
  onChange,
  issues,
  spellCheck,
  placeholder,
  tint,
  synonymHelper = false,
  ghostText = false,
  genreAndRules = "",
  onDoubleSpace,
}: Props) {
  const overlay = useRef<HTMLDivElement | null>(null);
  const area = useRef<HTMLTextAreaElement | null>(null);
  const marker = useRef<HTMLSpanElement | null>(null);
  const lastSpace = useRef(0);
  const segments = useMemo(() => buildSegments(value, issues), [value, issues]);

  const [selection, setSelection] = useState<{ start: number; end: number; phrase: string } | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [ghost, setGhost] = useState("");
  const ghostFor = useRef("");

  const run = useServerFn(suggestSynonyms);
  const runGhost = useServerFn(suggestContinuation);
  const ask = useMutation({
    mutationFn: async (payload: { phrase: string; sentence: string }) => run({ data: payload }),
    onSuccess: (res) => setWords(res.synonyms),
    onError: () => setWords([]),
  });

  // Keep the textarea as tall as its content so the page has a single scrollbar.
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  // Gmail-style ghost completion after a short pause at the end of the text.
  useEffect(() => {
    if (!ghostText) {
      setGhost("");
      return;
    }
    const el = area.current;
    if (el && el.selectionStart !== value.length) {
      setGhost("");
      return;
    }
    if (value.trim().length < 12 || /[.!?…]["'”’)]?\s*$/.test(value)) {
      setGhost("");
      return;
    }
    if (ghostFor.current === value) return;
    const id = setTimeout(() => {
      const snapshot = value;
      runGhost({ data: { before: snapshot, genreAndRules } })
        .then((res) => {
          ghostFor.current = snapshot;
          if (area.current && area.current.value === snapshot) setGhost(res.completion);
        })
        .catch(() => setGhost(""));
    }, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ghostText, genreAndRules]);

  function acceptGhost() {
    if (!ghost) return;
    const next = value + ghost;
    setGhost("");
    ghostFor.current = next;
    onChange(next);
    requestAnimationFrame(() => {
      const el = area.current;
      if (el) {
        el.focus();
        el.setSelectionRange(next.length, next.length);
      }
    });
  }

  const close = useCallback(() => {
    setSelection(null);
    setAnchor(null);
    setWords([]);
  }, []);

  const readSelection = useCallback(() => {
    const el = area.current;
    if (!el || !synonymHelper) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const phrase = value.slice(start, end).trim();
    if (!phrase || phrase.length > 60 || phrase.split(/\s+/).length > 4) {
      close();
      return;
    }
    setSelection({ start, end, phrase });
    setWords([]);
    ask.mutate({ phrase, sentence: sentenceAround(value, start, end) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, synonymHelper, close]);

  useEffect(() => {
    if (!selection || !marker.current) return;
    setAnchor({
      top: marker.current.offsetTop + marker.current.offsetHeight,
      left: marker.current.offsetLeft,
    });
  }, [selection, value]);

  function replaceWith(word: string) {
    if (!selection) return;
    onChange(value.slice(0, selection.start) + word + value.slice(selection.end));
    close();
  }

  const shared =
    "writing-canvas min-h-[50svh] w-full whitespace-pre-wrap break-words border-none bg-transparent";

  return (
    <div
      className="relative rounded-2xl px-5 py-4 transition-colors duration-700"
      style={tint ? { backgroundColor: tint } : undefined}
    >
      <div
        ref={overlay}
        aria-hidden
        className={`${shared} pointer-events-none absolute inset-x-5 inset-y-4 text-transparent`}
      >
        {segments.map((s, i) =>
          s.issue ? (
            <span
              key={i}
              title={`${s.issue.kind}: ${s.issue.note}${s.issue.fix ? ` → ${s.issue.fix}` : ""}`}
              className={
                s.issue.kind === "spelling"
                  ? "rounded-sm bg-destructive/10 underline decoration-destructive decoration-wavy decoration-2 underline-offset-4"
                  : "rounded-sm bg-primary/10 underline decoration-primary decoration-wavy decoration-2 underline-offset-4"
              }
            >
              {s.text}
            </span>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
        {ghost && <span className="text-muted-foreground/70">{ghost}</span>}
        {"\n"}
      </div>

      {selection && (
        <div
          aria-hidden
          className={`${shared} pointer-events-none invisible absolute inset-x-5 inset-y-4`}
        >
          {value.slice(0, selection.start)}
          <span ref={marker}>{value.slice(selection.start, selection.end)}</span>
        </div>
      )}

      <textarea
        ref={area}
        value={value}
        onChange={(e) => {
          setGhost("");
          onChange(e.target.value);
        }}
        onSelect={readSelection}
        onBlur={() => setGhost("")}
        onKeyDown={(e) => {
          if (e.key === "Tab" && ghost) {
            e.preventDefault();
            acceptGhost();
            return;
          }
          if (e.key === " " && onDoubleSpace) {
            const now = Date.now();
            const at = e.currentTarget.selectionStart;
            const prevIsSpace = value.slice(Math.max(0, at - 1), at) === " ";
            if (prevIsSpace && now - lastSpace.current < 700) {
              e.preventDefault();
              lastSpace.current = 0;
              onChange(value.slice(0, at - 1) + value.slice(at));
              onDoubleSpace();
              return;
            }
            lastSpace.current = now;
          }
          if (e.key === "Escape") {
            setGhost("");
            close();
          }
        }}
        spellCheck={spellCheck}
        placeholder={placeholder ?? ""}
        className={`${shared} relative resize-none overflow-hidden bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60`}
      />

      {ghost && (
        <p className="pointer-events-none sticky bottom-0 text-xs text-muted-foreground">
          Press Tab to accept the suggestion
        </p>
      )}

      {selection && anchor && (
        <div
          className="absolute z-20 w-64 rounded-xl border border-border bg-popover p-3 shadow-[var(--shadow-panel)]"
          style={{ top: anchor.top + 20, left: Math.min(anchor.left, 320) }}
        >
          <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Replace className="size-3" /> Instead of “{selection.phrase}”
          </p>
          {ask.isPending && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Looking…
            </p>
          )}
          {!ask.isPending && words.length === 0 && (
            <p className="text-sm text-muted-foreground">No alternatives found.</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {words.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => replaceWith(w)}
                className="rounded-lg bg-secondary px-2 py-1 text-sm hover:bg-accent"
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
