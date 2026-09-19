import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  title: ReactNode;
  description?: string;
  side: "left" | "right";
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function DockPanel({ title, description, side, onClose, children, footer }: Props) {
  return (
    <aside
      className={`flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden bg-card/60 md:w-[22rem] ${
        side === "left" ? "border-r border-border" : "border-l border-border"
      }`}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-serif text-xl">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        <Button variant="ghost" size="icon" className="-mr-2 size-7" aria-label="Close panel" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
      {footer}
    </aside>
  );
}
