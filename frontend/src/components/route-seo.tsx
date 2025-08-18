import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { defaultStructuredData, docsStructuredData } from "./seo";

function setSEO({
  title,
  description,
  ogTitle,
  ogDescription,
  ogUrl,
  twitterTitle,
  twitterDescription,
  twitterUrl,
  canonicalUrl,
  structuredData,
}: {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterUrl: string;
  canonicalUrl: string;
  structuredData: object;
}) {
  document.title = title;

  const metaDescription = document.querySelector(
    'meta[name="description"]'
  ) as HTMLMetaElement;
  if (metaDescription) {
    metaDescription.content = description;
  }

  const ogTitleTag = document.querySelector(
    'meta[property="og:title"]'
  ) as HTMLMetaElement;
  if (ogTitleTag) {
    ogTitleTag.content = ogTitle;
  }

  const ogDescriptionTag = document.querySelector(
    'meta[property="og:description"]'
  ) as HTMLMetaElement;
  if (ogDescriptionTag) {
    ogDescriptionTag.content = ogDescription;
  }

  const ogUrlTag = document.querySelector(
    'meta[property="og:url"]'
  ) as HTMLMetaElement;
  if (ogUrlTag) {
    ogUrlTag.content = ogUrl;
  }

  const twitterTitleTag = document.querySelector(
    'meta[property="twitter:title"]'
  ) as HTMLMetaElement;
  if (twitterTitleTag) {
    twitterTitleTag.content = twitterTitle;
  }

  const twitterDescriptionTag = document.querySelector(
    'meta[property="twitter:description"]'
  ) as HTMLMetaElement;
  if (twitterDescriptionTag) {
    twitterDescriptionTag.content = twitterDescription;
  }

  const twitterUrlTag = document.querySelector(
    'meta[property="twitter:url"]'
  ) as HTMLMetaElement;
  if (twitterUrlTag) {
    twitterUrlTag.content = twitterUrl;
  }

  const canonicalTag = document.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement;
  if (canonicalTag) {
    canonicalTag.href = canonicalUrl;
  }

  const existingScript = document.querySelector(
    'script[type="application/ld+json"]'
  );
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}

export function RouteSEO() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    if (pathname === "/docs") {
      setSEO({
        title: "GhanaAPI Documentation - API Guides & References",
        description:
          "Comprehensive guides and API references for GhanaAPI services. Learn how to use address lookup, location data, and exchange rate APIs.",
        ogTitle: "GhanaAPI Documentation - API Guides & References",
        ogDescription:
          "Comprehensive guides and API references for GhanaAPI services. Learn how to use address lookup, location data, and exchange rate APIs.",
        ogUrl: "https://ghana-api.dev/docs",
        twitterTitle: "GhanaAPI Documentation - API Guides & References",
        twitterDescription:
          "Comprehensive guides and API references for GhanaAPI services. Learn how to use address lookup, location data, and exchange rate APIs.",
        twitterUrl: "https://ghana-api.dev/docs",
        canonicalUrl: "https://ghana-api.dev/docs",
        structuredData: docsStructuredData,
      });
    } else {
      setSEO({
        title: "GhanaAPI Explorer - Ghana Address, Location & Exchange Rate API",
        description:
          "Explore Ghana's comprehensive API services for addresses, locations, and real-time exchange rates. Search addresses, validate locations, and get currency conversion data.",
        ogTitle: "GhanaAPI Explorer - Ghana Address, Location & Exchange Rate API",
        ogDescription:
          "Explore Ghana's comprehensive API services for addresses, locations, and real-time exchange rates. Search addresses, validate locations, and get currency conversion data.",
        ogUrl: "https://ghana-api.dev/",
        twitterTitle: "GhanaAPI Explorer - Ghana Address, Location & Exchange Rate API",
        twitterDescription:
          "Explore Ghana's comprehensive API services for addresses, locations, and real-time exchange rates.",
        twitterUrl: "https://ghana-api.dev/",
        canonicalUrl: "https://ghana-api.dev/",
        structuredData: defaultStructuredData,
      });
    }
  }, [location]);

  return null; // This component doesn't render anything
}
