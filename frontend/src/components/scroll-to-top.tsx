import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Check if footer is visible
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) {
      setFooterVisible(footer.offsetHeight > 0);
    }
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn("fixed bottom-24 md:bottom-6 right-6 z-50", {
            "bottom-24": footerVisible,
          })}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}>
          <Button
            onClick={scrollToTop}
            size="sm"
            className="w-12 h-12 rounded-full shadow-lg bg-primary hover:bg-primary/90">
            <ChevronUp className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
