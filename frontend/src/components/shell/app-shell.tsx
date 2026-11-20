import { Outlet } from "react-router-dom";

import { Footer } from "@/components/shell/footer";
import { TopBar } from "@/components/shell/top-bar";

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-4 md:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
