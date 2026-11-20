import { ChevronRight, Copy } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function highlight(json: string): ReactNode[] {
  const token =
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of json.matchAll(token)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(json.slice(last, idx));
    const [text, str, colon, lit, num] = m;
    let cls = "";
    if (str && colon) cls = "text-foreground";
    else if (str) cls = "text-primary-ink";
    else if (lit) cls = "text-chart-4";
    else if (num) cls = "text-chart-2";
    out.push(
      <span key={i++} className={cls}>
        {text}
      </span>,
    );
    last = idx + text.length;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}

export function ResponseViewer({
  data,
  title = "Response",
  defaultOpen = true,
  className,
}: {
  data: unknown;
  title?: string;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const json = useMemo(() => JSON.stringify(data, null, 2) ?? "", [data]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      toast.success("Response copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className={cn("rounded-md border bg-card", className)}>
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
          />
          {title}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Copy response"
          onClick={copy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
      {open && (
        <pre className="max-h-96 overflow-auto p-3 font-mono text-xs leading-relaxed">
          <code>{highlight(json)}</code>
        </pre>
      )}
    </div>
  );
}
