import GlobalUILayout from "@/components/layouts/GlobalUILayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import ContextGate from "@/context/ContextGate";


interface OrganizationLayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string }>;
}

export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const { organizationSlug } = await params;

  return (
    <ProtectedRoute>
      <ContextGate slug={organizationSlug}>
        <GlobalUILayout slug={organizationSlug}>
          {children}
        </GlobalUILayout>
      </ContextGate>
    </ProtectedRoute>
  );
}