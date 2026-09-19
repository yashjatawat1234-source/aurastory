import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Feather, PenLine, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AuraStory — a quiet studio for serialized fiction" },
      {
        name: "description",
        content:
          "AuraStory is a dark, distraction-free writing studio for novelists, serial fiction writers and screenwriters, with a living story bible and an assistant that never writes for you.",
      },
      { property: "og:title", content: "AuraStory — a quiet studio for serialized fiction" },
      {
        property: "og:description",
        content: "Write long-form stories with continuity help, a living story bible and total control over the AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

const paths = [
  {
    icon: BookOpen,
    title: "Serialized fiction",
    body: "Episode after episode, with cliffhangers, character drift and open threads tracked for you.",
  },
  {
    icon: PenLine,
    title: "Novels & long-form",
    body: "One long manuscript, split into chapters you can move through without losing the thread.",
  },
  {
    icon: Users,
    title: "Scripts & screenplays",
    body: "Dialogue audits, voice consistency and a bible that remembers who each character has become.",
  },
];

function Welcome() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <p className="font-serif text-lg tracking-tight text-muted-foreground">
        Aura<span className="text-primary">Story</span>
      </p>
      <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-tight tracking-tight md:text-6xl">
        The story stays yours. The machine just keeps the notes.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        A dark, quiet canvas for people who write long things: serials, novels, scripts. Everything else —
        continuity, spelling, the story bible, the what-ifs — waits in the margins until you ask.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button size="lg" asChild>
          <Link to={user ? "/dashboard" : "/auth"}>
            <Feather className="mr-2 size-4" />
            {user ? "Go to your projects" : "Start writing"}
          </Link>
        </Button>
        {!user && (
          <Button size="lg" variant="outline" asChild>
            <Link to="/auth">I already have an account</Link>
          </Button>
        )}
      </div>

      <section className="mt-20">
        <h2 className="font-serif text-3xl tracking-tight">What are you writing?</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {paths.map((p) => (
            <li key={p.title} className="rounded-2xl border border-border bg-card p-5">
              <p.icon className="size-5 text-primary" />
              <h3 className="mt-3 font-serif text-xl">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20">
        <h2 className="font-serif text-3xl tracking-tight">The vision</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Most writing tools either get out of the way completely or try to write the book for you. AuraStory sits
          in between: a canvas so plain it disappears, and a memory so patient it never forgets what you decided in
          episode three. You keep the voice, the pacing and the risk. The studio keeps the ledger.
        </p>
      </section>

      <section className="mt-20 rounded-2xl border border-primary/25 bg-primary/5 p-8">
        <h2 className="flex items-center gap-2 font-serif text-3xl tracking-tight">
          <Sparkles className="size-5 text-primary" /> Human and AI, in that order
        </h2>
        <ul className="mt-5 space-y-3 text-muted-foreground">
          <li>The assistant never writes into your manuscript on its own. Nothing appears unless you accept it.</li>
          <li>Every helper has its own switch, and Pure Text Mode turns all of them off at once.</li>
          <li>Continuity notes are observations, not corrections. Contradict your own bible if the story needs it.</li>
          <li>Brainstorming lives in a sandbox. What you don't pull in is thrown away.</li>
          <li>Your drafts are yours: they stay in your account and are never used to train anything.</li>
        </ul>
      </section>

      <section className="mt-20">
        <h2 className="font-serif text-3xl tracking-tight">Who made this</h2>
        <div className="mt-5 flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card p-6">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/15 font-serif text-2xl text-primary">
            YJ
          </div>
          <div className="min-w-0">
            <p className="font-serif text-2xl tracking-tight">Yash Jatawat</p>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Creator of AuraStory</p>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Built AuraStory out of a simple frustration: serialized stories collapse under their own memory. This
              studio is the tool he wanted while writing one — quiet, dark, and stubbornly on the writer's side.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          I wrote this profile text as a placeholder — send me your own words and photo and I'll swap them in.
        </p>
      </section>

      <footer className="mt-20 border-t border-border pt-8 text-sm text-muted-foreground">
        <Link to={user ? "/dashboard" : "/auth"} className="text-primary hover:underline">
          {user ? "Open your projects →" : "Create an account →"}
        </Link>
      </footer>
    </main>
  );
}
