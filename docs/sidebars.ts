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
        "api/exchange-rates",
        "api/locations",
        "api/transport",
      ],
    },
    {
      type: "category",
      label: "Contributing",
      items: [
        "contributing/overview",
        "contributing/addresses",
        "contributing/exchange-rates",
        "contributing/locations",
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
