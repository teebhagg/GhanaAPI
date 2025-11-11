import type { ReactNode } from "react";

interface FeaturePageProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function FeaturePage({ title, description, children }: FeaturePageProps) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header className="space-y-3 text-center md:text-left">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">{description}</p>
      </header>
      <div className="rounded-3xl border bg-card/60 p-4 shadow-sm backdrop-blur md:p-6">
        {children}
      </div>
    </section>
  );
}
