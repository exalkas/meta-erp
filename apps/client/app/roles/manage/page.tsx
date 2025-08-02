/**
 * Role Management Dashboard - Manage tenant's active roles
 * Phase 5C: Role Management Implementation
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Shield,
  Star,
  Building2,
  Calendar,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";

// Import our hooks
import { useRoleManagement } from "@/hooks/useRoleTemplates";

// Mock tenant ID - in real app this would come from auth context
const TENANT_ID = "89f84fea-b5b9-413c-945b-002c7fd9555d";

interface Role {
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

export default function RoleManagementPage() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [filterBy, setFilterBy] = useState<"all" | "active" | "inactive">(
    "all"
  );

  // Hooks
  const {
    tenantRoles,
    templates,
    isLoadingTenantRoles,
    isLoadingTemplates,
    tenantRolesError,
    deleteRole,
    isDeletingRole,
    refetchTenantRoles,
  } = useRoleManagement(TENANT_ID);

  // Filter and search roles
  const filteredRoles = React.useMemo(() => {
    if (!tenantRoles) return [];

    let filtered = tenantRoles;

    // Filter by status
    if (filterBy !== "all") {
      filtered = filtered.filter((role: Role) =>
        filterBy === "active" ? role.is_active : !role.is_active
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (role: Role) =>
          role.display_name.toLowerCase().includes(query) ||
          role.role_name.toLowerCase().includes(query) ||
          role.description?.toLowerCase().includes(query) ||
          role.vertical?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tenantRoles, filterBy, searchQuery]);

  // Statistics
  const stats = React.useMemo(() => {
    if (!tenantRoles) return { total: 0, active: 0, inactive: 0, critical: 0 };

    return {
      total: tenantRoles.length,
      active: tenantRoles.filter((r: Role) => r.is_active).length,
      inactive: tenantRoles.filter((r: Role) => !r.is_active).length,
      critical: tenantRoles.filter(
        (r: Role) => r.compliance_level === "critical"
      ).length,
    };
  }, [tenantRoles]);

  // Handlers
  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole({ tenantId: TENANT_ID, roleId });
      // Remove from selected roles if it was selected
      setSelectedRoles((prev) => prev.filter((id) => id !== roleId));
    } catch (error) {
      console.error("Failed to delete role:", error);
    }
  };

  const handleBulkDelete = async () => {
    for (const roleId of selectedRoles) {
      await handleDeleteRole(roleId);
    }
    setSelectedRoles([]);
  };

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const selectAllRoles = () => {
    setSelectedRoles(filteredRoles.map((role: Role) => role.role_id));
  };

  const clearSelection = () => {
    setSelectedRoles([]);
  };

  const getComplianceIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <Shield className="h-4 w-4 text-red-500" />;
      case "enhanced":
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Users className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Roles</h1>
          <p className="mt-1 text-gray-600">
            Manage your team roles and permissions
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <a href="/roles/onboarding">
              <Plus className="h-4 w-4 mr-2" />
              Add More Roles
            </a>
          </Button>
          <Button asChild>
            <a href="/roles">
              <Building2 className="h-4 w-4 mr-2" />
              Browse Templates
            </a>
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Roles</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">
                {stats.inactive}
              </p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.critical}
              </p>
            </div>
            <Star className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter */}
              <select
                value={filterBy}
                onChange={(e) =>
                  setFilterBy(e.target.value as "all" | "active" | "inactive")
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Roles</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedRoles.length > 0 && (
              <div className="flex gap-2">
                <span className="text-sm text-gray-600 py-2">
                  {selectedRoles.length} selected
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete Selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Roles</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedRoles.length}{" "}
                        selected roles? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete}>
                        Delete Roles
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Roles ({filteredRoles.length})</CardTitle>
            <div className="flex gap-2">
              {filteredRoles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={
                    selectedRoles.length === filteredRoles.length
                      ? clearSelection
                      : selectAllRoles
                  }
                >
                  {selectedRoles.length === filteredRoles.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTenantRoles ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading roles...</p>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No roles found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || filterBy !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by setting up roles for your team"}
              </p>
              <Button asChild>
                <a href="/roles/onboarding">
                  <Plus className="h-4 w-4 mr-2" />
                  Setup Roles
                </a>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedRoles.length === filteredRoles.length &&
                          filteredRoles.length > 0
                        }
                        onChange={
                          selectedRoles.length === filteredRoles.length
                            ? clearSelection
                            : selectAllRoles
                        }
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role: Role) => (
                    <TableRow key={role.role_id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.role_id)}
                          onChange={() => toggleRoleSelection(role.role_id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{role.display_name}</p>
                          <p className="text-sm text-gray-600">
                            {role.role_name}
                          </p>
                          {role.description && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {role.vertical || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          L{role.hierarchy_level}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getComplianceIcon(role.compliance_level)}
                          <span className="text-sm capitalize">
                            {role.compliance_level}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={role.is_active ? "default" : "secondary"}
                        >
                          {role.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatDate(role.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <UserPlus className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isDeletingRole}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the "
                                  {role.display_name}" role? This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRole(role.role_id)}
                                >
                                  Delete Role
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {tenantRolesError && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <Shield className="h-4 w-4" />
              <p className="font-medium">Error loading roles</p>
            </div>
            <p className="text-sm text-red-600 mt-1">
              {tenantRolesError.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchTenantRoles()}
              className="mt-3"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
