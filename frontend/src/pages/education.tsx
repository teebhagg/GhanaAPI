import { EducationPanel } from "@/components/education-panel";
import { FeaturePage } from "@/components/feature-page";

export function EducationPage() {
  return (
    <FeaturePage
      title="Education Insights"
      description="Search Ghana Education Service schools by region, category, and performance grade. Explore national statistics and program offerings to build student-focused experiences.">
      <EducationPanel />
    </FeaturePage>
  );
}
