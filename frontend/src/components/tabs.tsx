import { type ReactNode, useState } from "react";

type Tab = {
  id: string;
  label: string;
  content: ReactNode;
};

export function Tabs({
  tabs,
  initial = tabs[0]?.id,
}: {
  tabs: Tab[];
  initial?: string;
}) {
  const [active, setActive] = useState(initial);
  return (
    <div className="w-full">
      <div className="flex gap-2 border-b border-border mb-4 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={
              "px-4 py-2 rounded-t-md text-sm transition-colors " +
              (active === t.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent")
            }>
            {t.label}
          </button>
        ))}
      </div>
      <div>{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
