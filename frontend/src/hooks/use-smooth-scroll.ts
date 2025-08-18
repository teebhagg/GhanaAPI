import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useSmoothScroll() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = useCallback(
    (sectionId: string) => {
      // If we're not on the home page, navigate there first
      if (location.pathname !== "/") {
        navigate(`/#${sectionId}`);
        return;
      }

      // If we're already on the home page, just scroll to the section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    },
    [navigate, location.pathname]
  );

  return { scrollToSection };
}
