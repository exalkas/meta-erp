/**
 * VerticalFilter - Filter component for industry verticals
 * Allows users to filter role templates by business vertical
 */

import React from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Card, CardContent, CardHeader } from "../ui/Card";
import {
  Building2,
  ShoppingCart,
  Car,
  Fuel,
  Wheat,
  DollarSign,
  Shield,
  Anchor,
  Filter,
  X,
} from "lucide-react";

export interface VerticalOption {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  count?: number;
  color: string;
}

interface VerticalFilterProps {
  selectedVerticals: string[];
  onVerticalChange: (verticals: string[]) => void;
  availableVerticals?: VerticalOption[];
  showCounts?: boolean;
  layout?: "horizontal" | "vertical";
  className?: string;
}

// Default vertical options with icons and colors
const defaultVerticals: VerticalOption[] = [
  {
    key: "general",
    label: "General Business",
    description: "Universal business roles",
    icon: <Building2 className="h-4 w-4" />,
    color: "bg-slate-100 text-slate-800",
  },
  {
    key: "ecommerce",
    label: "E-commerce & Retail",
    description: "Online stores and retail",
    icon: <ShoppingCart className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800",
  },
  {
    key: "automotive",
    label: "Automotive",
    description: "Car dealerships and services",
    icon: <Car className="h-4 w-4" />,
    color: "bg-gray-100 text-gray-800",
  },
  {
    key: "oilgas",
    label: "Oil & Gas",
    description: "Energy and petroleum",
    icon: <Fuel className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    key: "agtech",
    label: "Agriculture & Tech",
    description: "Farming and agtech",
    icon: <Wheat className="h-4 w-4" />,
    color: "bg-green-100 text-green-800",
  },
  {
    key: "fintech",
    label: "Financial Technology",
    description: "Banking and fintech",
    icon: <DollarSign className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-800",
  },
  {
    key: "insurance",
    label: "Insurance",
    description: "Insurance and risk management",
    icon: <Shield className="h-4 w-4" />,
    color: "bg-orange-100 text-orange-800",
  },
  {
    key: "maritime",
    label: "Maritime & Shipping",
    description: "Ports and shipping",
    icon: <Anchor className="h-4 w-4" />,
    color: "bg-cyan-100 text-cyan-800",
  },
];

export const VerticalFilter: React.FC<VerticalFilterProps> = ({
  selectedVerticals,
  onVerticalChange,
  availableVerticals = defaultVerticals,
  showCounts = false,
  layout = "horizontal",
  className = "",
}) => {
  const handleVerticalToggle = (verticalKey: string) => {
    if (selectedVerticals.includes(verticalKey)) {
      // Remove vertical
      onVerticalChange(selectedVerticals.filter((v) => v !== verticalKey));
    } else {
      // Add vertical
      onVerticalChange([...selectedVerticals, verticalKey]);
    }
  };

  const clearAllFilters = () => {
    onVerticalChange([]);
  };

  const selectAllVerticals = () => {
    onVerticalChange(availableVerticals.map((v) => v.key));
  };

  if (layout === "vertical") {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="p-4 border-b">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Industry Verticals
              </h3>
            </div>
            {selectedVerticals.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {availableVerticals.map((vertical) => {
            const isSelected = selectedVerticals.includes(vertical.key);
            return (
              <Button
                key={vertical.key}
                variant={isSelected ? "primary" : "outline"}
                size="sm"
                onClick={() => handleVerticalToggle(vertical.key)}
                className="w-full justify-start text-left h-auto py-3"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-1 rounded ${vertical.color}`}>
                    {vertical.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{vertical.label}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {vertical.description}
                    </div>
                  </div>
                  {showCounts && vertical.count !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {vertical.count}
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  // Horizontal layout
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter by Industry
        </h3>
        <div className="flex items-center gap-2">
          {selectedVerticals.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-gray-500"
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAllVerticals}
            className="text-xs text-gray-500"
          >
            Select All
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableVerticals.map((vertical) => {
          const isSelected = selectedVerticals.includes(vertical.key);
          return (
            <Button
              key={vertical.key}
              variant={isSelected ? "primary" : "outline"}
              size="sm"
              onClick={() => handleVerticalToggle(vertical.key)}
              className="text-xs"
            >
              <div className="flex items-center gap-2">
                {vertical.icon}
                <span>{vertical.label}</span>
                {showCounts && vertical.count !== undefined && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {vertical.count}
                  </Badge>
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {selectedVerticals.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-xs text-gray-500">Active filters:</span>
          {selectedVerticals.map((verticalKey) => {
            const vertical = availableVerticals.find(
              (v) => v.key === verticalKey
            );
            if (!vertical) return null;

            return (
              <Badge
                key={verticalKey}
                variant="secondary"
                className={`text-xs ${vertical.color} cursor-pointer`}
                onClick={() => handleVerticalToggle(verticalKey)}
              >
                {vertical.icon}
                <span className="ml-1">{vertical.label}</span>
                <X className="h-3 w-3 ml-1" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VerticalFilter;
