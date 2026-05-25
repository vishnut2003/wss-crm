import type { Metadata } from "next";
import { Flag } from "lucide-react";
import SectionPlaceholder from "../_components/section-placeholder";

export const metadata: Metadata = {
  title: "Project Milestones — WSS CRM",
};

export default function ProjectMilestonesPage() {
  return (
    <SectionPlaceholder
      icon={Flag}
      title="Milestones"
      description="Plan milestones and key dates for this project. This section is coming soon."
    />
  );
}
