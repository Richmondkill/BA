"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function CashflowChart({
  categories,
  funded,
  transferred,
}: {
  categories: string[];
  funded: number[];
  transferred: number[];
}) {
  const options: ApexOptions = {
    colors: ["#ec111a", "#8f1016"],
    chart: {
      type: "area",
      height: 310,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      animations: { enabled: true, speed: 500 },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0, stops: [0, 90] },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "rgba(148,163,184,0.15)",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
    },
    legend: { show: true, position: "top", horizontalAlign: "left" },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "12px" } },
    },
    yaxis: {
      labels: {
        formatter: (v: number) =>
          v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`,
      },
    },
    tooltip: {
      y: { formatter: (v: number) => `$${v.toLocaleString()}` },
    },
  };

  const series = [
    { name: "Funded", data: funded },
    { name: "Transferred", data: transferred },
  ];

  return (
    <div className="-ml-2">
      <ReactApexChart options={options} series={series} type="area" height={310} />
    </div>
  );
}
