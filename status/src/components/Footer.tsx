import { ExternalLink, FileText, Github, Globe, Play } from 'lucide-react'
import { Button } from './ui/button'

export default function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} GhanaAPI</span>
            <span>•</span>
            <span>Status Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              asChild
            >
              <a
                href="https://github.com/teebhagg/GhanaAPI"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              asChild
            >
              <a
                href="https://docs.ghana-api.dev"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Documentation"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documentation</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              asChild
            >
              <a
                href="https://ghana-api.dev"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="API Explorer"
              >
                <Globe className="h-3 w-3" />
                <span className="hidden sm:inline">API Explorer</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              asChild
            >
              <a
                href="https://api.ghana-api.dev/docs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="API Playground (Swagger)"
              >
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">API Playground</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}

