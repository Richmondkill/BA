"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function SpendingBreakdown({
  labels,
  series,
}: {
  labels: string[];
  series: number[];
}) {
  const options: ApexOptions = {
    labels,
    colors: ["#ec111a", "#ff5f6b", "#ffc8cd", "#8f1016", "#12b76a", "#e4e7ec"],
    chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
    legend: { position: "bottom", fontSize: "13px" },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total sent",
              formatter: (w) =>
                `$${w.globals.seriesTotals
                  .reduce((a: number, b: number) => a + b, 0)
                  .toLocaleString()}`,
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v: number) => `$${v.toLocaleString()}` } },
  };

  return (
    <ReactApexChart options={options} series={series} type="donut" height={280} />
  );
}
