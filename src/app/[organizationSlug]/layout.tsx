// app/(dashboard)/[organizationSlug]/layout.tsx
import GlobalUILayout from "@/components/layouts/GlobalUILayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  console.log(organizationSlug)

  return (
    <ProtectedRoute>
      <GlobalUILayout slug={organizationSlug}>{children}</GlobalUILayout>
    </ProtectedRoute>
  );
}
