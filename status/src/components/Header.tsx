import { useRouterState } from '@tanstack/react-router'

export default function Header() {
  const router = useRouterState()
  const location = router.location

  const handleBrandClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <button
          type="button"
          className="flex items-center space-x-3"
          onClick={handleBrandClick}
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
            <img
              src="/ghana-api.jpeg"
              alt="GhanaAPI Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold">GhanaAPI</span>
            <span className="text-2xl font-bold text-muted-foreground">•</span>
            <span className="text-lg font-bold text-muted-foreground">Status</span>
          </div>
        </button>
      </div>
    </nav>
  )
}
