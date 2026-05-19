import type { Metadata } from "next";
import type { WorkspaceColor } from "@/lib/workspace";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import DashboardLayout from "@/layouts/dashboard-layout";
import ProposalsChat, {
  type ProposalConversation,
} from "./_components/proposals-chat";

export const metadata: Metadata = {
  title: "Proposals — WSS CRM",
};

type ProposalsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

const seedConversations: ProposalConversation[] = [
  {
    id: "acme-q3",
    title: "Acme — Q3 retainer proposal",
    preview: "Drafted scope, deliverables, and a tiered pricing table.",
    updatedAt: "2h ago",
    messages: [
      {
        id: "m1",
        role: "assistant",
        body: "Hi! I can help you draft a proposal for Acme. What's the engagement type — fixed scope, retainer, or T&M?",
      },
      {
        id: "m2",
        role: "user",
        body: "Retainer. 3 months, web + paid social. Budget around ₹4L/month.",
      },
      {
        id: "m3",
        role: "assistant",
        body: "Got it. Here's a starting outline:\n\n1. Executive summary\n2. Scope of work — web (CMS, landing pages) + paid social (Meta, LinkedIn)\n3. Team & cadence (weekly syncs, monthly reviews)\n4. Investment: ₹4,00,000 / month × 3\n5. Terms & milestones\n\nWant me to expand the scope section?",
      },
    ],
  },
  {
    id: "hooli-pricing",
    title: "Hooli — pricing comparison",
    preview: "Compared 3 packages with feature matrix.",
    updatedAt: "Yesterday",
    messages: [
      {
        id: "m1",
        role: "assistant",
        body: "Happy to help build out the Hooli pricing comparison. Which tiers should I include?",
      },
    ],
  },
  {
    id: "pied-piper-saas",
    title: "Pied Piper — SaaS onboarding",
    preview: "Outlined a 6-week implementation plan.",
    updatedAt: "Mar 14",
    messages: [
      {
        id: "m1",
        role: "assistant",
        body: "I can structure a 6-week SaaS onboarding proposal. Are we starting from discovery or do you already have requirements?",
      },
    ],
  },
];

export default async function ProposalsPage({ params }: ProposalsPageProps) {
  const { workspaceId } = await params;

  const { session, workspace: doc, role } = await requireWorkspaceAccess({
    workspaceId,
    allowedRoles: ["owner", "admin", "sales_manager", "sales_executive"],
  });

  const workspace = {
    id: String(doc._id),
    name: doc.name,
    color: doc.color as WorkspaceColor,
    role,
  };

  const userName = session.user.name ?? session.user.email ?? "you";
  const userInitial = userName.trim().charAt(0).toUpperCase() || "?";

  return (
    <DashboardLayout
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      workspace={workspace}
      compactSidebar
      fullBleed
    >
      <ProposalsChat
        conversations={seedConversations}
        userName={userName}
        userImage={session.user.image ?? null}
        userInitial={userInitial}
        workspaceName={workspace.name}
      />
    </DashboardLayout>
  );
}
