import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  FileText,
  Github,
  Globe,
  Layers,
  MapPin,
  Menu,
  Navigation,
  Play,
  TrendingUp,
} from "lucide-react";

export function Navbar() {
  const { scrollToSection } = useSmoothScroll();

  return (
    <motion.nav
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <motion.div
          className="flex items-center space-x-3 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          onClick={() => {
            if (window.location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.location.href = "/";
            }
          }}>
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-background border border-border">
            <img
              src="/ghana-api.jpeg"
              alt="GhanaAPI Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-xl">GhanaAPI</span>
        </motion.div>

        <div className="flex items-center space-x-2">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 px-4">
              <SheetHeader>
                <SheetTitle>GhanaAPI Features</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    API Features
                  </h3>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => scrollToSection("addresses")}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Address Lookup & Validation
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => scrollToSection("banking")}>
                    <Building2 className="w-4 h-4 mr-2" />
                    Bank & ATM Locator
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => scrollToSection("locations")}>
                    <Globe className="w-4 h-4 mr-2" />
                    Regions & Districts
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => scrollToSection("transport")}>
                    <Navigation className="w-4 h-4 mr-2" />
                    Transport & Routes
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => scrollToSection("fx")}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Currency Exchange
                  </Button>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Resources
                  </h3>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild>
                    <a
                      href="https://github.com/teebhagg/GhanaAPI"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub Repository (opens in new tab)">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub Repository
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild>
                    <a href="https://docs.ghana-api.dev">
                      <FileText className="w-4 h-4 mr-2" />
                      Documentation
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild>
                    <a
                      href="https://api.ghana-api.dev/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="API Playground (opens in new tab)">
                      <Play className="w-4 h-4 mr-2" />
                      API Playground
                    </a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Features
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => scrollToSection("addresses")}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Address Lookup & Validation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => scrollToSection("banking")}>
                  <Building2 className="w-4 h-4 mr-2" />
                  Bank & ATM Locator
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => scrollToSection("locations")}>
                  <Globe className="w-4 h-4 mr-2" />
                  Regions & Districts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => scrollToSection("transport")}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Transport & Routes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => scrollToSection("fx")}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Currency Exchange
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Right Side Links */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/teebhagg/GhanaAPI"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository (opens in new tab)">
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://docs.ghana-api.dev">
                <FileText className="w-4 h-4" />
                Docs
              </a>
            </Button>
            <Button size="sm" asChild>
              <a
                href="https://api.ghana-api.dev/docs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="API Playground (opens in new tab)">
                <Play className="w-4 h-4" />
                Get Started
              </a>
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
