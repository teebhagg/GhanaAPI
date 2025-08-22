import { Button } from "@/components/ui/button";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { motion } from "framer-motion";
import { FileText, Globe, MapPin, Play, TrendingUp } from "lucide-react";

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

        <div className="hidden md:flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollToSection("addresses")}
            className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Address Lookup
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollToSection("locations")}
            className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Regions & Districts
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollToSection("fx")}
            className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Currency Exchange
          </Button>
        </div>

        <div className="flex items-center space-x-3">
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
              rel="noopener noreferrer">
              <Play className="w-4 h-4" />
              Get Started
            </a>
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
