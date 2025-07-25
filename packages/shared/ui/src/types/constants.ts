// App configurations and constants
import React, { ReactNode } from "react";
import { Settings, Briefcase, Wrench, Users, Headphones } from "lucide-react";

export enum AppName {
  ADMIN = "admin",
  CLIENT = "client",
  SETUP = "setup",
  STAFF_SUPPORT = "staff-support",
  USER_SUPPORT = "user-support",
}

export interface AppConfig {
  name: string;
  nameEl: string;
  description: string;
  descriptionEl: string;
  primaryColor: string;
  icon: ReactNode;
  allowedRoles: string[];
}

export const APP_CONFIGS: Record<AppName, AppConfig> = {
  [AppName.ADMIN]: {
    name: "Admin Panel",
    nameEl: "Πάνελ Διαχειριστή",
    description: "System administration and management",
    descriptionEl: "Διαχείριση συστήματος και διαχείριση",
    primaryColor: "bg-red-600",
    icon: React.createElement(Settings, { className: "h-6 w-6" }),
    allowedRoles: ["super_admin"],
  },
  [AppName.CLIENT]: {
    name: "Greek ERP/CRM",
    nameEl: "Ελληνικό ERP/CRM",
    description: "Customer and business management",
    descriptionEl: "Διαχείριση πελατών και επιχειρήσεων",
    primaryColor: "bg-blue-600",
    icon: React.createElement(Briefcase, { className: "h-6 w-6" }),
    allowedRoles: [
      "super_admin",
      "company_admin",
      "manager",
      "employee",
      "viewer",
      "client",
    ],
  },
  [AppName.SETUP]: {
    name: "System Setup",
    nameEl: "Εγκατάσταση Συστήματος",
    description: "Initial system configuration",
    descriptionEl: "Αρχική ρύθμιση συστήματος",
    primaryColor: "bg-green-600",
    icon: React.createElement(Wrench, { className: "h-6 w-6" }),
    allowedRoles: ["super_admin", "company_admin"],
  },
  [AppName.STAFF_SUPPORT]: {
    name: "Staff Support",
    nameEl: "Υποστήριξη Προσωπικού",
    description: "Internal staff support tools",
    descriptionEl: "Εργαλεία υποστήριξης προσωπικού",
    primaryColor: "bg-purple-600",
    icon: React.createElement(Users, { className: "h-6 w-6" }),
    allowedRoles: ["super_admin"],
  },
  [AppName.USER_SUPPORT]: {
    name: "User Support",
    nameEl: "Υποστήριξη Χρηστών",
    description: "Customer support platform",
    descriptionEl: "Πλατφόρμα υποστήριξης πελατών",
    primaryColor: "bg-orange-600",
    icon: React.createElement(Headphones, { className: "h-6 w-6" }),
    allowedRoles: ["super_admin", "company_admin"],
  },
};
