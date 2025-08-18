import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  structuredData?: object;
}

export function SEO({
  title = "GhanaAPI Explorer - Ghana Address, Location & Exchange Rate API",
  description = "Explore Ghana's comprehensive API services for addresses, locations, and real-time exchange rates. Search addresses, validate locations, and get currency conversion data.",
  keywords = "Ghana API, address lookup, geocoding, exchange rates, currency conversion, Ghana locations, Ghana districts, Ghana regions, reverse geocoding",
  image = "https://ghana-api.dev/og-image.png",
  url = "https://ghana-api.dev/",
  type = "website",
  structuredData,
}: SEOProps) {
  // Utility function to update meta tags
  const updateMetaTag = (name: string, content: string) => {
    let meta = document.querySelector(
      `meta[name="${name}"]`
    ) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  // Utility function to update property meta tags
  const updatePropertyTag = (property: string, content: string) => {
    let meta = document.querySelector(
      `meta[property="${property}"]`
    ) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("property", property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update primary meta tags
    updateMetaTag("title", title);
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);

    // Update Open Graph tags
    updatePropertyTag("og:title", title);
    updatePropertyTag("og:description", description);
    updatePropertyTag("og:image", image);
    updatePropertyTag("og:url", url);
    updatePropertyTag("og:type", type);

    // Update Twitter tags
    updatePropertyTag("twitter:title", title);
    updatePropertyTag("twitter:description", description);
    updatePropertyTag("twitter:image", image);
    updatePropertyTag("twitter:url", url);

    // Update canonical URL
    let canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // Add structured data if provided
    if (structuredData) {
      // Remove existing structured data
      const existingScript = document.querySelector(
        'script[type="application/ld+json"]'
      );
      if (existingScript) {
        existingScript.remove();
      }

      // Add new structured data
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      // Reset to default values when component unmounts
      document.title =
        "GhanaAPI Explorer - Ghana Address, Location & Exchange Rate API";
    };
  }, [title, description, keywords, image, url, type, structuredData]);

  return null; // This component doesn't render anything
}

// Default structured data for the main page
export const defaultStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "GhanaAPI Explorer",
  description:
    "Explore Ghana's comprehensive API services for addresses, locations, and real-time exchange rates",
  url: "https://ghana-api.dev/",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  provider: {
    "@type": "Organization",
    name: "GhanaAPI",
    url: "https://ghana-api.dev/",
  },
  featureList: [
    "Address Lookup & Validation",
    "Reverse Geocoding",
    "Ghana Regions & Districts",
    "Real-time Exchange Rates",
    "Currency Conversion",
  ],
};

// Structured data for documentation page
export const docsStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "GhanaAPI Documentation",
  description: "Comprehensive guides and API references for GhanaAPI services",
  url: "https://ghana-api.dev/docs",
  isPartOf: {
    "@type": "WebSite",
    name: "GhanaAPI",
    url: "https://ghana-api.dev/",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://ghana-api.dev/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Documentation",
        item: "https://ghana-api.dev/docs",
      },
    ],
  },
};
