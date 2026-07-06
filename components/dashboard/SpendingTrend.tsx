"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function SpendingTrend({
  categories,
  data,
}: {
  categories: string[];
  data: number[];
}) {
  const options: ApexOptions = {
    colors: ["#ec111a"],
    chart: {
      type: "area",
      height: 230,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      animations: { enabled: true, speed: 500 },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.45, opacityTo: 0, stops: [0, 95] },
    },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    grid: {
      borderColor: "rgba(148,163,184,0.15)",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "12px" } },
    },
    yaxis: {
      labels: {
        formatter: (v: number) =>
          v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`,
      },
    },
    tooltip: { y: { formatter: (v: number) => `$${v.toLocaleString()}` } },
  };

  return (
    <div className="-ml-2">
      <ReactApexChart
        options={options}
        series={[{ name: "Sent", data }]}
        type="area"
        height={230}
      />
    </div>
  );
}
