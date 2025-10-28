// Defines the structure for a single lesson, including user progress
export interface Lesson {
  id: number;
  title: string;
  content: string;
  video_link: string | null;
  estimated_duration_minutes: number;
  is_completed: boolean;
  last_watched_timestamp: number;
}

// Defines the structure for a module, which contains lessons
export interface Module {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

// Defines the complete data structure for the course learning page
export interface CourseLearningData {
  title: string;
  slug: string;
  modules: Module[];
}