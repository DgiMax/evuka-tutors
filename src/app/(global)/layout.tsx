import { ReactNode } from "react";
import GlobalUILayout from "@/components/layouts/GlobalUILayout";
import ProtectedRoute from "@/components/ProtectedRoute";

interface GlobalLayoutProps {
  children: ReactNode;
}

export default async function GlobalLayout({ children }: GlobalLayoutProps) {
  return (
    <ProtectedRoute>
      <GlobalUILayout slug={null}>
        {children}
      </GlobalUILayout>
    </ProtectedRoute>
  );
}