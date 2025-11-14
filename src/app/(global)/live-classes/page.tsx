import AllLiveClassesClient from "@/components/live/AllLiveClassesClient";
import { Suspense } from "react";

export const metadata = {
  title: "All Live Classes",
};

export default function AllLiveClassesPage() {
  return (
    // Use Suspense for good measure as client component will fetch data
    <Suspense fallback={<div>Loading...</div>}>
      <AllLiveClassesClient />
    </Suspense>
  );
}