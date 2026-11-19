import type { ReactNode } from "react";

import { PanelHeader } from "@/components/ui/panel-header";

interface FeaturePageProps {
  title: string;
  description: string;
  endpoint?: string;
  children: ReactNode;
}

export function FeaturePage({
  title,
  description,
  endpoint,
  children,
}: FeaturePageProps) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PanelHeader
        title={title}
        description={description}
        endpoint={endpoint}
      />
      {children}
    </section>
  );
}
