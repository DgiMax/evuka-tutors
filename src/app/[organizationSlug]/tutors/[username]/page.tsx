import TutorPublicProfileClient from "@/components/tutors/TutorPublicProfileClient";
import api from "@/lib/api/axios"; // Use your server-side API instance if different

// --- Interfaces ---
interface Subject {
  name: string;
  slug: string;
}

interface Course {
  slug: string;
  title: string;
  thumbnail: string | null;
  price: number;
  instructor_name: string;
  rating_avg: number;
  num_students: number;
  category: string;
  level: string;
  is_enrolled: boolean;
}

interface TutorProfile {
  display_name: string;
  bio: string;
  profile_image: string | null;
  headline: string;
  intro_video: string | null;
  education: string;
  subjects: Subject[];
  courses: Course[];
  is_verified: boolean;
}

async function getTutorProfile(username: string): Promise<TutorProfile | null> {
  try {
    // Note: Use absolute URL for server-side fetching
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${apiUrl}/users/api/tutors/${username}/`, {
      cache: "no-store", // Or revalidate as needed
    });
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch tutor profile:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { username: string } }) {
  const profile = await getTutorProfile(params.username);
  if (!profile) {
    return { title: "Tutor Not Found" };
  }
  return {
    title: `${profile.display_name}'s Profile`,
    description: profile.headline || profile.bio.substring(0, 150),
  };
}

export default async function TutorPublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const profile = await getTutorProfile(params.username);

  if (!profile) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold">Tutor Not Found</h1>
        <p className="text-gray-600">
          We couldn't find a profile for "{params.username}".
        </p>
      </div>
    );
  }

  return <TutorPublicProfileClient profile={profile} />;
}