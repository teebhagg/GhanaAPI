import { ArrowRightIcon } from "@radix-ui/react-icons";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  className: string;
  background: ReactNode;
  Icon: React.ElementType;
  description: string;
  href?: string;
  to?: string;
  cta: string;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[16rem] gap-4 sm:grid-cols-2 sm:auto-rows-[16rem] lg:grid-cols-3 md:auto-rows-[18rem]",
        className
      )}
      {...props}>
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href = "#",
  to,
  cta,
  ...props
}: BentoCardProps) => {
  const ActionComponent = (to ? Link : "a") as React.ElementType;
  const actionProps = (to ? { to } : { href }) as Record<string, unknown>;

  const CTAButton = (
    <Button
      variant="link"
      asChild
      size="sm"
      className="pointer-events-auto p-0">
      <ActionComponent {...actionProps}>
        {cta}
        <ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" />
      </ActionComponent>
    </Button>
  );

  return (
    <div
      key={name}
      className={cn(
        "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl",
        "bg-card/95 shadow-sm ring-1 ring-border/60 transition duration-300",
        "dark:bg-card/90 dark:shadow-lg/10 dark:ring-border/40",
        "hover:shadow-xl hover:ring-primary/40",
        className
      )}
      {...props}>
      <div>{background}</div>
      <div className="p-4">
        <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-10">
          <Icon className="h-12 w-12 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75" />
          <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">
            {name}
          </h3>
          <p className="max-w-lg text-neutral-400">{description}</p>
        </div>

        <div
          className={cn(
            "pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:hidden"
          )}>
          {CTAButton}
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute bottom-0 hidden w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex"
        )}>
        {CTAButton}
      </div>

      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10" />
    </div>
  );
};

export { BentoCard, BentoGrid };
