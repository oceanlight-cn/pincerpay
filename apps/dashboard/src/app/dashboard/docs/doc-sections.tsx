"use client";

import { useState } from "react";

interface DocSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export function DocSections({ sections }: { sections: DocSection[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(
    sections[0]?.id ?? null
  );

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        const isExpanded = expandedId === section.id;
        return (
          <div
            key={section.id}
            className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : section.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--muted)] transition-colors"
            >
              <span className="font-medium">{section.title}</span>
              <svg
                className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {isExpanded && (
              <div className="px-5 pb-5 text-sm leading-relaxed text-[var(--muted-foreground)] space-y-3">
                {section.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
