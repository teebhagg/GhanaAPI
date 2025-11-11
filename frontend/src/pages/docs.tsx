import { FeaturePage } from "@/components/feature-page";
import { Button } from "@/components/ui/button";
import { FileText, Github, Globe } from "lucide-react";

export function DocsFeaturePage() {
  return (
    <FeaturePage
      title="Documentation"
      description="Access guides, reference material, and tooling for every GhanaAPI surface. Full documentation is shipping soon—stay tuned.">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Documentation Hub</h3>
              <p className="text-muted-foreground text-sm">
                Detailed API references, SDK quickstarts, and integration guides
                are in progress.
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            In the meantime explore the production APIs, contribute on GitHub,
            or subscribe for updates. The docs portal will bundle schema
            examples, request/response patterns, and best practices for building
            in Ghana.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <a
                href="https://github.com/teebhagg/GhanaAPI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </Button>
            <Button asChild>
              <a
                href="https://api.ghana-api.dev/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                API Playground
              </a>
            </Button>
          </div>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border bg-background/40 p-6 text-sm shadow-sm">
          <h4 className="text-base font-semibold">Upcoming sections</h4>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>REST and GraphQL endpoint references</li>
            <li>Authentication & rate-limit guides</li>
            <li>SDK examples for TypeScript and Python</li>
            <li>Data freshness and compliance notes</li>
          </ul>
        </div>
      </div>
    </FeaturePage>
  );
}
