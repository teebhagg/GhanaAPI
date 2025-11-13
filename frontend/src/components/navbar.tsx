import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
import { motion } from "framer-motion";
import {
  Banknote,
  ChevronDown,
  DollarSign,
  FileText,
  Github,
  GraduationCap,
  Landmark,
  Layers,
  MapPin,
  Menu,
  Navigation,
  Play,
} from "lucide-react";

const featureLinks = [
  { to: "/addresses", label: "Address & Regions Explorer", icon: MapPin },
  { to: "/banking", label: "Bank & ATM Locator", icon: Banknote },
  { to: "/stocks", label: "Ghana Stock Exchange", icon: Landmark },
  { to: "/exchange", label: "Currency Exchange", icon: DollarSign },
  { to: "/transport", label: "Transport & Routes", icon: Navigation },
  { to: "/education", label: "Education Insights", icon: GraduationCap },
];

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleBrandClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const renderFeatureLabel = (label: string) => label;

  return (
    <motion.nav
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <motion.button
          type="button"
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          onClick={handleBrandClick}>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
            <img
              src="/ghana-api.jpeg"
              alt="GhanaAPI Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-xl font-bold">GhanaAPI</span>
        </motion.button>

        <div className="flex items-center space-x-2">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 px-4">
              <SheetHeader>
                <SheetTitle>GhanaAPI Explorer</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    Feature Areas
                  </h3>
                  {featureLinks.map(({ to, label, icon: Icon }) => (
                    <Button
                      key={to}
                      variant="ghost"
                      className="w-full justify-start"
                      asChild>
                      <Link
                        to={to}
                        className="flex items-center"
                        onClick={() => setSheetOpen(false)}>
                        <Icon className="mr-2 h-4 w-4" />
                        {renderFeatureLabel(label)}
                      </Link>
                    </Button>
                  ))}
                </div>

                <div className="space-y-2 border-t pt-4">
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
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
                      aria-label="GitHub Repository">
                      <Github className="mr-2 h-4 w-4" />
                      GitHub Repository
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild>
                    <a href="https://docs.ghana-api.dev">
                      <FileText className="mr-2 h-4 w-4" />
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
                      aria-label="API Playground">
                      <Play className="mr-2 h-4 w-4" />
                      API Playground
                    </a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden items-center space-x-2 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Features
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {featureLinks.map(({ to, label, icon: Icon }) => (
                  <DropdownMenuItem key={to} asChild>
                    <Link to={to} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {renderFeatureLabel(label)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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
      </div>
    </motion.nav>
  );
}
