import type { Metadata } from "next";
import { Settings } from "lucide-react";
import SectionPlaceholder from "../_components/section-placeholder";

export const metadata: Metadata = {
  title: "Project Settings — WSS CRM",
};

export default function ProjectSettingsPage() {
  return (
    <SectionPlaceholder
      icon={Settings}
      title="Settings"
      description="Project settings and configuration will live here. This section is coming soon."
    />
  );
}
