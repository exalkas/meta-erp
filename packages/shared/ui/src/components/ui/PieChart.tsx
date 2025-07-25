"use client";

import React from "react";
import { DynamicChart, ChartDataPoint, ChartConfig } from "./DynamicChart";

export interface PieChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  donut?: boolean;
  showPercentages?: boolean;
  showValues?: boolean;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  colors?: string[];
  className?: string;
  onDataPointClick?: (dataPoint: ChartDataPoint) => void;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  subtitle,
  donut = false,
  showPercentages = true,
  showValues = false,
  showLegend = true,
  centerLabel,
  centerValue,
  size = 300,
  colors,
  className,
  onDataPointClick,
  loading,
  error,
  emptyMessage,
}) => {
  const config: ChartConfig = {
    type: donut ? "donut" : "pie",
    title,
    subtitle,
    showGrid: false,
    showLegend,
    showTooltip: true,
    animate: true,
    responsive: true,
    height: size,
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

export default PieChart;
