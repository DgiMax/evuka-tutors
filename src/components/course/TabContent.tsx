"use client";

import React, { useState, useEffect } from "react";
import type { TabType } from "./CourseTabs";

interface Lesson {
  id: number;
  title: string;
  content: string;
  resources?: { links?: string[]; files?: string[] };
}

interface Course {
  long_description?: string;
  learning_objectives?: string[];
}

interface TabContentProps {
  activeTab: TabType;
  course: Course | null;
  activeLesson: Lesson | null;
}

const TabContent = ({ activeTab, course, activeLesson }: TabContentProps) => {
  // --- Q&A State ---
  const [questions, setQuestions] = useState<{ q: string; a?: string }[]>([
    { q: "How do I mix these colors correctly?", a: "Try using a 1:1 ratio to start and adjust gradually." },
    { q: "Can I reuse leftover paint?", a: "Yes, store it in an airtight container and stir before use." },
  ]);
  const [newQuestion, setNewQuestion] = useState("");

  // --- Notes State ---
  const [notes, setNotes] = useState("");
  useEffect(() => {
    const saved = localStorage.getItem("course_notes");
    if (saved) setNotes(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("course_notes", notes);
  }, [notes]);

  // --- Announcements ---
  const announcements = [
    {
      title: "New Lesson Added 🎉",
      body: "We’ve just uploaded a new tutorial on color blending. Check it out under the 'Overview' tab.",
      date: "Nov 5, 2025",
    },
    {
      title: "Live Q&A Session",
      body: "Join our live Q&A on Zoom this Friday at 5PM. Bring your toughest paint questions!",
      date: "Nov 8, 2025",
    },
  ];

  const content: Record<TabType, React.ReactNode> = {
    Overview: (
      <div>
        {activeLesson ? (
          <>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{activeLesson.title}</h3>

            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {activeLesson.content || "No content available for this lesson."}
            </div>

            {activeLesson.resources && (
              <div className="mt-6">
                <h4 className="text-xl font-semibold mb-2 text-gray-900">Resources</h4>
                <ul className="list-disc list-inside text-[#2694C6] space-y-1">
                  {activeLesson.resources.links?.map((link, i) => (
                    <li key={`link-${i}`}>
                      <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {link}
                      </a>
                    </li>
                  ))}
                  {activeLesson.resources.files?.map((file, i) => (
                    <li key={`file-${i}`}>
                      <a href={file} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Download File
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-700">Select a lesson to preview its content.</p>
        )}
      </div>
    ),

    "Q&A": (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">Ask a Question</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Type your question..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2694C6]"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <button
              onClick={() => {
                if (newQuestion.trim()) {
                  setQuestions([{ q: newQuestion }, ...questions]);
                  setNewQuestion("");
                }
              }}
              className="bg-[#2694C6] text-white rounded-xl px-5 py-2 hover:bg-[#1c7aa4]"
            >
              Post
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-xl font-semibold text-gray-800 mb-2">Recent Questions</h4>
          <ul className="space-y-4">
            {questions.map((item, i) => (
              <li key={i} className="border border-gray-200 rounded-xl p-3">
                <p className="font-medium text-gray-900">💬 {item.q}</p>
                {item.a && <p className="text-gray-600 mt-1 text-sm">🟢 {item.a}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),

    Notes: (
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-3">My Notes</h3>
        <textarea
          className="w-full min-h-[250px] border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-[#2694C6] outline-none resize-none"
          placeholder="Write your notes here... (auto-saves)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <p className="text-sm text-gray-500 mt-1">Your notes are saved automatically on this device.</p>
      </div>
    ),

    Announcements: (
      <div className="space-y-4">
        {announcements.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition">
            <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
            <p className="text-gray-700 mt-1">{item.body}</p>
            <p className="text-sm text-gray-500 mt-2">{item.date}</p>
          </div>
        ))}
      </div>
    ),
  };

  return <div className="p-4 md:p-8 bg-white rounded-xl">{content[activeTab]}</div>;
};

export default TabContent;
