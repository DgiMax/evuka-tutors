import TutorLiveStudio from "@/components/live/TutorLiveStudio";

export default function LiveEventPage({ params }: { params: { slug: string } }) {
  return <TutorLiveStudio idOrSlug={params.slug} type="event" />;
}