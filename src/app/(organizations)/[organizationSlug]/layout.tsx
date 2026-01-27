import GlobalUILayout from "@/components/layouts/GlobalUILayout";
import ProtectedRoute from "@/components/ProtectedRoute";

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
      <GlobalUILayout slug={organizationSlug}>
        {children}
      </GlobalUILayout>
    </ProtectedRoute>
  );
}