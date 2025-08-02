/**
 * RoleTemplateCard - Displays individual role template with metadata
 * Used in template catalog and onboarding flows
 */

import React from "react";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  Users,
  Building2,
  Shield,
  Star,
  Plus,
  Eye,
  ChevronRight,
} from "lucide-react";

export interface RoleTemplate {
  role_id: string;
  role_name: string;
  display_name: string;
  description?: string;
  category: string;
  vertical?: string;
  hierarchy_level: number;
  compliance_level: string;
  metadata_json: Record<string, any>;
}

interface RoleTemplateCardProps {
  template: RoleTemplate;
  onSelect?: (template: RoleTemplate) => void;
  onPreview?: (template: RoleTemplate) => void;
  showActions?: boolean;
  selected?: boolean;
  className?: string;
}

const verticalColors: Record<string, string> = {
  ecommerce: "bg-blue-100 text-blue-800",
  automotive: "bg-gray-100 text-gray-800",
  oilgas: "bg-yellow-100 text-yellow-800",
  agtech: "bg-green-100 text-green-800",
  fintech: "bg-purple-100 text-purple-800",
  insurance: "bg-orange-100 text-orange-800",
  maritime: "bg-cyan-100 text-cyan-800",
  general: "bg-slate-100 text-slate-800",
};

const complianceIcons: Record<string, React.ReactNode> = {
  critical: <Shield className="h-4 w-4 text-red-500" />,
  enhanced: <Star className="h-4 w-4 text-yellow-500" />,
  basic: <Users className="h-4 w-4 text-blue-500" />,
};

export const RoleTemplateCard: React.FC<RoleTemplateCardProps> = ({
  template,
  onSelect,
  onPreview,
  showActions = true,
  selected = false,
  className = "",
}) => {
  const verticalKey = template.vertical || "general";
  const verticalColorClass =
    verticalColors[verticalKey] || verticalColors.general;

  return (
    <Card
      className={`
        transition-all duration-200 hover:shadow-md cursor-pointer
        ${selected ? "ring-2 ring-blue-500 border-blue-300" : "hover:border-gray-300"}
        ${className}
      `}
      onClick={() => onSelect?.(template)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {template.display_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {/* Vertical Badge */}
              <Badge
                variant="secondary"
                className={`text-xs font-medium ${verticalColorClass} border-0`}
              >
                <Building2 className="h-3 w-3 mr-1" />
                {template.vertical
                  ? template.vertical.toUpperCase()
                  : "GENERAL"}
              </Badge>

              {/* Compliance Level */}
              <div className="flex items-center gap-1">
                {complianceIcons[template.compliance_level]}
                <span className="text-xs text-gray-600 capitalize">
                  {template.compliance_level}
                </span>
              </div>
            </div>
          </div>

          {/* Hierarchy Level */}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="font-medium">L{template.hierarchy_level}</span>
          </div>
        </div>

        {template.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
            {template.description}
          </p>
        )}
      </CardHeader>

      {showActions && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(template);
                  }}
                  className="text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              )}
            </div>

            {onSelect && (
              <Button
                variant={selected ? "primary" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(template);
                }}
                className="text-xs"
              >
                {selected ? (
                  <>
                    <span>Selected</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    Use Template
                  </>
                )}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default RoleTemplateCard;
