"use client";

import { useState } from "react";

interface Tab {
  label: string;
  code: string;
}

interface CodeBlockProps {
  tabs: Tab[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--border)] transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function CodeBlock({ tabs }: CodeBlockProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (tabs.length === 0) return null;

  return (
    <div className="rounded-lg overflow-hidden border border-[var(--border)]">
      {/* Tab bar */}
      {tabs.length > 1 && (
        <div className="flex border-b border-[var(--border)] bg-[var(--card)]">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
                i === activeTab
                  ? "border-[var(--primary)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Code area */}
      <div className="relative bg-[var(--muted)]">
        <pre className="p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
          {tabs[activeTab].code}
        </pre>
        <CopyButton text={tabs[activeTab].code} />
      </div>
    </div>
  );
}
