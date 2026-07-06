import React from "react";

type Accent = "brand" | "success" | "warning" | "error" | "info";

const accentMap: Record<Accent, { chip: string; glow: string }> = {
  brand: {
    chip: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
    glow: "from-brand-500/15",
  },
  success: {
    chip: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
    glow: "from-success-500/15",
  },
  warning: {
    chip: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400",
    glow: "from-warning-500/15",
  },
  error: {
    chip: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
    glow: "from-error-500/15",
  },
  info: {
    chip: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-500",
    glow: "from-blue-light-500/15",
  },
};

export default function StatCard({
  label,
  value,
  icon,
  accent = "brand",
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: Accent;
  hint?: React.ReactNode;
}) {
  const a = accentMap[accent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03]">
      {/* soft accent glow */}
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${a.glow} to-transparent blur-2xl`}
      />
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.chip}`}>
        <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      </div>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <h4 className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
        {value}
      </h4>
      {hint && (
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</div>
      )}
    </div>
  );
}
