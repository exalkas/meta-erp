"use client";

import React from "react";
import { DynamicChart, ChartDataPoint, ChartConfig } from "./DynamicChart";

export interface LineChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  smooth?: boolean;
  showMarkers?: boolean;
  showArea?: boolean;
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

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  subtitle,
  smooth = false,
  showMarkers = true,
  showArea = false,
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
    type: showArea ? "area" : "line",
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

export default LineChart;
