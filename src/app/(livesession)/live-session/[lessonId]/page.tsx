import TutorLiveStudio from "@/components/live/TutorLiveStudio";

export default function LiveClassPage({ params }: { params: { lessonId: string } }) {
  return <TutorLiveStudio idOrSlug={params.lessonId} type="lesson" />;
}