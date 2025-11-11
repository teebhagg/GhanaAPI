import { motion } from "framer-motion";
import {
  Banknote,
  BookText,
  Building2,
  DollarSign,
  Home,
  Landmark,
  MapPinned,
  Route,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

// import { Footer } from "@/components/footer";
import { HeroGlobe } from "@/components/hero-globe";
// import { Navbar } from "@/components/navbar";
import { Dock, DockIcon } from "@/components/ui/dock";
import { cn } from "@/lib/utils";

const dockItems = [
  { to: "/", label: "Overview", icon: <Home className="h-5 w-5" /> },
  {
    to: "/addresses",
    label: "Addresses",
    icon: <MapPinned className="h-5 w-5" />,
  },
  { to: "/banking", label: "Banking", icon: <Banknote className="h-5 w-5" /> },
  { to: "/stocks", label: "Stocks", icon: <Landmark className="h-5 w-5" /> },
  {
    to: "/locations",
    label: "Locations",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    to: "/exchange",
    label: "Exchange",
    icon: <DollarSign className="h-5 w-5" />,
  },
  { to: "/transport", label: "Transport", icon: <Route className="h-5 w-5" /> },
  { to: "/docs", label: "Docs", icon: <BookText className="h-5 w-5" /> },
];

export function AppDockLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <main className="relative flex-1 pb-32">
        {isHome && (
          <header className="relative overflow-hidden pb-12 pt-16">
            <div className="container mx-auto flex flex-col items-center gap-6 px-6 text-center">
              <div className="max-w-2xl space-y-3">
                <motion.h1
                  className="text-4xl font-semibold tracking-tight md:text-5xl"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}>
                  GhanaAPI Explorer
                </motion.h1>
                <motion.p
                  className="text-muted-foreground text-base md:text-lg"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}>
                  Discover Ghana's digital infrastructure through dedicated
                  experiences for addresses, banking, logistics, markets, and
                  more.
                </motion.p>
              </div>
              <HeroGlobe />
            </div>
          </header>
        )}

        <div className="container mx-auto px-6 py-12">
          <Outlet />
        </div>
      </main>

      <nav className="pointer-events-none fixed bottom-6 left-0 right-0 z-40 flex justify-center px-6">
        <Dock
          direction="middle"
          iconSize={44}
          iconMagnification={56}
          className="pointer-events-auto">
          {dockItems.map((item) => (
            <DockIcon key={item.to} className="group relative">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex h-full w-full items-center justify-center rounded-full text-sm transition-colors",
                    isActive
                      ? "bg-primary p-2 text-primary-foreground shadow-lg"
                      : "bg-background/90 p-2 text-foreground shadow-sm hover:bg-muted"
                  )
                }
                aria-label={item.label}>
                {item.icon}
              </NavLink>
              <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-full bg-foreground/90 px-2 py-0.5 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </DockIcon>
          ))}
        </Dock>
      </nav>
    </div>
  );
}
