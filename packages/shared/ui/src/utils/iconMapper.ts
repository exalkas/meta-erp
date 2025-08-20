/**
 * Global Icon Mapper - Metadata-Driven Platform
 *
 * Converts string icon names from metadata to actual Lucide React components.
 * Used throughout the platform to ensure consistent icon rendering.
 */

import React from "react";
import {
  // Layout & Navigation
  LayoutDashboard,
  Menu,
  Home,
  Settings,
  Users,
  User,
  UserCheck,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,

  // Actions & Controls
  Plus,
  Minus,
  X,
  Check,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Sliders,

  // Business & Tools
  Wrench,
  Puzzle,
  Layout,
  Building,
  Briefcase,
  FileText,
  File,
  Folder,
  FolderOpen,

  // Status & Indicators
  Activity,
  Heart,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Bell,
  Clock,
  Calendar,

  // Auth & Security
  LogOut,
  LogIn,
  Lock,
  Unlock,
  Shield,
  Eye,
  EyeOff,
  Key,

  // Communication
  Mail,
  Phone,
  MessageSquare,
  Send,

  // Media & Content
  Image,
  Video,
  Music,
  Camera,

  // Finance & Commerce
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,

  // Development & Tech
  Code,
  Terminal,
  Database,
  Server,
  Cpu,
  HardDrive,

  // Location & Travel
  MapPin,
  Globe,
  Navigation,

  // Miscellaneous
  Star,
  Bookmark,
  Tag,
  Package,
  Gift,
  Zap,
  Sun,
  Moon,
  Headphones,

  // Greek Business Specific
  Calculator,
  Receipt,
  CreditCard as BankCard,
} from "lucide-react";

// Icon mapping object
const ICON_MAP = {
  // Layout & Navigation
  LayoutDashboard: LayoutDashboard,
  Menu: Menu,
  Home: Home,
  Settings: Settings,
  Users: Users,
  User: User,
  UserCheck: UserCheck,
  ChevronDown: ChevronDown,
  ChevronRight: ChevronRight,
  ChevronLeft: ChevronLeft,
  ChevronUp: ChevronUp,

  // Actions & Controls
  Plus: Plus,
  Minus: Minus,
  X: X,
  Check: Check,
  Edit: Edit,
  Trash2: Trash2,
  Save: Save,
  Download: Download,
  Upload: Upload,
  Search: Search,
  Filter: Filter,
  RefreshCw: RefreshCw,
  Sliders: Sliders,

  // Business & Tools
  Wrench: Wrench,
  Puzzle: Puzzle,
  Layout: Layout,
  Building: Building,
  Briefcase: Briefcase,
  FileText: FileText,
  File: File,
  Folder: Folder,
  FolderOpen: FolderOpen,

  // Status & Indicators
  Activity: Activity,
  Heart: Heart,
  AlertCircle: AlertCircle,
  CheckCircle: CheckCircle,
  XCircle: XCircle,
  Info: Info,
  AlertTriangle: AlertTriangle,
  Warning: AlertTriangle, // Alias for AlertTriangle
  Bell: Bell,
  Clock: Clock,
  Calendar: Calendar,

  // Auth & Security
  LogOut: LogOut,
  LogIn: LogIn,
  Lock: Lock,
  Unlock: Unlock,
  Shield: Shield,
  Eye: Eye,
  EyeOff: EyeOff,
  Key: Key,

  // Communication
  Mail: Mail,
  Phone: Phone,
  MessageSquare: MessageSquare,
  Send: Send,

  // Media & Content
  Image: Image,
  Video: Video,
  Music: Music,
  Camera: Camera,

  // Finance & Commerce
  DollarSign: DollarSign,
  CreditCard: CreditCard,
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  BarChart3: BarChart3,
  PieChart: PieChart,

  // Development & Tech
  Code: Code,
  Terminal: Terminal,
  Database: Database,
  Server: Server,
  Cpu: Cpu,
  HardDrive: HardDrive,

  // Location & Travel
  MapPin: MapPin,
  Globe: Globe,
  Navigation: Navigation,

  // Miscellaneous
  Star: Star,
  Bookmark: Bookmark,
  Tag: Tag,
  Package: Package,
  Gift: Gift,
  Zap: Zap,
  Sun: Sun,
  Moon: Moon,
  Headphones: Headphones,

  // Greek Business Specific
  Calculator: Calculator,
  Receipt: Receipt,
  BankCard: BankCard,

  // Legacy compatibility (lowercase variants)
  users: Users,
  trending: TrendingUp,
  star: Star,
  shield: Shield,
  chart: BarChart3,
  activity: Activity,
  alert: AlertCircle,
  check: CheckCircle,
  clock: Clock,
  dollar: DollarSign,
  package: Package,
  usercheck: UserCheck,
  zap: Zap,
} as const;

export type IconName = keyof typeof ICON_MAP;

/**
 * Get Lucide React component from string icon name
 * @param iconName - String name of the icon
 * @returns Lucide React component or null if not found
 */
export const getIconComponent = (iconName: string) => {
  return ICON_MAP[iconName as IconName] || null;
};

/**
 * Check if an icon name exists in the mapping
 * @param iconName - String name of the icon
 * @returns boolean
 */
export const isValidIconName = (iconName: string): iconName is IconName => {
  return iconName in ICON_MAP;
};

/**
 * Get all available icon names
 * @returns Array of all available icon names
 */
export const getAvailableIconNames = (): IconName[] => {
  return Object.keys(ICON_MAP) as IconName[];
};

/**
 * Render icon with optional fallback
 * @param iconName - String name of the icon
 * @param className - CSS classes to apply
 * @param fallback - Fallback to render if icon not found
 * @returns JSX element or fallback
 */
export const renderIcon = (
  iconName: string,
  className?: string,
  fallback?: React.ReactNode
) => {
  const IconComponent = getIconComponent(iconName);

  if (IconComponent) {
    return React.createElement(IconComponent, { className });
  }

  // Return fallback or icon name as text
  return fallback || React.createElement("span", { className }, iconName);
};

export default {
  getIconComponent,
  isValidIconName,
  getAvailableIconNames,
  renderIcon,
  ICON_MAP,
};
