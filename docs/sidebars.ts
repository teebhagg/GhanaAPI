import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    "intro",
    {
      type: "category",
      label: "Getting Started",
      items: ["getting-started/quick-start"],
    },
    {
      type: "category",
      label: "API Documentation",
      items: [
        "api/overview",
        "api/addresses",
        "api/banking",
        "api/exchange-rates",
        "api/locations",
        "api/stock-market",
        "api/transport",
      ],
    },
    {
      type: "category",
      label: "Contributing",
      items: [
        "contributing/overview",
        "contributing/quick-reference",
        "contributing/validation-workflows",
        "contributing/release-management",
        "contributing/addresses",
        "contributing/banking",
        "contributing/exchange-rates",
        "contributing/locations",
        "contributing/stock-market",
        "contributing/transport",
      ],
    },
    {
      type: "category",
      label: "Project Information",
      items: ["CHANGELOG"],
    },
  ],
};

export default sidebars;
