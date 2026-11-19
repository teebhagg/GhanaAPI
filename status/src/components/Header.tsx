export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
        <a
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-semibold whitespace-nowrap"
        >
          <img
            src="/ghana-api.jpeg"
            alt=""
            width={24}
            height={24}
            className="size-6 rounded-full"
          />
          <span className="tracking-tight">GhanaAPI</span>
          <span className="text-muted-foreground font-normal">Status</span>
        </a>
        <nav className="flex shrink-0 items-center gap-4 sm:gap-5 text-sm text-muted-foreground">
          <a
            className="link"
            href="https://docs.ghana-api.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
          <a
            className="link hidden sm:inline"
            href="https://api.ghana-api.dev/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Playground
          </a>
          <a
            className="link"
            href="https://github.com/teebhagg/GhanaAPI"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}
