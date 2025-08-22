// Google Analytics initialization
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: [command: string, ...params: any[]]) => void;
  }
}

export function initializeGA() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn("Google Analytics measurement ID not found");
    return;
  }

  // Create and append the gtag script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: any[]) => {
    window.dataLayer.push(args);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId);
}
