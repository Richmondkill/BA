"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function CashflowBars({
  categories,
  income,
  expense,
}: {
  categories: string[];
  income: number[];
  expense: number[];
}) {
  const options: ApexOptions = {
    colors: ["#ec111a", "#ffc8cd"],
    chart: {
      type: "bar",
      height: 300,
      stacked: true,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        columnWidth: "42%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
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
          v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${Math.round(v)}`,
      },
    },
    tooltip: { y: { formatter: (v: number) => `$${v.toLocaleString()}` } },
  };

  return (
    <ReactApexChart
      options={options}
      series={[
        { name: "Income", data: income },
        { name: "Expense", data: expense },
      ]}
      type="bar"
      height={300}
    />
  );
}
