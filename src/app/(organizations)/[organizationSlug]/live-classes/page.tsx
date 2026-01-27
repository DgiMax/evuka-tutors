import AllLiveClassesClient from "@/components/live/AllLiveClassesClient";
import { Suspense } from "react";

export const metadata = {
  title: "All Live Classes",
};

export default function OrgAllLiveClassesPage() {
  return (
    // The client component will detect the orgSlug from the URL
    <Suspense fallback={<div>Loading...</div>}>
      <AllLiveClassesClient />
    </Suspense>
  );
}