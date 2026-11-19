import { Menu } from "lucide-react";
import { useState } from "react";

import { NavList } from "@/components/shell/nav-list";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 px-3">
        <SheetHeader>
          <SheetTitle>GhanaAPI</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate between API sections
          </SheetDescription>
        </SheetHeader>
        <NavList onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
