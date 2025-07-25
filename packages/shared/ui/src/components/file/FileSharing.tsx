"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Input } from "../ui/Input";
import { Tabs } from "../ui/Tabs";
import { Tooltip } from "../ui/Tooltip";
import { Avatar } from "../ui/Avatar";
import {
  Share2,
  Link,
  Users,
  Lock,
  Eye,
  Edit,
  Trash2,
  Copy,
  Mail,
  Settings,
  UserPlus,
  Shield,
  Clock,
  Download,
} from "lucide-react";

// Simple className utility function
const cn = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

export interface ShareLink {
  id: string;
  url: string;
  token: string;
  name?: string;
  description?: string;
  type: "view" | "download" | "edit" | "comment";
  expiresAt?: Date;
  isActive: boolean;
  isPasswordProtected: boolean;
  maxDownloads?: number;
  downloadCount: number;
  accessCount: number;
  createdAt: Date;
  createdBy: string;
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
  allowedDomains?: string[];
  requiresSignIn?: boolean;
  notifyOnAccess?: boolean;
}

export interface ShareUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: "viewer" | "editor" | "commenter" | "owner";
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
    comment: boolean;
    download: boolean;
  };
  invitedAt: Date;
  invitedBy: string;
  acceptedAt?: Date;
  lastAccessedAt?: Date;
  isActive: boolean;
  expiresAt?: Date;
  notifyOnChanges?: boolean;
}

interface FileSharingProps {
  fileId: string;
  fileName: string;
  fileType: string;
  shareLinks: ShareLink[];
  shareUsers: ShareUser[];
  currentUserId: string;
  permissions: {
    canShare: boolean;
    canManagePermissions: boolean;
    canCreateLinks: boolean;
    canInviteUsers: boolean;
  };
  onCreateLink?: (linkData: Partial<ShareLink>) => void;
  onUpdateLink?: (linkId: string, updates: Partial<ShareLink>) => void;
  onDeleteLink?: (linkId: string) => void;
  onInviteUser?: (userData: Partial<ShareUser>) => void;
  onUpdateUser?: (userId: string, updates: Partial<ShareUser>) => void;
  onRemoveUser?: (userId: string) => void;
  onCopyLink?: (url: string) => void;
  onSendEmail?: (
    recipients: string[],
    subject: string,
    message: string
  ) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

const roleOptions = [
  { value: "viewer", label: "Viewer", icon: <Eye className="h-4 w-4" /> },
  {
    value: "commenter",
    label: "Commenter",
    icon: <Edit className="h-4 w-4" />,
  },
  { value: "editor", label: "Editor", icon: <Edit className="h-4 w-4" /> },
  { value: "owner", label: "Owner", icon: <Shield className="h-4 w-4" /> },
];

const linkTypeOptions = [
  { value: "view", label: "View Only", icon: <Eye className="h-4 w-4" /> },
  {
    value: "download",
    label: "Download",
    icon: <Download className="h-4 w-4" />,
  },
  { value: "edit", label: "Edit", icon: <Edit className="h-4 w-4" /> },
  { value: "comment", label: "Comment", icon: <Edit className="h-4 w-4" /> },
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

const getRoleColor = (role: string) => {
  switch (role) {
    case "owner":
      return "error";
    case "editor":
      return "primary";
    case "commenter":
      return "warning";
    case "viewer":
      return "secondary";
    default:
      return "secondary";
  }
};

export const FileSharing = ({
  fileId,
  fileName,
  fileType,
  shareLinks,
  shareUsers,
  currentUserId,
  permissions,
  onCreateLink,
  onUpdateLink,
  onDeleteLink,
  onInviteUser,
  onUpdateUser,
  onRemoveUser,
  onCopyLink,
  onSendEmail,
  loading = false,
  error,
  className,
}: FileSharingProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("links");

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    onCopyLink?.(url);
  };

  const activeLinks = shareLinks.filter((link) => link.isActive);
  const activeUsers = shareUsers.filter((user) => user.isActive);

  const renderLinksTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{t("files.sharing.shareLinks")}</h3>
        {permissions.canCreateLinks && (
          <Button
            size="sm"
            className="flex items-center gap-2"
            onClick={() => onCreateLink?.({})}
          >
            <Link className="h-4 w-4" />
            {t("files.sharing.createLink")}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {activeLinks.map((link) => (
          <div key={link.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Link className="h-4 w-4" />
                  <span className="font-medium">
                    {link.name || t("files.sharing.shareLink")}
                  </span>
                  <Badge variant="outline">
                    {
                      linkTypeOptions.find((opt) => opt.value === link.type)
                        ?.label
                    }
                  </Badge>
                  {link.isPasswordProtected && (
                    <Lock className="h-3 w-3 text-gray-500" />
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-4">
                    <span>
                      {t("files.sharing.accessed", {
                        variables: { count: link.accessCount },
                      })}
                    </span>
                    <span>
                      {t("files.sharing.downloads", {
                        variables: { count: link.downloadCount },
                      })}
                    </span>
                    {link.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("files.sharing.expires")}{" "}
                        {formatDate(link.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={link.url}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(link.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteLink?.(link.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {activeLinks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {t("files.sharing.noLinks")}
          </div>
        )}
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{t("files.sharing.sharedWith")}</h3>
        {permissions.canInviteUsers && (
          <Button
            size="sm"
            className="flex items-center gap-2"
            onClick={() => onInviteUser?.({})}
          >
            <UserPlus className="h-4 w-4" />
            {t("files.sharing.inviteUser")}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {activeUsers.map((user) => (
          <div key={user.id} className="border rounded-lg p-4">
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
                    <Badge variant={getRoleColor(user.role)}>
                      {
                        roleOptions.find((role) => role.value === user.role)
                          ?.label
                      }
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.lastAccessedAt ? (
                      <span>
                        {t("files.sharing.lastAccessed")}{" "}
                        {formatDate(user.lastAccessedAt)}
                      </span>
                    ) : (
                      <span>{t("files.sharing.notAccessed")}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content={t("files.sharing.sendReminder")}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSendEmail?.([user.email], "Reminder", "")}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveUser?.(user.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {activeUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {t("files.sharing.noUsers")}
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-3">
          {t("files.sharing.generalSettings")}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">
                {t("files.sharing.allowPublicAccess")}
              </label>
              <p className="text-sm text-gray-600">
                {t("files.sharing.allowPublicAccessDescription")}
              </p>
            </div>
            <input type="checkbox" className="toggle" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">
                {t("files.sharing.allowDownload")}
              </label>
              <p className="text-sm text-gray-600">
                {t("files.sharing.allowDownloadDescription")}
              </p>
            </div>
            <input type="checkbox" className="toggle" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">{t("files.sharing.notifications")}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">
                {t("files.sharing.notifyOnAccess")}
              </label>
              <p className="text-sm text-gray-600">
                {t("files.sharing.notifyOnAccessDescription")}
              </p>
            </div>
            <input type="checkbox" className="toggle" />
          </div>
        </div>
      </div>
    </div>
  );

  const tabItems = [
    {
      id: "links",
      label: t("files.sharing.links"),
      icon: <Link className="h-4 w-4" />,
      badge: activeLinks.length > 0 ? activeLinks.length.toString() : undefined,
      content: renderLinksTab(),
    },
    {
      id: "users",
      label: t("files.sharing.users"),
      icon: <Users className="h-4 w-4" />,
      badge: activeUsers.length > 0 ? activeUsers.length.toString() : undefined,
      content: renderUsersTab(),
    },
    {
      id: "settings",
      label: t("files.sharing.settings"),
      icon: <Settings className="h-4 w-4" />,
      content: renderSettingsTab(),
    },
  ];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {t("files.sharing.title")} - {fileName}
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          items={tabItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </CardContent>
    </Card>
  );
};
