"use client";

import React from "react";
import { DynamicChart, ChartDataPoint, ChartConfig } from "./DynamicChart";

export interface BarChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  horizontal?: boolean;
  stacked?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
  colors?: string[];
  className?: string;
  onDataPointClick?: (dataPoint: ChartDataPoint) => void;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  subtitle,
  horizontal = false,
  stacked = false,
  showValues = true,
  showGrid = true,
  showLegend = false,
  height = 300,
  colors,
  className,
  onDataPointClick,
  loading,
  error,
  emptyMessage,
}) => {
  const config: ChartConfig = {
    type: "bar",
    title,
    subtitle,
    showGrid,
    showLegend,
    showTooltip: true,
    animate: true,
    responsive: true,
    height,
    colors,
  };

  return (
    <DynamicChart
      data={data}
      config={config}
      className={className}
      onDataPointClick={onDataPointClick}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
    />
  );
};

export default BarChart;
