import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
  title: "GhanaAPI Documentation",
  tagline: "The definitive REST API for Ghanaian services",
  favicon: "img/ghana-api.jpeg",

  // Set the production url of your site here
  url: "https://docs.ghana-api.dev",
  baseUrl: "/",

  // GitHub pages deployment config
  organizationName: "teebhagg",
  projectName: "GhanaAPI",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/teebhagg/GhanaAPI/tree/main/docs/",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/ghana-api.jpeg",
    navbar: {
      title: "GhanaAPI",
      logo: {
        alt: "GhanaAPI Logo",
        src: "img/ghana-api.jpeg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://api.ghana-api.dev/docs",
          label: "API Reference",
          position: "left",
        },
        {
          href: "https://status.ghana-api.dev",
          label: "Status",
          position: "right",
        },
        {
          href: "https://github.com/teebhagg/GhanaAPI",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Getting Started",
              to: "/docs/intro",
            },
            {
              label: "API Reference",
              href: "https://api.ghana-api.dev/docs",
            },
          ],
        },
        {
          title: "Contact",
          items: [
            {
              label: "LinkedIn",
              href: "https://www.linkedin.com/in/joshua-ansah-b0a15a230/",
            },
            {
              label: "Email",
              href: "mailto:joshua.albert.ansah@gmail.com",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/teebhagg/GhanaAPI",
            },
            {
              label: "Status Page",
              href: "https://status.ghana-api.dev",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} GhanaAPI. Built with ❤️ for the Ghanaian developer community. Made in Ghana 🇬🇭`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: [
        "bash",
        "json",
        "javascript",
        "typescript",
        "python",
        "php",
      ],
    },
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    algolia: {
      // You'll need to set these up later
      appId: "YOUR_APP_ID",
      apiKey: "YOUR_SEARCH_API_KEY",
      indexName: "ghana-api",
      contextualSearch: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
