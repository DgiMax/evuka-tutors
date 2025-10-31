// ---------- LESSON ----------
export interface Lesson {
  id: number;
  title: string;
  content?: string;
  video_link?: string | null;
  estimated_duration_minutes?: number;
}

// ---------- MODULE ----------
export interface Module {
  id: number;
  title: string;
  order?: number;
  lessons: Lesson[];
}

// ---------- COURSE ----------
export interface CoursePreviewData {
  id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string | null;
  category?: string;
  status?: string;
  modules: Module[];
}
