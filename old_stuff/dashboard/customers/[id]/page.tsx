"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslation, useAuth } from "@erp/shared-ui";
import ContactList from "../../../../components/contacts/ContactList";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Badge,
  LoadingButton,
} from "@erp/shared-ui";
import {
  ModernTabs as Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@erp/shared-ui";
import {
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Activity,
  Edit,
  Mail,
  Phone,
  Globe,
  Calendar,
  CreditCard,
  FileText,
  Plus,
  Star,
  Eye,
  TrendingUp,
  DollarSign,
} from "lucide-react";

interface Customer {
  id: string;
  display_name: string;
  business_name?: string;
  first_name?: string;
  last_name?: string;
  entity_type: "business" | "individual" | "government" | "non_profit";
  afm?: string;
  doy?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address_street?: string;
  address_number?: string;
  address_city?: string;
  address_postal_code?: string;
  address_region?: string;
  business_activity?: string;
  legal_form?: string;
  vat_number?: string;
  vat_exempt: boolean;
  payment_terms: string;
  credit_limit?: number;
  discount_percentage?: number;
  total_sales?: number;
  total_purchases?: number;
  status: string;
  roles: string[];
  created_at: string;
  updated_at: string;
  notes?: string;
}

export default function CustomerDetailPage() {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const customerId = params.id as string;
  const activeTab = searchParams.get("tab") || "overview";

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    if (!tokens?.accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/business-entities/${customerId}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load customer data");
      }

      const customerData = await response.json();
      setCustomer(customerData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard/customers");
  };

  const handleEdit = () => {
    router.push(`/dashboard/customers/${customerId}/edit`);
  };

  const handleAddContact = () => {
    router.push(`/dashboard/customers/${customerId}/contacts/create`);
  };

  const handleContactClick = (contact: any) => {
    router.push(`/dashboard/customers/${customerId}/contacts/${contact.id}`);
  };

  const handleContactEdit = (contact: any) => {
    router.push(
      `/dashboard/customers/${customerId}/contacts/${contact.id}/edit`
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "error" | "info"> = {
      active: "success",
      inactive: "warning",
      suspended: "error",
      prospect: "info",
      blocked: "error",
    };

    return (
      <Badge variant={variants[status] || "info"}>{status.toUpperCase()}</Badge>
    );
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "€0.00";
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("el-GR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <LoadingButton loading={true}>
              {t("loading_customer", { ns: "customers" })}
            </LoadingButton>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-500 text-lg mb-4">
                {error || t("customer_not_found", { ns: "customers" })}
              </div>
              <Button onClick={handleBack}>
                {t("back_to_customers", { ns: "customers" })}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>{t("back_to_customers", { ns: "customers" })}</span>
              </Button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {customer.display_name}
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(customer.status)}
                    {customer.afm && (
                      <Badge variant="info">AFM: {customer.afm}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {t("edit", { ns: "common" })}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            router.push(`/dashboard/customers/${customerId}?tab=${value}`);
          }}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <Eye className="h-4 w-4 mr-2" />
              {t("overview", { ns: "customers" })}
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Users className="h-4 w-4 mr-2" />
              {t("contacts", { ns: "customers" })}
            </TabsTrigger>
            <TabsTrigger value="addresses">
              <MapPin className="h-4 w-4 mr-2" />
              {t("addresses", { ns: "customers" })}
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              {t("activity", { ns: "customers" })}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("total_sales", { ns: "customers" })}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(customer.total_sales)}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                      <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("credit_limit", { ns: "customers" })}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(customer.credit_limit)}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                      <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("discount", { ns: "customers" })}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {customer.discount_percentage || 0}%
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                      <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {t("basic_information", { ns: "customers" })}
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {t("entity_type", { ns: "customers" })}:
                      </span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {customer.entity_type}
                      </div>
                    </div>

                    {customer.business_activity && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          {t("business_activity", { ns: "customers" })}:
                        </span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {customer.business_activity}
                        </div>
                      </div>
                    )}

                    {customer.legal_form && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          {t("legal_form", { ns: "customers" })}:
                        </span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {customer.legal_form}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {t("payment_terms", { ns: "customers" })}:
                      </span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {customer.payment_terms}
                      </div>
                    </div>
                  </div>

                  {customer.notes && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {customer.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    {t("contact_information", { ns: "customers" })}
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customer.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {customer.email}
                      </a>
                    </div>
                  )}

                  {customer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {customer.phone}
                      </a>
                    </div>
                  )}

                  {customer.mobile && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a
                        href={`tel:${customer.mobile}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {customer.mobile} ({t("mobile", { ns: "customers" })})
                      </a>
                    </div>
                  )}

                  {customer.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <a
                        href={customer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {customer.website}
                      </a>
                    </div>
                  )}

                  {(customer.address_street || customer.address_city) && (
                    <div className="flex items-start gap-3 mt-4">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="text-gray-900 dark:text-white">
                        {customer.address_street && customer.address_number && (
                          <div>
                            {customer.address_street} {customer.address_number}
                          </div>
                        )}
                        {customer.address_city && (
                          <div>
                            {customer.address_postal_code &&
                              `${customer.address_postal_code} `}
                            {customer.address_city}
                          </div>
                        )}
                        {customer.address_region && (
                          <div>{customer.address_region}</div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Audit Information */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t("audit_information", { ns: "customers" })}
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {t("created_at", { ns: "customers" })}:
                    </span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatDate(customer.created_at)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {t("updated_at", { ns: "customers" })}:
                    </span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatDate(customer.updated_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <ContactList
              businessEntityId={customerId}
              businessEntityName={customer.display_name}
              onCreateClick={handleAddContact}
              onContactClick={handleContactClick}
              onEditClick={handleContactEdit}
            />
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {t("addresses", { ns: "customers" })}
                  </h3>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("add_address", { ns: "customers" })}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  {t("address_management_coming_soon", { ns: "customers" })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  {t("activity_timeline", { ns: "customers" })}
                </h3>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  {t("activity_tracking_coming_soon", { ns: "customers" })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
