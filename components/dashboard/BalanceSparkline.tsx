"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function BalanceSparkline({
  data,
  height = 90,
}: {
  data: number[];
  height?: number;
}) {
  const options: ApexOptions = {
    colors: ["#ec111a"],
    chart: {
      type: "area",
      height,
      sparkline: { enabled: true },
      fontFamily: "Outfit, sans-serif",
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] },
    },
    tooltip: { enabled: false },
  };
  return (
    <ReactApexChart
      options={options}
      series={[{ name: "Balance", data }]}
      type="area"
      height={height}
    />
  );
}
