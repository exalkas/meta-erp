"use client";

// Shared UI Component Library with Greek Localization
// Export all components, hooks, contexts, and utilities

// Core Translation Infrastructure
export {
  TranslationProvider,
  useTranslation,
  useLanguage,
} from "./contexts/TranslationContext";
export { LanguageProvider } from "./contexts/LanguageContext";

// Theme Infrastructure
export {
  ThemeProvider,
  useTheme,
  type Theme,
  type ThemeContextValue,
} from "./contexts/ThemeContext";

// App constants and configurations (server-safe)
export { AppName, APP_CONFIGS } from "./types";
export { GreekLocaleProvider } from "./contexts/GreekLocaleContext";

// Authentication Context
export {
  AuthProvider,
  useAuth,
  type AuthUser,
  type AuthTokens,
  type AuthState,
  type LoginData,
  type AuthContextValue,
} from "./contexts/AuthenticationContext";

// Authentication Hooks
export { useAuthGuard } from "./hooks/useAuthGuard";

// Translation Hooks
export { useTranslationWithFallback } from "./hooks/useTranslationWithFallback";
export { useLanguageDetection } from "./hooks/useLanguageDetection";
export { useGreekLocalization } from "./hooks/useGreekLocalization";
export { useMetadataPage } from "./hooks/useMetadataPage";

// Basic UI Components ✅ PHASE 2 COMPLETE
export { Button, LoadingButton, IconButton } from "./components/ui/Button";
export { Label } from "./components/ui/Label";
export { Separator } from "./components/ui/Separator";
export { Input, PasswordInput } from "./components/ui/Input";
export { SimplePasswordInput } from "./components/ui/SimplePasswordInput";
export { Logo } from "./components/ui/Logo";
export { Textarea } from "./components/ui/Textarea";
export {
  Form,
  FormField,
  FormMessage,
  FormSection,
  FormActions,
} from "./components/ui/Form";
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "./components/ui/Card";
export { Skeleton } from "./components/ui/Skeleton";

// Advanced UI Components ✅ PHASE 7 COMPLETE
export {
  HorizontalButtonGroup,
  VerticalButtonGroup,
  AttachedButtonGroup,
  FullWidthButtonGroup,
} from "./components/ui/ButtonGroup";
export {
  default as Select,
  ModernSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/Select";
export { MultiSelect } from "./components/ui/MultiSelect";
export { DatePicker } from "./components/ui/DatePicker";
export { default as TimePicker } from "./components/ui/TimePicker";
export { DateRangePicker } from "./components/ui/DateRangePicker";
export { ImageUpload } from "./components/ui/ImageUpload";
export { Checkbox, Radio, RadioGroup, Switch } from "./components/ui/Checkbox";
export { Slider } from "./components/ui/Slider";

// Data Display Components ✅ PHASE 7 COMPLETE
export { InfoCard, StatsCard, ActionCard } from "./components/ui/InfoCard";

// List & Table Components ✅ PHASE 7 COMPLETE
export { List } from "./components/ui/List";
export { DataTable } from "./components/ui/DataTable";
export { SimpleTable } from "./components/ui/SimpleTable";

// Filtering & Search Components ✅ PHASE 7 COMPLETE
export { SearchInput } from "./components/ui/SearchInput";
export { QuickFilter } from "./components/ui/QuickFilter";

// Pagination Components ✅ PHASE 7 COMPLETE
export { Pagination } from "./components/ui/Pagination";
export { SimplePagination } from "./components/ui/SimplePagination";

// Modal & Dialog Components ✅ PHASE 7 COMPLETE
export { Modal } from "./components/ui/Modal";
export { ConfirmDialog } from "./components/ui/ConfirmDialog";
export { AlertDialog } from "./components/ui/AlertDialog";
export { FormModal } from "./components/ui/FormModal";
export { FullscreenModal } from "./components/ui/FullscreenModal";
export { DrawerModal } from "./components/ui/DrawerModal";

// Notification Components ✅ PHASE 7 COMPLETE
export { Toast } from "./components/ui/Toast";
export { Alert } from "./components/ui/Alert";
export { Banner } from "./components/ui/Banner";
export { NotificationCenter } from "./components/ui/NotificationCenter";
export { StatusIndicator } from "./components/ui/StatusIndicator";

// Advanced Navigation Components ✅ PHASE 7 COMPLETE
export {
  default as Tabs,
  ModernTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./components/ui/Tabs";
export { VerticalTabs } from "./components/ui/VerticalTabs";
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/Accordion";
export { Stepper } from "./components/ui/Stepper";
export { Sidebar } from "./components/ui/Sidebar";
export { Header } from "./components/ui/Header";
export { MultilingualNavigation } from "./components/ui/MultilingualNavigation";

// Advanced Layout Components ✅ PHASE 7 COMPLETE
export {
  Flex,
  FlexRow,
  FlexCol,
  FlexCenter,
  FlexBetween,
  FlexWrap,
} from "./components/ui/Flex";
export {
  Divider,
  HorizontalDivider,
  VerticalDivider,
  SectionDivider,
  InlineDivider,
} from "./components/ui/Divider";
export {
  Spacer,
  HorizontalSpacer,
  VerticalSpacer,
  FlexSpacer,
  FixedSpacer,
  SpacerXS,
  SpacerSM,
  SpacerMD,
  SpacerLG,
  SpacerXL,
  Spacer2XL,
  Spacer3XL,
} from "./components/ui/Spacer";

// Data Visualization Components ✅ PHASE 7 COMPLETE
export { DynamicChart } from "./components/ui/DynamicChart";
export { LineChart } from "./components/ui/LineChart";
export { BarChart } from "./components/ui/BarChart";
export { PieChart } from "./components/ui/PieChart";
export { KanbanBoard } from "./components/ui/KanbanBoard";
export { Timeline } from "./components/ui/Timeline";
export { CalendarView } from "./components/ui/CalendarView";

// Utility Components ✅ PHASE 7 COMPLETE
export { Tooltip } from "./components/ui/Tooltip";
export { Popover } from "./components/ui/Popover";
export { Dropdown } from "./components/ui/Dropdown";
export { Avatar, AvatarGroup } from "./components/ui/Avatar";
export { Badge } from "./components/ui/Badge";
export { Tag, TagGroup } from "./components/ui/Tag";
export {
  EmptyState,
  NoDataEmptyState,
  SearchEmptyState,
  ErrorEmptyState,
  LoadingEmptyState,
  NoUsersEmptyState,
  NoFilesEmptyState,
} from "./components/ui/EmptyState";
export {
  ErrorBoundary,
  withErrorBoundary,
} from "./components/ui/ErrorBoundary";

// Greek-Specific Components ✅ PHASE 3 & 7 COMPLETE
export { AFMInput } from "./components/greek/AFMInput";
export { DOYSelector } from "./components/greek/DOYSelector";
export { GreekPhoneInput } from "./components/greek/GreekPhoneInput";
export { GreekRegionSelector } from "./components/greek/GreekRegionSelector";
export { GreekAddressInput } from "./components/greek/GreekAddressInput";
export {
  GreekBusinessTermDisplay,
  getGreekBusinessTerm,
  searchGreekBusinessTerms,
} from "./components/greek/GreekBusinessTermDisplay";
export { GreekPostalCodeInput } from "./components/greek/GreekPostalCodeInput";

// Multilingual Components ✅ PHASE 4 & 7 COMPLETE
export { LanguageSelector } from "./components/multilingual/LanguageSelector";
export { ThemeSelector } from "./components/multilingual/ThemeSelector";
export { ThemeChooser } from "./components/multilingual/ThemeChooser";
export {
  LocalizedText,
  LocalizedHeading,
  LocalizedParagraph,
  LocalizedLabel,
  LocalizedButton,
  useLocalizedText,
} from "./components/multilingual/LocalizedText";
export { MultilingualInput } from "./components/multilingual/MultilingualInput";
export { MultilingualTextarea } from "./components/multilingual/MultilingualTextarea";
export { TranslationEditor } from "./components/multilingual/TranslationEditor";

// File Management Components ✅ PHASE 7 COMPLETE
export { FileManager } from "./components/file/FileManager";
export { FileUpload } from "./components/file/FileUpload";
export { FileDropzone } from "./components/file/FileDropzone";
export { FileCard } from "./components/file/FileCard";
export { FileList } from "./components/file/FileList";
export { FileGrid } from "./components/file/FileGrid";
export { FolderTree } from "./components/file/FolderTree";
export { FileProgress } from "./components/file/FileProgress";
export { FileTable } from "./components/file/FileTable";
export { FileVersions } from "./components/file/FileVersions";
export { FileSharing } from "./components/file/FileSharing";
export { FilePermissions } from "./components/file/FilePermissions";
export { FileSearch } from "./components/file/FileSearch";
export { FileFilter } from "./components/file/FileFilter";
export { StorageQuota } from "./components/file/StorageQuota";
export { FileAnalytics } from "./components/file/FileAnalytics";

// Business-Specific Components ✅ PHASE 7 COMPLETE
export { CustomerCard } from "./components/business/CustomerCard";
export { ProductCard } from "./components/business/ProductCard";
export { InvoiceCard } from "./components/business/InvoiceCard";
export { ActivityCard } from "./components/business/ActivityCard";
export { EntityCard } from "./components/business/EntityCard";

// Authentication Components
export { default as LoginForm } from "./components/auth/LoginForm";
export { default as MetadataLoginPage } from "./components/auth/MetadataLoginPage";
export {
  ProtectedRoute,
  withAuth,
  RoleGuard,
} from "./components/auth/ProtectedRoute";

// Dynamic components
export { MetadataDataTable } from "./components/dynamic/MetadataDataTable";
export { DynamicLayout } from "./components/dynamic/DynamicLayout";
export { DynamicPage } from "./components/dynamic/DynamicPage";

// Form Components ✅ PHASE 5 COMPLETE
export { DynamicForm } from "./components/forms/DynamicForm";

// Dynamic CRM Components ✅ INTEGRATION COMPLETE
export { EntityBuilder } from "./components/entity-builder/EntityBuilder";
export { FieldBuilder } from "./components/field-builder/FieldBuilder";
export { LayoutDesigner } from "./components/layout-designer/LayoutDesigner";
export { WidgetBuilder } from "./components/widget-system/WidgetBuilder";
export { FormWizard } from "./components/forms/FormWizard";
// Note: FormBuilder has TypeScript issues - will be fixed in future iteration
// export { FormBuilder } from "./components/forms/FormBuilder";

// Layout Components ✅ PHASE 6 COMPLETE
export {
  Container,
  PageContainer,
  CardContainer,
  SectionContainer,
} from "./components/layout/Container";
export {
  Grid,
  GridItem,
  DashboardGrid,
  FormGrid,
  CardGrid,
} from "./components/layout/Grid";
export {
  Stack,
  VStack,
  HStack,
  ButtonGroup,
  FormStack,
  NavStack,
  ActionStack,
  StackDivider,
} from "./components/layout/Stack";
export { Navigation, Breadcrumb } from "./components/layout/Navigation";

// Validation Utilities
export { greekValidationRules } from "./utils/greekValidation";
export { formatters } from "./utils/formatters";
export { constants } from "./utils/constants";

// Types
export type {
  Language,
  TranslationKey,
  TranslationOptions,
  LanguageDetectionOptions,
  GreekValidationRule,
  TranslationValue,
  TranslationNamespace,
  TranslationResources,
  LanguageResources,
  UserLanguagePreferences,
  TranslationContextValue,
  GreekLocaleSettings,
} from "./types";
export type { FormFieldType, FormSchema } from "./types/forms";
export type { GreekReferenceData } from "./types/greek";

// Icon Utilities
export {
  getIconComponent,
  isValidIconName,
  getAvailableIconNames,
  renderIcon,
  type IconName,
} from "./utils/iconMapper";

// Custom Hooks
export { useGreekValidation } from "./hooks/useGreekValidation";
export { useForm } from "./hooks/useForm";
export { useModal } from "./hooks/useModal";
export { useDebounce } from "./hooks/useDebounce";

// Contact Management
export { default as ContactForm } from "./components/contacts/ContactForm";

// Export all services
export * from "./services";
