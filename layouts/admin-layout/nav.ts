import type { ComponentType, SVGProps } from "react";
import { LayoutDashboardIcon } from "lucide-react";

export type NavItem = {
  // Absolute path. Active when pathname matches exactly or is a descendant —
  // set `exact` to only highlight on the exact pathname (used for overview
  // routes that share a prefix with sub-pages).
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
  exact?: boolean;
};

export type NavSection = {
  heading: string;
  items: NavItem[];
};

// Single-section nav for now. New admin sub-pages get added here.
export const navSections: NavSection[] = [
  {
    heading: "Admin",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboardIcon,
        exact: true,
      },
    ],
  },
];
