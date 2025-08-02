/**
 * RoleList - Display list of roles with various layouts and actions
 * Used for template catalogs, tenant role management, and search results
 */

import React from "react";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import {
  Search,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Filter,
  Users,
  Building2,
  Star,
  Loader2,
} from "lucide-react";
import { RoleTemplateCard, RoleTemplate } from "./RoleTemplateCard";

export interface TenantRole {
  role_id: string;
  tenant_id: string;
  role_name: string;
  display_name: string;
  description?: string;
  category: string;
  vertical?: string;
  is_template: boolean;
  is_active: boolean;
  hierarchy_level: number;
  parent_role_id?: string;
  compliance_level: string;
  created_at: string;
  updated_at: string;
}

interface RoleListProps {
  // Data
  roles: (RoleTemplate | TenantRole)[];
  loading?: boolean;
  error?: string;

  // Layout
  layout?: "grid" | "list" | "compact";
  columns?: 1 | 2 | 3 | 4;

  // Search & Filter
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;

  // Sorting
  sortBy?: "name" | "vertical" | "level" | "created";
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, order: "asc" | "desc") => void;
  showSort?: boolean;

  // Actions
  onRoleSelect?: (role: RoleTemplate | TenantRole) => void;
  onRolePreview?: (role: RoleTemplate | TenantRole) => void;
  onRoleEdit?: (role: TenantRole) => void;
  onRoleDelete?: (role: TenantRole) => void;
  selectedRoles?: string[];

  // Display options
  showActions?: boolean;
  showVerticalBadges?: boolean;
  emptyStateMessage?: string;
  title?: string;

  className?: string;
}

const sortOptions = [
  { key: "name", label: "Name" },
  { key: "vertical", label: "Industry" },
  { key: "level", label: "Level" },
  { key: "created", label: "Created" },
];

export const RoleList: React.FC<RoleListProps> = ({
  roles,
  loading = false,
  error,
  layout = "grid",
  columns = 3,
  searchQuery = "",
  onSearchChange,
  showSearch = true,
  sortBy = "name",
  sortOrder = "asc",
  onSortChange,
  showSort = true,
  onRoleSelect,
  onRolePreview,
  onRoleEdit,
  onRoleDelete,
  selectedRoles = [],
  showActions = true,
  showVerticalBadges = true,
  emptyStateMessage = "No roles found",
  title,
  className = "",
}) => {
  // Filter roles based on search
  const filteredRoles = React.useMemo(() => {
    if (!searchQuery) return roles;

    const query = searchQuery.toLowerCase();
    return roles.filter(
      (role) =>
        role.display_name.toLowerCase().includes(query) ||
        role.role_name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query) ||
        role.vertical?.toLowerCase().includes(query)
    );
  }, [roles, searchQuery]);

  // Sort roles
  const sortedRoles = React.useMemo(() => {
    const sorted = [...filteredRoles].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.display_name.toLowerCase();
          bValue = b.display_name.toLowerCase();
          break;
        case "vertical":
          aValue = a.vertical || "zzz"; // Put general at end
          bValue = b.vertical || "zzz";
          break;
        case "level":
          aValue = a.hierarchy_level;
          bValue = b.hierarchy_level;
          break;
        case "created":
          aValue = "created_at" in a ? new Date(a.created_at) : new Date(0);
          bValue = "created_at" in b ? new Date(b.created_at) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredRoles, sortBy, sortOrder]);

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      // Toggle order
      onSortChange?.(newSortBy, sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New sort field
      onSortChange?.(newSortBy, "asc");
    }
  };

  const getGridColumns = () => {
    switch (columns) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 text-sm">
            Error loading roles: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      {(title || showSearch || showSort) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            <div className="text-sm text-gray-500">
              {loading
                ? "Loading..."
                : `${sortedRoles.length} role${sortedRoles.length !== 1 ? "s" : ""}`}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            {showSearch && onSearchChange && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            )}

            {/* Sort */}
            {showSort && onSortChange && (
              <div className="flex items-center gap-1">
                {sortOptions.map((option) => (
                  <Button
                    key={option.key}
                    variant={sortBy === option.key ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => handleSortChange(option.key)}
                    className="text-xs"
                  >
                    {option.label}
                    {sortBy === option.key &&
                      (sortOrder === "asc" ? (
                        <SortAsc className="h-3 w-3 ml-1" />
                      ) : (
                        <SortDesc className="h-3 w-3 ml-1" />
                      ))}
                  </Button>
                ))}
              </div>
            )}

            {/* Layout Toggle */}
            <div className="flex items-center gap-1 border rounded p-1">
              <Button
                variant={layout === "grid" ? "primary" : "ghost"}
                size="sm"
                onClick={() => {}} // Layout change would be handled by parent
                className="p-1"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={layout === "list" ? "primary" : "ghost"}
                size="sm"
                onClick={() => {}} // Layout change would be handled by parent
                className="p-1"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading roles...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedRoles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {emptyStateMessage}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery
                ? "Try adjusting your search terms or filters."
                : "Get started by browsing available role templates."}
            </p>
            {searchQuery && onSearchChange && (
              <Button variant="outline" onClick={() => onSearchChange("")}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Role Grid/List */}
      {!loading && sortedRoles.length > 0 && (
        <div
          className={
            layout === "grid" ? `grid gap-4 ${getGridColumns()}` : "space-y-3"
          }
        >
          {sortedRoles.map((role) => (
            <RoleTemplateCard
              key={role.role_id}
              template={role as RoleTemplate}
              onSelect={onRoleSelect}
              onPreview={onRolePreview}
              showActions={showActions}
              selected={selectedRoles.includes(role.role_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoleList;
