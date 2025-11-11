import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Building2,
  DollarSign,
  ExternalLink,
  FileText,
  Github,
  Landmark,
  Mail,
  MapPin,
  Navigation,
  Play,
} from "lucide-react";

const featureLinks = [
  { to: "/addresses", label: "Address Lookup & Validation", icon: MapPin },
  { to: "/banking", label: "Bank & ATM Locator", icon: Building2 },
  { to: "/stocks", label: "Ghana Stock Exchange", icon: Activity },
  { to: "/locations", label: "Regions & Districts", icon: Landmark },
  { to: "/transport", label: "Transport & Routes", icon: Navigation },
  { to: "/exchange", label: "Currency Exchange", icon: DollarSign },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <button
              type="button"
              className="group flex items-center space-x-3"
              onClick={() => {
                if (window.location.pathname === "/") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  window.location.href = "/";
                }
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-background transition-transform group-hover:scale-105">
                <img
                  src="/ghana-api.jpeg"
                  alt="GhanaAPI Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-xl font-bold">GhanaAPI</span>
            </button>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Comprehensive API services for Ghana including addresses, locations, transport directions, and real-time exchange rates.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://github.com/teebhagg/GhanaAPI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="mailto:support@ghana-api.dev"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Contact
                </a>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">API Features</h3>
            <div className="space-y-3">
              {featureLinks.map(({ to, label, icon: Icon }) => (
                <Button
                  key={to}
                  variant="ghost"
                  size="sm"
                  className="flex w-full items-center justify-start gap-2 p-0 text-sm text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link to={to}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resources</h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full items-center justify-start gap-2 p-0 text-sm text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="https://docs.ghana-api.dev">
                  <FileText className="h-4 w-4" />
                  Documentation
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full items-center justify-start gap-2 p-0 text-sm text-muted-foreground hover:text-foreground"
                asChild
              >
                <a
                  href="https://api.ghana-api.dev/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Play className="h-4 w-4" />
                  API Playground
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full items-center justify-start gap-2 p-0 text-sm text-muted-foreground hover:text-foreground"
                asChild
              >
                <a
                  href="https://github.com/teebhagg/GhanaAPI/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  Report Issues
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full items-center justify-start gap-2 p-0 text-sm text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link to="/">
                  <FileText className="h-4 w-4" />
                  Overview
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full items-center justify-start gap-2 p-0 text-sm text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link to="/docs">
                  <FileText className="h-4 w-4" />
                  Docs Preview
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full items-center justify-start gap-2 p-0 text-sm text-muted-foreground hover:text-foreground"
                asChild
              >
                <a
                  href="https://github.com/teebhagg/GhanaAPI/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-4 w-4" />
                  README
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col justify-between gap-4 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} GhanaAPI. Built for the developer community supporting Ghana's digital infrastructure.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href="https://ghana-api.dev/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="https://ghana-api.dev/terms" className="hover:text-foreground">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
