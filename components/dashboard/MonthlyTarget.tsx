"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Footer = { label: string; value: string; up?: boolean };

export default function MonthlyTarget({
  title,
  subtitle,
  percent,
  delta,
  message,
  footer,
}: {
  title: string;
  subtitle: string;
  percent: number;
  delta: number;
  message: string;
  footer: Footer[];
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const options: ApexOptions = {
    chart: {
      type: "radialBar",
      height: 300,
      sparkline: { enabled: true },
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#ec111a"],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "72%" },
        track: { background: "#E4E7EC", strokeWidth: "100%" },
        dataLabels: { name: { show: false }, value: { show: false } },
      },
    },
    fill: { type: "solid", colors: ["#ec111a"] },
    stroke: { lineCap: "round" },
  };

  const up = delta >= 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>

        <div className="relative mt-4">
          <ReactApexChart options={options} series={[clamped]} type="radialBar" height={300} />
          <div className="absolute inset-x-0 top-[42%] flex flex-col items-center">
            <span className="text-3xl font-bold text-gray-800 dark:text-white/90">
              {percent.toFixed(2)}%
            </span>
            <span
              className={`mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                up
                  ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                  : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
              }`}
            >
              {up ? "+" : "−"}
              {Math.abs(delta).toFixed(0)}%
            </span>
          </div>
        </div>

        <p className="-mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
      </div>

      <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-800">
        {footer.map((f, i) => (
          <div
            key={f.label}
            className={`px-4 py-4 text-center ${
              i < footer.length - 1 ? "border-r border-gray-100 dark:border-gray-800" : ""
            }`}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{f.label}</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-gray-800 dark:text-white/90">
              {f.value}
              {f.up !== undefined && (
                <span className={f.up ? "text-success-500" : "text-error-500"}>
                  {f.up ? "↑" : "↓"}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
