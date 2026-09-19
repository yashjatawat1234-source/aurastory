import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownToLine, Loader2, MessageSquareDashed, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { brainstormChat } from "@/lib/aura.functions";

type Msg = { role: "user" | "assistant"; content: string };

type Props = {
  open: boolean;
  onClose: () => void;
  genreAndRules: string;
  draftExcerpt: string;
  onPull: (text: string) => void;
};

export function BrainstormSandbox({ open, onClose, genreAndRules, draftExcerpt, onPull }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const list = useRef<HTMLDivElement | null>(null);
  const field = useRef<HTMLTextAreaElement | null>(null);
  const run = useServerFn(brainstormChat);

  const ask = useMutation({
    mutationFn: async (next: Msg[]) =>
      run({ data: { messages: next.slice(-24), genreAndRules, draftExcerpt: draftExcerpt.slice(-3000) } }),
    onSuccess: (res) => setMessages((m) => [...m, { role: "assistant", content: res.reply }]),
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (open) setTimeout(() => field.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending]);

  if (!open) return null;

  function send() {
    const content = input.trim();
    if (!content || ask.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    ask.mutate(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[85svh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-[var(--shadow-panel)]">
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
          <MessageSquareDashed className="size-4 text-primary" />
          <span className="font-serif text-lg">Brainstorm sandbox</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            — nothing here touches the story unless you pull it in
          </span>
          <div className="ml-auto flex items-center gap-1">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
                <Trash2 className="size-3.5" /> Discard all
              </Button>
            )}
            <Button variant="ghost" size="icon" aria-label="Close sandbox" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div ref={list} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-5">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Think out loud. Ask for a line, a twist, a name, a way out of the scene. Pull the good bits into the
              story and let the rest go.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-xl bg-primary/15 px-4 py-2 text-sm"
                  : "max-w-[92%] space-y-2 rounded-xl border border-border bg-card px-4 py-3"
              }
            >
              <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed">{m.content}</p>
              {m.role === "assistant" && (
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => onPull(m.content)}>
                    <ArrowDownToLine className="size-3.5" /> Pull into story
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMessages((all) => all.filter((_, j) => j !== i))}
                  >
                    Discard
                  </Button>
                </div>
              )}
            </div>
          ))}
          {ask.isPending && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Thinking…
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-end gap-2 border-t border-border p-3">
          <textarea
            ref={field}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="What if she never opens the letter?"
            className="min-h-0 flex-1 resize-none rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button size="icon" aria-label="Send" disabled={!input.trim() || ask.isPending} onClick={send}>
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
