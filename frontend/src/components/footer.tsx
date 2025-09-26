import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import {
  Activity,
  Building2,
  DollarSign,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Mail,
  MapPin,
  Navigation,
  Play,
} from "lucide-react";

export function Footer() {
  const { scrollToSection } = useSmoothScroll();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="space-y-4">
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => {
                if (window.location.pathname === "/") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  window.location.href = "/";
                }
              }}>
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-background border border-border group-hover:scale-105 transition-transform">
                <img
                  src="/ghana-api.jpeg"
                  alt="GhanaAPI Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-xl">GhanaAPI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Comprehensive API services for Ghana including addresses,
              locations, transport directions, and real-time exchange rates.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://github.com/teebhagg/GhanaAPI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="mailto:support@ghana-api.dev"
                  className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact
                </a>
              </Button>
            </div>
          </div>

          {/* API Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">API Features</h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection("addresses")}
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground">
                <MapPin className="w-4 h-4 mr-2" />
                Address Lookup & Validation
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection("banking")}
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground">
                <Building2 className="w-4 h-4 mr-2" />
                Bank & ATM Locator
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection("stocks")}
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground">
                <Activity className="w-4 h-4 mr-2" />
                Stock Market Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection("locations")}
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground">
                <Globe className="w-4 h-4 mr-2" />
                Regions & Districts
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection("transport")}
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground">
                <Navigation className="w-4 h-4 mr-2" />
                Transport & Routes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection("fx")}
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground">
                <DollarSign className="w-4 h-4 mr-2" />
                Currency Exchange
              </Button>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Resources</h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                asChild>
                <a href="https://docs.ghana-api.dev">
                  <FileText className="w-4 h-4 mr-2" />
                  Documentation
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                asChild>
                <a
                  href="https://api.ghana-api.dev/docs"
                  target="_blank"
                  rel="noopener noreferrer">
                  <Play className="w-4 h-4 mr-2" />
                  API Playground
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                asChild>
                <a
                  href="https://github.com/teebhagg/GhanaAPI/issues"
                  target="_blank"
                  rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  Report Issues
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                asChild>
                <a href="/">
                  <FileText className="w-4 h-4 mr-2" />
                  Getting Started
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                asChild>
                <a
                  href="https://github.com/teebhagg/GhanaAPI/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer">
                  <FileText className="w-4 h-4 mr-2" />
                  README
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                asChild>
                <a
                  href="https://github.com/teebhagg/GhanaAPI/releases"
                  target="_blank"
                  rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  Releases
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                asChild>
                <a
                  href="https://github.com/teebhagg/GhanaAPI/blob/main/CHANGELOG.md"
                  target="_blank"
                  rel="noopener noreferrer">
                  <FileText className="w-4 h-4 mr-2" />
                  Changelog
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-12" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} GhanaAPI. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Built with ❤️ for Ghana's digital ecosystem
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <a
              href="/privacy"
              className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <a
              href="/api-terms"
              className="hover:text-foreground transition-colors">
              API Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
