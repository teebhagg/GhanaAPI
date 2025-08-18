import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { Github } from "lucide-react";

export function Footer() {
  const { scrollToSection } = useSmoothScroll();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => {
              if (window.location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                window.location.href = "/";
              }
            }}>
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-background border border-border">
              <img
                src="/ghana-api.jpeg"
                alt="GhanaAPI Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-semibold text-lg">GhanaAPI</span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection("addresses")}
              className="text-sm">
              Address Lookup
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection("locations")}
              className="text-sm">
              Regions & Districts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection("fx")}
              className="text-sm">
              Currency Exchange
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/docs" className="text-sm">
                Documentation
              </a>
            </Button>
          </div>

          {/* GitHub */}
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://github.com/teebhagg/GhanaAPI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </Button>
        </div>

        <Separator className="my-8" />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} GhanaAPI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
