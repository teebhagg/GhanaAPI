import {
  Banknote,
  DollarSign,
  GraduationCap,
  Landmark,
  LayoutList,
  MapPinned,
  Route,
  type LucideIcon,
} from "lucide-react";

export interface Section {
  to: string;
  label: string;
  description: string;
  endpoint: string;
  icon: LucideIcon;
}

export const overviewSection = {
  to: "/",
  label: "Overview",
  icon: LayoutList,
};

export const sections: Section[] = [
  {
    to: "/addresses",
    label: "Addresses",
    description:
      "Validate GhanaPost GPS addresses, explore regions and districts, reverse-geocode coordinates.",
    endpoint: "/addresses",
    icon: MapPinned,
  },
  {
    to: "/banking",
    label: "Banking",
    description:
      "Banks, branches and ATM locations with service metadata.",
    endpoint: "/banking",
    icon: Banknote,
  },
  {
    to: "/stocks",
    label: "Stocks",
    description: "Ghana Stock Exchange listings, prices and market summaries.",
    endpoint: "/stock-market",
    icon: Landmark,
  },
  {
    to: "/exchange",
    label: "Exchange",
    description:
      "Currency exchange rates, conversion and historical series.",
    endpoint: "/exchange-rates",
    icon: DollarSign,
  },
  {
    to: "/transport",
    label: "Transport",
    description:
      "Intercity routes, transit stops and journey time estimates.",
    endpoint: "/transport",
    icon: Route,
  },
  {
    to: "/education",
    label: "Education",
    description: "Schools, categories and regional education statistics.",
    endpoint: "/education",
    icon: GraduationCap,
  },
];

export const externalLinks = {
  github: "https://github.com/teebhagg/GhanaAPI",
  docs: "https://docs.ghana-api.dev",
  playground: "https://api.ghana-api.dev/docs",
  apiBase: "https://api.ghana-api.dev/api/v1",
};
