import { SEO, docsStructuredData } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileText, Github, Globe } from "lucide-react";

export function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="GhanaAPI Documentation - API Guides & References"
        description="Comprehensive guides and API references for GhanaAPI services. Learn how to use address lookup, location data, and exchange rate APIs."
        keywords="GhanaAPI documentation, API guides, address API, location API, exchange rate API, Ghana API documentation"
        url="https://ghana-api.dev/docs"
        structuredData={docsStructuredData}
      />
      <main className="flex-1">
        <div className="container mx-auto px-6 py-16">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-6 bg-background border-2 border-border">
              <img
                src="/ghana-api.jpeg"
                alt="GhanaAPI Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
              Documentation
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive guides and API references for GhanaAPI services
            </p>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}>
            {/* Coming Soon Card */}
            <div className="p-12 border rounded-3xl bg-background/50 backdrop-blur-sm text-center mb-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">
                Documentation Coming Soon
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                We're working hard to create comprehensive documentation for all
                GhanaAPI services. This will include detailed guides, API
                references, and code examples.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" asChild>
                  <a
                    href="https://github.com/teebhagg/GhanaAPI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    View on GitHub
                  </a>
                </Button>
                <Button asChild>
                  <a href="/" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Explore API
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
