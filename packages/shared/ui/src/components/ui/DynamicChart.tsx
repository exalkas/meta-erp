"use client";

import React, { useMemo } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
} from "lucide-react";

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  category?: string;
  timestamp?: Date;
}

export interface ChartConfig {
  type: "line" | "bar" | "pie" | "area" | "donut";
  title?: string;
  subtitle?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  responsive?: boolean;
  colors?: string[];
  height?: number;
  maxValue?: number;
  minValue?: number;
}

export interface DynamicChartProps {
  data: ChartDataPoint[];
  config: ChartConfig;
  className?: string;
  onDataPointClick?: (dataPoint: ChartDataPoint) => void;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

const defaultColors = [
  "#0066CC", // Maritime primary
  "#FFF700", // Maritime accent
  "#005AA3", // Darker blue
  "#E6F3FF", // Light blue
  "#FFE066", // Light yellow
  "#004080", // Navy
  "#66B2FF", // Light maritime blue
  "#B3D9FF", // Very light blue
];

export const DynamicChart: React.FC<DynamicChartProps> = ({
  data,
  config,
  className = "",
  onDataPointClick,
  loading = false,
  error,
  emptyMessage,
}) => {
  const { t } = useTranslation();

  const chartColors = useMemo(() => {
    return config.colors || defaultColors;
  }, [config.colors]);

  const maxValue = useMemo(() => {
    if (config.maxValue !== undefined) return config.maxValue;
    return Math.max(...data.map((d) => d.value));
  }, [data, config.maxValue]);

  const minValue = useMemo(() => {
    if (config.minValue !== undefined) return config.minValue;
    return Math.min(...data.map((d) => d.value));
  }, [data, config.minValue]);

  const total = useMemo(() => {
    return data.reduce((sum, d) => sum + d.value, 0);
  }, [data]);

  const trend = useMemo(() => {
    if (data.length < 2) return "neutral";
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    if (lastValue > firstValue) return "up";
    if (lastValue < firstValue) return "down";
    return "neutral";
  }, [data]);

  const renderBarChart = () => {
    const chartHeight = config.height || 300;
    const barWidth = Math.max(20, 100 / data.length - 2);

    return (
      <div className="relative" style={{ height: chartHeight }}>
        {config.showGrid && (
          <div className="absolute inset-0 flex flex-col justify-between">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="border-t border-gray-200 w-full" />
            ))}
          </div>
        )}
        <div className="flex items-end justify-around h-full pb-8">
          {data.map((item, index) => {
            const height = (item.value / maxValue) * (chartHeight - 40);
            const color = item.color || chartColors[index % chartColors.length];

            return (
              <div
                key={item.label}
                className={`flex flex-col items-center cursor-pointer transition-all duration-300 hover:opacity-80 ${
                  config.animate ? "animate-pulse" : ""
                }`}
                onClick={() => onDataPointClick?.(item)}
                style={{ width: `${barWidth}%` }}
              >
                <div className="relative group">
                  <div
                    className="w-full rounded-t-md transition-all duration-500 hover:scale-105"
                    style={{
                      height: `${height}px`,
                      backgroundColor: color,
                      minHeight: "2px",
                    }}
                  />
                  {config.showTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {item.label}: {item.value.toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-2 text-center truncate w-full">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLineChart = () => {
    const chartHeight = config.height || 300;
    const width = 100;
    const height = chartHeight - 40;

    if (data.length < 2)
      return (
        <div className="text-center text-gray-500 py-8">
          {t("chart.insufficientData")}
        </div>
      );

    const points = data
      .map((item, index) => {
        const x = (index / (data.length - 1)) * width;
        const y =
          height - ((item.value - minValue) / (maxValue - minValue)) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className="relative">
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="overflow-visible"
        >
          {config.showGrid && (
            <g className="opacity-30">
              {Array.from({ length: 5 }, (_, i) => (
                <line
                  key={i}
                  x1={0}
                  y1={(i / 4) * height}
                  x2={width}
                  y2={(i / 4) * height}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}
            </g>
          )}
          <polyline
            points={points}
            fill="none"
            stroke={chartColors[0]}
            strokeWidth="2"
            className={config.animate ? "animate-pulse" : ""}
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * width;
            const y =
              height -
              ((item.value - minValue) / (maxValue - minValue)) * height;

            return (
              <g key={item.label}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={chartColors[0]}
                  className="cursor-pointer hover:r-6 transition-all duration-200"
                  onClick={() => onDataPointClick?.(item)}
                />
                {config.showTooltip && (
                  <g className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <rect
                      x={x - 30}
                      y={y - 30}
                      width="60"
                      height="20"
                      fill="rgba(0, 0, 0, 0.8)"
                      rx="4"
                    />
                    <text
                      x={x}
                      y={y - 15}
                      textAnchor="middle"
                      className="text-xs fill-white"
                    >
                      {item.value.toLocaleString()}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderPieChart = () => {
    const size = config.height || 300;
    const radius = (size - 40) / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    let currentAngle = 0;
    const segments = data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);

      const largeArcFlag = angle > Math.PI ? 1 : 0;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        "Z",
      ].join(" ");

      currentAngle += angle;

      return {
        ...item,
        pathData,
        percentage,
        color: item.color || chartColors[index % chartColors.length],
      };
    });

    return (
      <div className="relative">
        <svg width={size} height={size} className="overflow-visible">
          {segments.map((segment, index) => (
            <g key={segment.label}>
              <path
                d={segment.pathData}
                fill={segment.color}
                className={`cursor-pointer hover:opacity-80 transition-all duration-200 ${
                  config.animate ? "animate-pulse" : ""
                }`}
                onClick={() => onDataPointClick?.(segment)}
              />
              {config.showTooltip && (
                <g className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <rect
                    x={centerX - 40}
                    y={centerY - 10}
                    width="80"
                    height="20"
                    fill="rgba(0, 0, 0, 0.8)"
                    rx="4"
                  />
                  <text
                    x={centerX}
                    y={centerY + 5}
                    textAnchor="middle"
                    className="text-xs fill-white"
                  >
                    {segment.percentage.toFixed(1)}%
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const renderChart = () => {
    switch (config.type) {
      case "bar":
        return renderBarChart();
      case "line":
        return renderLineChart();
      case "pie":
      case "donut":
        return renderPieChart();
      case "area":
        return renderLineChart(); // Simplified area chart
      default:
        return renderBarChart();
    }
  };

  const getChartIcon = () => {
    switch (config.type) {
      case "line":
        return <LineChart className="w-4 h-4" />;
      case "bar":
        return <BarChart3 className="w-4 h-4" />;
      case "pie":
      case "donut":
        return <PieChart className="w-4 h-4" />;
      case "area":
        return <Activity className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-red-500 py-8">
          <div className="text-lg font-semibold">{t("chart.error")}</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-gray-500 py-8">
          <div className="text-lg font-semibold">{t("chart.noData")}</div>
          <div className="text-sm">
            {emptyMessage || t("chart.noDataDescription")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {(config.title || config.subtitle) && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getChartIcon()}
              <h3 className="text-lg font-semibold text-gray-900">
                {config.title}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon()}
              <span className="text-sm text-gray-600">
                {data.length} {t("chart.dataPoints")}
              </span>
            </div>
          </div>
          {config.subtitle && (
            <p className="text-sm text-gray-600 mt-1">{config.subtitle}</p>
          )}
        </div>
      )}

      <div className="chart-container">{renderChart()}</div>

      {config.showLegend && (
        <div className="mt-6 flex flex-wrap gap-4">
          {data.map((item, index) => (
            <div key={item.label} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    item.color || chartColors[index % chartColors.length],
                }}
              />
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className="text-sm text-gray-500">
                ({item.value.toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DynamicChart;
