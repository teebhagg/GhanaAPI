export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} GhanaAPI</span>
        <a
          className="link"
          href="https://ghana-api.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          ghana-api.dev
        </a>
      </div>
    </footer>
  )
}
