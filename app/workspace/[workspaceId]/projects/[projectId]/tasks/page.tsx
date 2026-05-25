import type { Metadata } from "next";
import { ListTodo } from "lucide-react";
import SectionPlaceholder from "../_components/section-placeholder";

export const metadata: Metadata = {
  title: "Project Tasks — WSS CRM",
};

export default function ProjectTasksPage() {
  return (
    <SectionPlaceholder
      icon={ListTodo}
      title="Tasks"
      description="Track tasks and assignments for this project. This section is coming soon."
    />
  );
}
