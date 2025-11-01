// components/events/EventAgenda.tsx
"use client";

import React, { useState } from "react";

type AgendaItem = {
  title: string;
  description: string;
};

export const EventAgenda = ({ agenda }: { agenda: AgendaItem[] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) =>
    setOpenIndex(openIndex === index ? null : index);

  if (!agenda?.length) {
    return (
        <p>No agenda provided for this event.</p>
    );
  }

  return (
      <div className="space-y-4">
        {agenda.map((item, index) => (
          <div key={index} className="border border-gray-100 rounded">
            <button
              onClick={() => toggle(index)}
              className="w-full flex justify-between items-center px-4 py-3 text-left font-medium text-gray-800 hover:bg-gray-50"
            >
              <span>{item.title}</span>
              <svg
                className={`w-5 h-5 transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 text-gray-700 text-sm border-t border-gray-100 bg-gray-50">
                <p className="pt-2">{item.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
  );
};
