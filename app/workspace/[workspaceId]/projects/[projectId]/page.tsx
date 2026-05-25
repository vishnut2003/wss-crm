import type { Metadata } from "next";
import { LayoutDashboardIcon } from "lucide-react";
import SectionPlaceholder from "./_components/section-placeholder";

export const metadata: Metadata = {
  title: "Project Overview — WSS CRM",
};

export default function ProjectOverviewPage() {
  return (
    <SectionPlaceholder
      icon={LayoutDashboardIcon}
      title="Project overview"
      description="This is where the project's summary, progress and activity will live. It's empty for now."
    />
  );
}
