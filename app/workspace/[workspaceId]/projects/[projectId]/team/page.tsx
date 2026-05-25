import type { Metadata } from "next";
import { Users } from "lucide-react";
import SectionPlaceholder from "../_components/section-placeholder";

export const metadata: Metadata = {
  title: "Project Team — WSS CRM",
};

export default function ProjectTeamPage() {
  return (
    <SectionPlaceholder
      icon={Users}
      title="Team"
      description="Manage who's working on this project. This section is coming soon."
    />
  );
}
