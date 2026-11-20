import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { externalLinks } from "@/lib/sections";

export function EndpointChip({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${externalLinks.apiBase}${path}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Endpoint copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy endpoint URL"
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-all hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]">
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Copied" : "Copy endpoint"}
    </button>
  );
}

export function PanelHeader({
  title,
  description,
  endpoint,
}: {
  title: string;
  description: string;
  endpoint?: string;
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-muted-foreground md:text-lg">
          {description}
        </p>
      </div>
      {endpoint && <EndpointChip path={endpoint} />}
    </header>
  );
}
