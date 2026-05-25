import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import SectionPlaceholder from "../_components/section-placeholder";

export const metadata: Metadata = {
  title: "Project Files — WSS CRM",
};

export default function ProjectFilesPage() {
  return (
    <SectionPlaceholder
      icon={FolderOpen}
      title="Files"
      description="Share and organise files for this project. This section is coming soon."
    />
  );
}
