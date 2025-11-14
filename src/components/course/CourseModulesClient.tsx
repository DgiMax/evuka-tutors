"use client";

import { useState } from "react";

const ChevronDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
    <path
      fill="#000"
      d="M12.707 15.707a1 1 0 0 1-1.414 0L5.636 10.05A1 1 0 1 1 7.05 8.636l4.95 4.95 4.95-4.95a1 1 0 0 1 1.414 1.414z"
    />
  </svg>
);

type Lesson = {
  title: string;
  is_preview: boolean;
  estimated_duration_minutes: number;
};

type Module = {
  title: string;
  description: string;
  lessons_count: number;
  lessons: Lesson[];
};

export const CourseModulesClient = ({ modules }: { modules: Module[] }) => {
  const [openModule, setOpenModule] = useState<number | null>(null);

  return (
    <section className="border border-gray-200 rounded-md p-6 my-8">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Course Modules</h2>

      {modules && modules.length > 0 ? (
        <div className="border rounded">
          {modules.map((module, index) => (
            <div key={index} className="border-b last:border-b-0">
              <button
                type="button"
                onClick={() =>
                  setOpenModule(openModule === index ? null : index)
                }
                className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50"
              >
                <span className="font-semibold text-gray-800">
                  {module.title} ({module.lessons_count || 0} Lessons)
                </span>
                <ChevronDownIcon
                  className={`w-5 h-5 transform transition-transform text-gray-500 ${
                    openModule === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openModule === index && (
                <div className="p-4 pt-0 text-gray-600 space-y-3">
                  <p className="text-sm mb-2">
                    {module.description || "No description available."}
                  </p>

                  {module.lessons && module.lessons.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {module.lessons.map((lesson, i) => (
                        <li key={i}>
                          <span className="font-medium">{lesson.title}</span>{" "}
                          <span className="text-gray-500 text-sm">
                            ({lesson.estimated_duration_minutes || 0} min)
                          </span>
                          {lesson.is_preview && (
                            <span className="ml-2 text-xs font-semibold text-[#2694C6]">
                              Preview
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No lessons available.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No modules available.</p>
      )}
    </section>
  );
};
