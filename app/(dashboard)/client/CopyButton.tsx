"use client";

import { useState } from "react";
import { CopyIcon } from "@/icons";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
      title="Copy account number"
    >
      {copied ? (
        <span className="text-xs font-medium text-success-600">✓</span>
      ) : (
        <CopyIcon />
      )}
    </button>
  );
}
