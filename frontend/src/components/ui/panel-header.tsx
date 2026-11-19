import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
    <div className="inline-flex max-w-full items-center gap-1 rounded-md border bg-card py-0.5 pl-2.5 pr-0.5 font-mono text-xs">
      <span className="text-primary">GET</span>
      <span className="truncate text-muted-foreground">/api/v1{path}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Copy endpoint URL"
        onClick={copy}>
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
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
    <header className="space-y-3 border-b pb-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h1>
      <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
        {description}
      </p>
      {endpoint && <EndpointChip path={endpoint} />}
    </header>
  );
}
