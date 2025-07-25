"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Badge,
  LoadingButton,
  GreekPhoneInput,
  useTranslation,
  useAuth,
} from "../..";
import {
  ModernSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { Switch } from "../ui/Switch";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import {
  User,
  Users,
  Mail,
  Phone,
  Building2,
  Star,
  Crown,
  Shield,
  Settings,
  MessageCircle,
  Calendar,
  Globe,
  Check,
  X,
  AlertCircle,
  Info,
} from "lucide-react";

// Contact types based on our API model
export type ContactType =
  | "primary"
  | "secondary"
  | "billing"
  | "technical"
  | "sales"
  | "support";

export type ContactStatus = "active" | "inactive" | "suspended" | "archived";

export type PreferredContactMethod = "email" | "phone" | "meeting" | "sms";

// Validation schema
const createContactSchema = (t: any) =>
  z.object({
    // Basic information
    first_name: z.string().min(
      1,
      t("validation.first_name_required", {
        ns: "contacts",
        defaultValue: "First name is required",
      })
    ),
    last_name: z.string().min(
      1,
      t("validation.last_name_required", {
        ns: "contacts",
        defaultValue: "Last name is required",
      })
    ),
    display_name: z.string().optional(),

    // Professional information
    job_title: z.string().optional(),
    department: z.string().optional(),

    // Contact information
    email: z
      .string()
      .email(
        t("validation.invalid_email", {
          ns: "contacts",
          defaultValue: "Invalid email format",
        })
      )
      .optional()
      .or(z.literal("")),
    phone: z.string().optional(),
    mobile: z.string().optional(),

    // Contact settings
    contact_type: z.enum([
      "primary",
      "secondary",
      "billing",
      "technical",
      "sales",
      "support",
    ]),
    status: z.enum(["active", "inactive", "suspended", "archived"]),
    is_primary_contact: z.boolean(),
    is_decision_maker: z.boolean(),

    // Communication preferences
    preferred_contact_method: z.enum(["email", "phone", "meeting", "sms"]),
    language: z.enum(["el", "en"]),

    // Marketing preferences
    marketing_consent: z.boolean(),
    newsletter_subscription: z.boolean(),
    email_opt_in: z.boolean(),
    sms_opt_in: z.boolean(),

    // Notes
    notes: z.string().optional(),
  });

type ContactFormData = z.infer<ReturnType<typeof createContactSchema>>;

interface ContactFormProps {
  businessEntityId: string;
  businessEntityName?: string;
  contactId?: string; // For editing existing contact
  initialData?: Partial<ContactFormData>;
  mode?: "create" | "edit";
  onSuccess?: (contact: any) => void;
  onCancel?: () => void;
  className?: string;
}

export default function ContactForm({
  businessEntityId,
  businessEntityName,
  contactId,
  initialData,
  mode = "create",
  onSuccess,
  onCancel,
  className = "",
}: ContactFormProps) {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(createContactSchema(t)),
    defaultValues: {
      first_name: "",
      last_name: "",
      display_name: "",
      job_title: "",
      department: "",
      email: "",
      phone: "",
      mobile: "",
      contact_type: "primary",
      status: "active",
      is_primary_contact: false,
      is_decision_maker: false,
      preferred_contact_method: "email",
      language: "el",
      marketing_consent: false,
      newsletter_subscription: false,
      email_opt_in: true,
      sms_opt_in: false,
      notes: "",
      ...initialData,
    },
  });

  // Watch for name changes to auto-generate display name
  const firstName = form.watch("first_name");
  const lastName = form.watch("last_name");
  const contactType = form.watch("contact_type");
  const isPrimary = form.watch("is_primary_contact");

  useEffect(() => {
    if (firstName && lastName && !form.getValues("display_name")) {
      form.setValue("display_name", `${firstName} ${lastName}`);
    }
  }, [firstName, lastName, form]);

  // Load existing contact data for editing
  useEffect(() => {
    if (mode === "edit" && contactId) {
      loadContactData();
    }
  }, [mode, contactId]);

  const loadContactData = async () => {
    if (!tokens?.accessToken || !contactId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load contact data");
      }

      const contactData = await response.json();

      // Map API response to form data
      form.reset({
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        display_name: contactData.display_name,
        job_title: contactData.job_title,
        department: contactData.department,
        email: contactData.email,
        phone: contactData.phone,
        mobile: contactData.mobile,
        contact_type: contactData.contact_type,
        status: contactData.status,
        is_primary_contact: contactData.is_primary_contact,
        is_decision_maker: contactData.is_decision_maker,
        preferred_contact_method: contactData.preferred_contact_method,
        language: contactData.language,
        marketing_consent: contactData.marketing_consent,
        newsletter_subscription: contactData.newsletter_subscription,
        email_opt_in: contactData.email_opt_in,
        sms_opt_in: contactData.sms_opt_in,
        notes: contactData.notes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contact");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ContactFormData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const requestData = {
        ...data,
        business_entity_id: businessEntityId,
      };

      const url =
        mode === "create"
          ? "/api/v1/contacts/"
          : `/api/v1/contacts/${contactId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${mode} contact`);
      }

      const contact = await response.json();
      setSuccess(
        `Contact ${mode === "create" ? "created" : "updated"} successfully!`
      );

      if (onSuccess) {
        onSuccess(contact);
      }

      // Reset form if creating new contact
      if (mode === "create") {
        form.reset();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${mode} contact`
      );
    } finally {
      setLoading(false);
    }
  };

  const getContactTypeIcon = (type: ContactType) => {
    const icons = {
      primary: <Star className="w-4 h-4" />,
      secondary: <User className="w-4 h-4" />,
      billing: <Building2 className="w-4 h-4" />,
      technical: <Settings className="w-4 h-4" />,
      sales: <Crown className="w-4 h-4" />,
      support: <Shield className="w-4 h-4" />,
    };
    return icons[type];
  };

  const getContactTypeColor = (type: ContactType) => {
    const colors = {
      primary: "bg-yellow-100 text-yellow-800",
      secondary: "bg-blue-100 text-blue-800",
      billing: "bg-green-100 text-green-800",
      technical: "bg-purple-100 text-purple-800",
      sales: "bg-orange-100 text-orange-800",
      support: "bg-indigo-100 text-indigo-800",
    };
    return colors[type];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <User className="w-6 h-6" />
          {mode === "create"
            ? t("create_contact", { ns: "contacts" })
            : t("edit_contact", { ns: "contacts" })}
        </h2>
        {businessEntityName && (
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {t("for_business_entity", { ns: "contacts" })}: {businessEntityName}
          </p>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-green-800 dark:text-green-200">
              {success}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              {t("basic_information", { ns: "contacts" })}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">
                  {t("first_name", { ns: "contacts" })} *
                </Label>
                <Controller
                  name="first_name"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="first_name"
                      error={form.formState.errors.first_name?.message}
                    />
                  )}
                />
              </div>

              <div>
                <Label htmlFor="last_name">
                  {t("last_name", { ns: "contacts" })} *
                </Label>
                <Controller
                  name="last_name"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="last_name"
                      error={form.formState.errors.last_name?.message}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="display_name">
                {t("display_name", { ns: "contacts" })}
              </Label>
              <Controller
                name="display_name"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="display_name"
                    placeholder={t("auto_generated", { ns: "contacts" })}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job_title">
                  {t("job_title", { ns: "contacts" })}
                </Label>
                <Controller
                  name="job_title"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="job_title"
                      placeholder={t("job_title_placeholder", {
                        ns: "contacts",
                      })}
                    />
                  )}
                />
              </div>

              <div>
                <Label htmlFor="department">
                  {t("department", { ns: "contacts" })}
                </Label>
                <Controller
                  name="department"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="department"
                      placeholder={t("department_placeholder", {
                        ns: "contacts",
                      })}
                    />
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Type & Role */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t("contact_type_and_role", { ns: "contacts" })}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contact_type">
                {t("contact_type", { ns: "contacts" })} *
              </Label>
              <Controller
                name="contact_type"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("select_contact_type", {
                          ns: "contacts",
                        })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>
                            {t("primary_contact", { ns: "contacts" })}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="secondary">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span>
                            {t("secondary_contact", { ns: "contacts" })}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="billing">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-green-500" />
                          <span>
                            {t("billing_contact", { ns: "contacts" })}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="technical">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-purple-500" />
                          <span>
                            {t("technical_contact", { ns: "contacts" })}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="sales">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-orange-500" />
                          <span>{t("sales_contact", { ns: "contacts" })}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="support">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-indigo-500" />
                          <span>
                            {t("support_contact", { ns: "contacts" })}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <div className="mt-2">
                <Badge className={getContactTypeColor(contactType)}>
                  {getContactTypeIcon(contactType)}
                  <span className="ml-1">
                    {t(`${contactType}_contact`, { ns: "contacts" })}
                  </span>
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="is_primary_contact"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="is_primary_contact"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="is_primary_contact" className="text-sm">
                  {t("is_primary_contact", { ns: "contacts" })}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="is_decision_maker"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="is_decision_maker"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="is_decision_maker" className="text-sm">
                  {t("is_decision_maker", { ns: "contacts" })}
                </Label>
              </div>
            </div>

            {isPrimary && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center">
                  <Info className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    {t("primary_contact_info", { ns: "contacts" })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {t("contact_information", { ns: "contacts" })}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">{t("email", { ns: "contacts" })}</Label>
              <Controller
                name="email"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    leftIcon={<Mail className="w-4 h-4" />}
                    placeholder={t("email_placeholder", { ns: "contacts" })}
                    error={form.formState.errors.email?.message}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field }) => (
                    <GreekPhoneInput
                      {...field}
                      label={t("phone", { ns: "contacts" })}
                      allowLandline={true}
                      allowMobile={false}
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="mobile"
                  control={form.control}
                  render={({ field }) => (
                    <GreekPhoneInput
                      {...field}
                      label={t("mobile", { ns: "contacts" })}
                      allowLandline={false}
                      allowMobile={true}
                    />
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communication Preferences */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {t("communication_preferences", { ns: "contacts" })}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferred_contact_method">
                  {t("preferred_contact_method", { ns: "contacts" })}
                </Label>
                <Controller
                  name="preferred_contact_method"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{t("email", { ns: "contacts" })}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="phone">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{t("phone", { ns: "contacts" })}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="meeting">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{t("meeting", { ns: "contacts" })}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="sms">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span>{t("sms", { ns: "contacts" })}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="language">
                  {t("language", { ns: "contacts" })}
                </Label>
                <Controller
                  name="language"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="el">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span>{t("greek", { ns: "contacts" })}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="en">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span>{t("english", { ns: "contacts" })}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("marketing_preferences", { ns: "contacts" })}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="marketing_consent"
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id="marketing_consent"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="marketing_consent" className="text-sm">
                    {t("marketing_consent", { ns: "contacts" })}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    name="newsletter_subscription"
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id="newsletter_subscription"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="newsletter_subscription" className="text-sm">
                    {t("newsletter_subscription", { ns: "contacts" })}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    name="email_opt_in"
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id="email_opt_in"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="email_opt_in" className="text-sm">
                    {t("email_opt_in", { ns: "contacts" })}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    name="sms_opt_in"
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id="sms_opt_in"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="sms_opt_in" className="text-sm">
                    {t("sms_opt_in", { ns: "contacts" })}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              {t("notes", { ns: "contacts" })}
            </h3>
          </CardHeader>
          <CardContent>
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder={t("notes_placeholder", { ns: "contacts" })}
                  rows={3}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              {t("cancel", { ns: "common" })}
            </Button>
          )}

          <LoadingButton
            type="submit"
            loading={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            {mode === "create"
              ? t("create_contact", { ns: "contacts" })
              : t("update_contact", { ns: "contacts" })}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
