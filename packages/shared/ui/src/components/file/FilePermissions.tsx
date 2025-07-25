"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Checkbox } from "../ui/Checkbox";
import { Avatar } from "../ui/Avatar";
import { Tooltip } from "../ui/Tooltip";
import {
  Shield,
  User,
  Users,
  Lock,
  Unlock,
  Eye,
  Edit,
  Trash2,
  Download,
  Share2,
  Copy,
  Settings,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Plus,
  Minus,
  MoreHorizontal,
  Globe,
  Building,
  UserCheck,
  UserX,
  Crown,
  Key,
  Calendar,
  Mail,
} from "lucide-react";

// Simple className utility function
const cn = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

export interface Permission {
  id: string;
  name: string;
  description: string;
  type:
    | "read"
    | "write"
    | "delete"
    | "share"
    | "admin"
    | "comment"
    | "download"
    | "upload";
  category: "basic" | "advanced" | "administrative";
  isDefault?: boolean;
  requiresApproval?: boolean;
  icon: React.ReactNode;
}

export interface UserPermission {
  userId: string;
  email: string;
  name?: string;
  avatar?: string;
  role: "owner" | "admin" | "editor" | "commenter" | "viewer" | "custom";
  permissions: string[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  isActive: boolean;
  isInherited?: boolean;
  source?: "direct" | "group" | "role" | "organization";
  conditions?: {
    ipWhitelist?: string[];
    timeRestriction?: {
      startTime: string;
      endTime: string;
      timezone: string;
    };
    locationRestriction?: {
      allowedCountries?: string[];
      allowedRegions?: string[];
    };
  };
}

export interface GroupPermission {
  groupId: string;
  groupName: string;
  groupType: "department" | "team" | "project" | "organization";
  permissions: string[];
  memberCount: number;
  grantedAt: Date;
  grantedBy: string;
  isActive: boolean;
}

interface FilePermissionsProps {
  fileId: string;
  fileName: string;
  fileType: string;
  owner: UserPermission;
  userPermissions: UserPermission[];
  groupPermissions: GroupPermission[];
  availablePermissions: Permission[];
  currentUserId: string;
  canManagePermissions: boolean;
  inheritanceEnabled?: boolean;
  parentPermissions?: UserPermission[];
  onUpdateUserPermissions?: (userId: string, permissions: string[]) => void;
  onUpdateGroupPermissions?: (groupId: string, permissions: string[]) => void;
  onAddUser?: (email: string, permissions: string[]) => void;
  onAddGroup?: (groupId: string, permissions: string[]) => void;
  onRemoveUser?: (userId: string) => void;
  onRemoveGroup?: (groupId: string) => void;
  onUpdateRole?: (userId: string, role: string) => void;
  onSetConditions?: (userId: string, conditions: any) => void;
  onTransferOwnership?: (userId: string) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

const roleConfig = {
  owner: {
    label: "Owner",
    color: "bg-red-100 text-red-800",
    icon: <Crown className="h-4 w-4" />,
    permissions: [
      "read",
      "write",
      "delete",
      "share",
      "admin",
      "comment",
      "download",
      "upload",
    ],
  },
  admin: {
    label: "Admin",
    color: "bg-purple-100 text-purple-800",
    icon: <Shield className="h-4 w-4" />,
    permissions: [
      "read",
      "write",
      "delete",
      "share",
      "comment",
      "download",
      "upload",
    ],
  },
  editor: {
    label: "Editor",
    color: "bg-blue-100 text-blue-800",
    icon: <Edit className="h-4 w-4" />,
    permissions: ["read", "write", "comment", "download", "upload"],
  },
  commenter: {
    label: "Commenter",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Edit className="h-4 w-4" />,
    permissions: ["read", "comment", "download"],
  },
  viewer: {
    label: "Viewer",
    color: "bg-gray-100 text-gray-800",
    icon: <Eye className="h-4 w-4" />,
    permissions: ["read"],
  },
  custom: {
    label: "Custom",
    color: "bg-green-100 text-green-800",
    icon: <Settings className="h-4 w-4" />,
    permissions: [],
  },
};

const defaultPermissions: Permission[] = [
  {
    id: "read",
    name: "Read",
    description: "View file content",
    type: "read",
    category: "basic",
    isDefault: true,
    icon: <Eye className="h-4 w-4" />,
  },
  {
    id: "write",
    name: "Write",
    description: "Edit file content",
    type: "write",
    category: "basic",
    icon: <Edit className="h-4 w-4" />,
  },
  {
    id: "delete",
    name: "Delete",
    description: "Delete file",
    type: "delete",
    category: "advanced",
    requiresApproval: true,
    icon: <Trash2 className="h-4 w-4" />,
  },
  {
    id: "share",
    name: "Share",
    description: "Share file with others",
    type: "share",
    category: "basic",
    icon: <Share2 className="h-4 w-4" />,
  },
  {
    id: "download",
    name: "Download",
    description: "Download file",
    type: "download",
    category: "basic",
    icon: <Download className="h-4 w-4" />,
  },
  {
    id: "upload",
    name: "Upload",
    description: "Upload new versions",
    type: "upload",
    category: "basic",
    icon: <Download className="h-4 w-4 rotate-180" />,
  },
  {
    id: "comment",
    name: "Comment",
    description: "Add comments",
    type: "comment",
    category: "basic",
    icon: <Edit className="h-4 w-4" />,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Administrative access",
    type: "admin",
    category: "administrative",
    requiresApproval: true,
    icon: <Shield className="h-4 w-4" />,
  },
];

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("el-GR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getUserInitials = (name?: string, email?: string) => {
  const displayName = name || email || "U";
  return displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const FilePermissions = ({
  fileId,
  fileName,
  fileType,
  owner,
  userPermissions,
  groupPermissions,
  availablePermissions = defaultPermissions,
  currentUserId,
  canManagePermissions,
  inheritanceEnabled = false,
  parentPermissions = [],
  onUpdateUserPermissions,
  onUpdateGroupPermissions,
  onAddUser,
  onAddGroup,
  onRemoveUser,
  onRemoveGroup,
  onUpdateRole,
  onSetConditions,
  onTransferOwnership,
  loading = false,
  error,
  className,
}: FilePermissionsProps) => {
  const { t } = useTranslation();
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);

  const handleUpdateUserPermissions = (
    userId: string,
    permissions: string[]
  ) => {
    if (onUpdateUserPermissions) {
      onUpdateUserPermissions(userId, permissions);
      setEditingUser(null);
      setEditingPermissions([]);
    }
  };

  const handleRoleChange = (userId: string, role: string) => {
    if (onUpdateRole) {
      onUpdateRole(userId, role);
      const rolePermissions =
        roleConfig[role as keyof typeof roleConfig]?.permissions || [];
      setEditingPermissions(rolePermissions);
    }
  };

  const getPermissionIcon = (permissionId: string) => {
    const permission = availablePermissions.find((p) => p.id === permissionId);
    return permission?.icon || <Key className="h-4 w-4" />;
  };

  const getPermissionName = (permissionId: string) => {
    const permission = availablePermissions.find((p) => p.id === permissionId);
    return permission?.name || permissionId;
  };

  const hasPermission = (userPermissions: string[], permissionId: string) => {
    return userPermissions.includes(permissionId);
  };

  const getEffectivePermissions = (user: UserPermission) => {
    let effective = [...user.permissions];

    if (inheritanceEnabled && parentPermissions.length > 0) {
      const parentUser = parentPermissions.find(
        (p) => p.userId === user.userId
      );
      if (parentUser) {
        effective = [...new Set([...effective, ...parentUser.permissions])];
      }
    }

    return effective;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {t("files.permissions.title")} - {fileName}
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Owner Section */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              {t("files.permissions.owner")}
            </h3>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={owner.avatar}
                    alt={owner.name}
                    name={owner.name || owner.email}
                    size="sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {owner.name || owner.email}
                      </span>
                      <Badge variant="error">
                        {t("files.permissions.owner")}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("files.permissions.fullAccess")}
                    </div>
                  </div>
                </div>
                {canManagePermissions && owner.userId === currentUserId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTransferOwnership?.(owner.userId)}
                  >
                    {t("files.permissions.transferOwnership")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("files.permissions.users")}
                <Badge variant="secondary">{userPermissions.length}</Badge>
              </h3>
              {canManagePermissions && (
                <Button
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setShowAddUser(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t("files.permissions.addUser")}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {userPermissions.map((user) => (
                <div key={user.userId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatar}
                        alt={user.name}
                        name={user.name || user.email}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {user.name || user.email}
                          </span>
                          <Badge
                            variant={
                              user.role === "owner"
                                ? "error"
                                : user.role === "admin"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {roleConfig[user.role]?.label}
                          </Badge>
                          {user.expiresAt && (
                            <Tooltip
                              content={`${t(
                                "files.permissions.expires"
                              )} ${formatDate(user.expiresAt)}`}
                            >
                              <Clock className="h-3 w-3 text-gray-500" />
                            </Tooltip>
                          )}
                          {!user.isActive && (
                            <Badge variant="outline">
                              {t("files.permissions.inactive")}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-4">
                          <span>
                            {t("files.permissions.granted")}{" "}
                            {formatDate(user.grantedAt)}
                          </span>
                          {user.isInherited && (
                            <span className="flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              {t("files.permissions.inherited")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingUser === user.userId ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleUpdateUserPermissions(
                                user.userId,
                                editingPermissions
                              )
                            }
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(null);
                              setEditingPermissions([]);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {getEffectivePermissions(user)
                              .slice(0, 3)
                              .map((permissionId) => (
                                <Tooltip
                                  key={permissionId}
                                  content={getPermissionName(permissionId)}
                                >
                                  <div className="p-1 bg-gray-100 rounded">
                                    {getPermissionIcon(permissionId)}
                                  </div>
                                </Tooltip>
                              ))}
                            {getEffectivePermissions(user).length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{getEffectivePermissions(user).length - 3}
                              </span>
                            )}
                          </div>
                          {canManagePermissions && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingUser(user.userId);
                                setEditingPermissions(user.permissions);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {editingUser === user.userId && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-2">
                        {availablePermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${user.userId}-${permission.id}`}
                              checked={editingPermissions.includes(
                                permission.id
                              )}
                              onChange={(checked) => {
                                if (checked) {
                                  setEditingPermissions([
                                    ...editingPermissions,
                                    permission.id,
                                  ]);
                                } else {
                                  setEditingPermissions(
                                    editingPermissions.filter(
                                      (p) => p !== permission.id
                                    )
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`${user.userId}-${permission.id}`}
                              className="text-sm flex items-center gap-1"
                            >
                              {permission.icon}
                              {permission.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {userPermissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {t("files.permissions.noUsers")}
                </div>
              )}
            </div>
          </div>

          {/* Groups Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                {t("files.permissions.groups")}
                <Badge variant="secondary">{groupPermissions.length}</Badge>
              </h3>
              {canManagePermissions && (
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {t("files.permissions.addGroup")}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {groupPermissions.map((group) => (
                <div key={group.groupId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{group.groupName}</span>
                          <Badge variant="outline">{group.groupType}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {t("files.permissions.members", {
                            variables: { count: group.memberCount },
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {group.permissions.slice(0, 3).map((permissionId) => (
                          <Tooltip
                            key={permissionId}
                            content={getPermissionName(permissionId)}
                          >
                            <div className="p-1 bg-gray-100 rounded">
                              {getPermissionIcon(permissionId)}
                            </div>
                          </Tooltip>
                        ))}
                        {group.permissions.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{group.permissions.length - 3}
                          </span>
                        )}
                      </div>
                      {canManagePermissions && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onRemoveGroup?.(group.groupId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {groupPermissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {t("files.permissions.noGroups")}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
