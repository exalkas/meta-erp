/**
 * Role Management Layout
 * Provides navigation and shared layout for role management pages
 */

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Template,
  Settings,
  Plus,
  Building2,
  ChevronRight,
} from "lucide-react";

interface RoleLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: "Browse Templates",
    href: "/roles",
    icon: Template,
    description: "Discover role templates",
  },
  {
    name: "Onboarding",
    href: "/roles/onboarding",
    icon: Building2,
    description: "Setup roles for new business",
  },
  {
    name: "Manage Roles",
    href: "/roles/manage",
    icon: Users,
    description: "Manage your team roles",
  },
  {
    name: "Settings",
    href: "/roles/settings",
    icon: Settings,
    description: "Role configuration",
  },
];

export default function RoleLayout({ children }: RoleLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/dashboard"
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                Dashboard
                <ChevronRight className="h-4 w-4 mx-1" />
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">
                Role Management
              </h1>
            </div>

            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Quick Setup
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 py-4 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main>{children}</main>

      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Template className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="font-semibold">45+ Templates</h3>
                    <p className="text-sm text-gray-600">
                      Ready-made roles for any industry
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="font-semibold">7 Industries</h3>
                    <p className="text-sm text-gray-600">
                      Vertical-specific role collections
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-purple-500" />
                  <div>
                    <h3 className="font-semibold">Multi-Tenant</h3>
                    <p className="text-sm text-gray-600">
                      Secure role isolation per tenant
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
