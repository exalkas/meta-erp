# Business Configuration & Greek Tax Complexity Specification

## Document Information

- **Document ID**: 34
- **Title**: Business Configuration & Greek Tax Complexity Management
- **Version**: 1.0
- **Date**: January 2025
- **Purpose**: Handle diverse business types, complex VAT scenarios, and flexible product/service management

---

## 1. EXECUTIVE SUMMARY

### 1.1 Business Challenge

Greek businesses operate under **highly complex and dynamic tax scenarios** that vary by:

- **Business Type**: Doctors, engineers, retail, hospitality, etc.
- **Location**: Islands with reduced VAT, mainland, special economic zones
- **Service Context**: Take-away vs dine-in, online vs physical, B2B vs B2C
- **Product Variants**: Color/size variants vs simple quantities
- **Regulatory Changes**: VAT rules change frequently (doctors may get VAT in 3 years)

### 1.2 Solution Overview

**Dynamic Business Configuration System** that:

- **Adapts to Any Business Type**: Doctors, engineers, retail, hospitality, manufacturing
- **Handles Complex VAT Logic**: Location-based, context-based, profession-based VAT calculations
- **Flexible Product/Service Management**: Support variants, simple quantities, services, bundles
- **Future-Proof Tax Changes**: Easy updates when Greek tax laws change
- **Guided Setup**: Installation wizard configures system based on business type and location

### 1.3 Key Features

- **Business Type Templates**: Pre-configured setups for different professions
- **Dynamic VAT Engine**: Context-aware VAT calculation based on multiple criteria
- **Product/Service Flexibility**: Support any product complexity level
- **Location Intelligence**: Greek island VAT, special zones, address-based tax rules
- **Regulatory Update System**: Easy updates when tax laws change
- **Installation Wizard**: SAAS and local installation guided setup

---

## 2. BUSINESS TYPE CONFIGURATION

### 2.1 Business Type Templates

**Pre-configured Business Templates:**

```
┌─ Business Type Selection ─────────────────────────────────────────────┐
│ Select your business type for automatic configuration:                │
│ ──────────────────────────────────────────────────────────────────── │
│ ┌─ Healthcare ─────────────────────────────────────────────────────────┐ │
│ │ [👩‍⚕️] Doctors/Medical Practice                                      │ │
│ │ • No VAT (currently)                                                │ │
│ │ • Patient records                                                   │ │
│ │ • Medical services billing                                          │ │
│ │ • GDPR compliance for health data                                   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Professional Services ──────────────────────────────────────────────┐ │
│ │ [👷] Engineers/Architects/Lawyers                                    │ │
│ │ • Project-based billing                                             │ │
│ │ • Time tracking                                                     │ │
│ │ • Professional certification tracking                               │ │
│ │ • Standard VAT rates                                                │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Retail & Commerce ──────────────────────────────────────────────────┐ │
│ │ [🛍️] Retail Stores/E-commerce                                       │ │
│ │ • Product variants (color, size)                                    │ │
│ │ • Inventory management                                              │ │
│ │ • POS integration                                                   │ │
│ │ • Location-based VAT                                                │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Hospitality & Food Service ─────────────────────────────────────────┐ │
│ │ [☕] Restaurants/Cafes/Hotels                                        │ │
│ │ • Take-away vs dine-in VAT                                          │ │
│ │ • Table management                                                  │ │
│ │ • Tourism tax integration                                           │ │
│ │ • Seasonal pricing                                                  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Education ──────────────────────────────────────────────────────────┐ │
│ │ [🎓] Schools/Training Centers                                        │ │
│ │ • No VAT (currently)                                                │ │
│ │ • Student management                                                │ │
│ │ • Course scheduling                                                 │ │
│ │ • Certification tracking                                            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Manufacturing & Construction ────────────────────────────────────────┐ │
│ │ [🏭] Manufacturing/Construction                                      │ │
│ │ • Bill of materials                                                 │ │
│ │ • Project costing                                                   │ │
│ │ • Equipment tracking                                                │ │
│ │ • Multi-location VAT                                                │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Custom Configuration ───────────────────────────────────────────────┐ │
│ │ [⚙️] Custom Business Type                                            │ │
│ │ • Manual configuration                                              │ │
│ │ • Custom tax rules                                                  │ │
│ │ • Flexible setup                                                    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ──────────────────────────────────────────────────────────────────── │
│ [Continue with Selected Type] [View All Features] [Custom Setup]      │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Business Configuration Data Model

```typescript
interface BusinessConfiguration {
  id: string;
  companyId: string;

  // Business Type
  businessType: BusinessType;
  businessSubtype?: string;
  industry: string;

  // Location Configuration
  primaryLocation: GreekBusinessLocation;
  additionalLocations: GreekBusinessLocation[];

  // Tax Configuration
  vatConfiguration: VATConfiguration;
  taxExemptions: TaxExemption[];

  // Product/Service Configuration
  productConfiguration: ProductConfiguration;
  serviceConfiguration: ServiceConfiguration;

  // Operational Settings
  operationalSettings: OperationalSettings;

  // Compliance Requirements
  complianceRequirements: ComplianceRequirement[];

  // Custom Settings
  customFields: Record<string, any>;

  // Metadata
  configuredBy: string;
  configuredAt: Date;
  lastUpdated: Date;
  configurationVersion: string;
}

enum BusinessType {
  HEALTHCARE = "healthcare",
  PROFESSIONAL_SERVICES = "professional_services",
  RETAIL = "retail",
  ECOMMERCE = "ecommerce",
  HOSPITALITY = "hospitality",
  FOOD_SERVICE = "food_service",
  EDUCATION = "education",
  MANUFACTURING = "manufacturing",
  CONSTRUCTION = "construction",
  LOGISTICS = "logistics",
  TOURISM = "tourism",
  CUSTOM = "custom",
}

interface GreekBusinessLocation {
  id: string;
  name: string;
  address: GreekAddress;
  locationType: "mainland" | "island" | "special_zone";

  // Greek-specific location data
  prefecture: string;
  municipality: string;
  postalCode: string;
  doyCode: string;

  // Tax implications
  vatZone: VATZone;
  specialTaxRules: SpecialTaxRule[];

  // Island-specific data
  islandGroup?:
    | "cyclades"
    | "dodecanese"
    | "ionian"
    | "aegean"
    | "crete"
    | "other";
  reducedVATEligible: boolean;

  // Tourism/seasonal data
  touristArea: boolean;
  seasonalRules: SeasonalRule[];
}

enum VATZone {
  STANDARD = "standard", // 24% standard rate
  REDUCED_ISLAND = "reduced_island", // Reduced rates for islands
  SPECIAL_ZONE = "special_zone", // Special economic zones
  VAT_EXEMPT = "vat_exempt", // No VAT (doctors, education)
}
```

---

## 3. DYNAMIC VAT ENGINE

### 3.1 Complex VAT Calculation Logic

**Multi-Criteria VAT Determination:**

```typescript
interface VATCalculationContext {
  // Business Context
  businessType: BusinessType;
  businessLocation: GreekBusinessLocation;

  // Customer Context
  customerLocation: GreekBusinessLocation;
  customerType: "individual" | "business";

  // Product/Service Context
  item: ProductOrService;
  itemCategory: string;

  // Transaction Context
  transactionType: "sale" | "service" | "rental" | "subscription";
  deliveryMethod: "pickup" | "delivery" | "digital" | "in_person";
  consumptionMethod?: "takeaway" | "dine_in" | "online" | "offline";

  // Timing Context
  transactionDate: Date;
  season?: "peak" | "off_peak";

  // Location Context
  serviceLocation?: GreekBusinessLocation;
  deliveryLocation?: GreekBusinessLocation;
}

interface VATCalculationResult {
  vatRate: number;
  vatAmount: number;
  netAmount: number;
  totalAmount: number;

  // Explanation
  vatRuleApplied: string;
  vatRuleDescription: string;
  exemptionReason?: string;

  // Greek-specific
  aadeVATCode: string;
  vatCategoryDescription: string;

  // Future-proofing
  effectiveFrom: Date;
  effectiveTo?: Date;
  regulatoryReference: string;
}

class GreekVATEngine {
  calculateVAT(context: VATCalculationContext): VATCalculationResult {
    // 1. Check for VAT exemptions (doctors, education)
    const exemption = this.checkVATExemptions(context);
    if (exemption) {
      return this.createExemptResult(context, exemption);
    }

    // 2. Determine base VAT rate by business type and item
    let vatRate = this.getBaseVATRate(context);

    // 3. Apply location-based adjustments (islands)
    vatRate = this.applyLocationAdjustments(vatRate, context);

    // 4. Apply consumption method adjustments (takeaway vs dine-in)
    vatRate = this.applyConsumptionAdjustments(vatRate, context);

    // 5. Apply seasonal/tourism adjustments
    vatRate = this.applySeasonalAdjustments(vatRate, context);

    // 6. Calculate amounts
    return this.calculateAmounts(vatRate, context);
  }

  private applyConsumptionAdjustments(
    vatRate: number,
    context: VATCalculationContext
  ): number {
    // Coffee shop example: takeaway 10%, dine-in 24%
    if (context.businessType === BusinessType.FOOD_SERVICE) {
      if (context.consumptionMethod === "takeaway") {
        return 0.1; // 10% for takeaway
      } else if (context.consumptionMethod === "dine_in") {
        return 0.24; // 24% for dine-in
      }
    }

    return vatRate;
  }

  private applyLocationAdjustments(
    vatRate: number,
    context: VATCalculationContext
  ): number {
    // Island reduced VAT
    if (context.customerLocation?.reducedVATEligible) {
      switch (context.customerLocation.islandGroup) {
        case "dodecanese":
        case "cyclades":
          return vatRate * 0.7; // 30% reduction for certain islands
        case "aegean":
          return vatRate * 0.8; // 20% reduction
        default:
          return vatRate * 0.9; // 10% reduction for other islands
      }
    }

    return vatRate;
  }
}
```

### 3.2 VAT Rule Configuration Interface

**Dynamic VAT Rules Management:**

```
┌─ VAT Rules Configuration ────────────────────────────────────────────┐
│ Manage VAT rules for complex scenarios                               │
│ ──────────────────────────────────────────────────────────────────── │
│ ┌─ Business Type Rules ────────────────────────────────────────────────┐ │
│ │ Healthcare (Doctors):                                              │ │
│ │ [☑] VAT Exempt (0%) [⚠️ May change in 2028]                       │ │
│ │ Rule: Professional medical services                                │ │
│ │ Effective: 2010-01-01 to 2027-12-31 (estimated)                   │ │
│ │                                                                    │ │
│ │ Education:                                                         │ │
│ │ [☑] VAT Exempt (0%) [⚠️ Subject to change]                        │ │
│ │ Rule: Educational services                                         │ │
│ │ Effective: Current legislation                                     │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Location-Based Rules ───────────────────────────────────────────────┐ │
│ │ Islands - Reduced VAT:                                             │ │
│ │ [☑] Dodecanese: 30% reduction (16.8% instead of 24%)              │ │
│ │ [☑] Cyclades: 30% reduction                                       │ │
│ │ [☑] North Aegean: 20% reduction (19.2% instead of 24%)            │ │
│ │ [☑] Ionian: 10% reduction (21.6% instead of 24%)                  │ │
│ │                                                                    │ │
│ │ [+ Add Island Group] [Edit Reductions] [View Map]                 │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Consumption Method Rules ───────────────────────────────────────────┐ │
│ │ Food & Beverage:                                                   │ │
│ │ [☑] Takeaway/Delivery: 13% VAT                                     │ │
│ │ [☑] Dine-in/Table Service: 24% VAT                                 │ │
│ │ [☑] Hotel Restaurant: 13% VAT (tourism)                           │ │
│ │                                                                    │ │
│ │ [+ Add Consumption Rule] [Edit Rates] [Test Scenarios]            │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Product Category Rules ─────────────────────────────────────────────┐ │
│ │ Books & Publications: 6% VAT                                       │ │
│ │ Food Products: 13% VAT                                             │ │
│ │ Medicine: 6% VAT                                                   │ │
│ │ Luxury Items: 24% VAT                                              │ │
│ │ Digital Services: 24% VAT                                          │ │
│ │                                                                    │ │
│ │ [+ Add Category] [Import Standard Categories] [Bulk Edit]          │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ──────────────────────────────────────────────────────────────────── │
│ [Save Rules] [Test VAT Calculation] [Export Rules] [Regulatory Update] │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. FLEXIBLE PRODUCT & SERVICE MANAGEMENT

### 4.1 Product Complexity Levels

**Adaptive Product Models:**

```typescript
interface ProductBase {
  id: string;
  name: string;
  description: string;
  category: string;

  // Basic pricing
  basePrice: number;
  currency: string;

  // Tax information
  vatCategory: string;
  taxExempt: boolean;

  // Business type specific fields
  businessTypeFields: Record<string, any>;
}

// Simple Products (quantity only)
interface SimpleProduct extends ProductBase {
  productType: "simple";

  // Simple inventory
  stockQuantity: number;
  minimumStock: number;

  // Simple pricing
  wholesalePrice?: number;
  retailPrice?: number;
}

// Variable Products (color, size, etc.)
interface VariableProduct extends ProductBase {
  productType: "variable";

  // Variants
  variants: ProductVariant[];
  variantAttributes: VariantAttribute[];

  // Variant-specific pricing
  pricingStrategy: "uniform" | "variant_specific";
}

interface ProductVariant {
  id: string;
  parentProductId: string;

  // Variant attributes
  attributes: Record<string, string>; // { "color": "red", "size": "L" }
  sku: string;

  // Variant-specific data
  price?: number; // If different from base
  stockQuantity: number;
  weight?: number;
  dimensions?: ProductDimensions;

  // Images and files
  images: string[];
  documents: string[];
}

interface VariantAttribute {
  id: string;
  name: string; // "Color", "Size", "Material"
  type: "color" | "size" | "text" | "number";
  values: VariantAttributeValue[];
  required: boolean;
  displayOrder: number;
}

interface VariantAttributeValue {
  id: string;
  value: string; // "Red", "Large", "Cotton"
  displayName: string;
  colorCode?: string; // For color attributes
  sortOrder: number;
}

// Service Products
interface ServiceProduct extends ProductBase {
  productType: "service";

  // Service-specific
  duration?: number; // minutes
  serviceType: "consultation" | "project" | "subscription" | "hourly";

  // Booking/scheduling
  bookable: boolean;
  advanceBookingDays?: number;

  // Professional services (doctors, engineers)
  requiresLicense?: boolean;
  certificationRequired?: string[];
}

// Bundle Products
interface BundleProduct extends ProductBase {
  productType: "bundle";

  // Bundle components
  bundleItems: BundleItem[];
  bundleType: "fixed" | "configurable";

  // Bundle pricing
  bundleDiscount?: number;
  bundleDiscountType: "percentage" | "fixed";
}

interface BundleItem {
  productId: string;
  quantity: number;
  optional: boolean;
  variantId?: string; // For variable products
}
```

### 4.2 Product Configuration by Business Type

**Business-Specific Product Setup:**

```
┌─ Product Configuration for Retail Business ──────────────────────────┐
│ Configure products based on your business needs                      │
│ ──────────────────────────────────────────────────────────────────── │
│ Product Complexity: [● Variable Products (Color/Size)] [○ Simple]    │
│ ──────────────────────────────────────────────────────────────────── │
│ ┌─ Variant Attributes ─────────────────────────────────────────────────┐ │
│ │ ☑ Color (Required)     Values: [Red] [Blue] [Green] [+ Add]       │ │
│ │ ☑ Size (Required)      Values: [XS] [S] [M] [L] [XL] [+ Add]      │ │
│ │ ☐ Material (Optional)  Values: [Cotton] [Polyester] [+ Add]       │ │
│ │ ☐ Pattern (Optional)   Values: [Solid] [Striped] [+ Add]          │ │
│ │                                                                    │ │
│ │ [+ Add Attribute] [Reorder] [Import from Template]                │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Inventory Settings ─────────────────────────────────────────────────┐ │
│ │ ☑ Track stock by variant                                           │ │
│ │ ☑ Low stock alerts                                                 │ │
│ │ ☑ Automatic reorder points                                         │ │
│ │ ☐ Lot/batch tracking                                               │ │
│ │ ☐ Expiration date tracking                                         │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Pricing Strategy ───────────────────────────────────────────────────┐ │
│ │ [● Uniform pricing] [○ Variant-specific pricing]                   │ │
│ │ ☑ Wholesale pricing tiers                                          │ │
│ │ ☑ Volume discounts                                                 │ │
│ │ ☑ Seasonal pricing                                                 │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ──────────────────────────────────────────────────────────────────── │
│ [Save Configuration] [Test with Sample Product] [View Examples]      │
└──────────────────────────────────────────────────────────────────────┘

┌─ Service Configuration for Healthcare Business ──────────────────────┐
│ Configure services for medical practice                              │
│ ──────────────────────────────────────────────────────────────────── │
│ Service Type: [● Medical Consultation] [○ Treatment] [○ Procedure]   │
│ ──────────────────────────────────────────────────────────────────── │
│ ┌─ Service Settings ───────────────────────────────────────────────────┐ │
│ │ ☑ Appointment booking required                                     │ │
│ │ ☑ Patient history tracking                                         │ │
│ │ ☑ Prescription management                                          │ │
│ │ ☑ Insurance billing integration                                    │ │
│ │ ☐ Equipment/room booking                                           │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Compliance Settings ────────────────────────────────────────────────┐ │
│ │ ☑ GDPR compliance for health data                                  │ │
│ │ ☑ Medical license validation                                       │ │
│ │ ☑ VAT exempt (medical services)                                    │ │
│ │ ☑ Greek medical association integration                            │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Billing Configuration ──────────────────────────────────────────────┐ │
│ │ [● Per consultation] [○ Hourly rate] [○ Package pricing]          │ │
│ │ ☑ Insurance direct billing                                         │ │
│ │ ☑ Multiple payment methods                                         │ │
│ │ ☐ Installment payments                                             │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ──────────────────────────────────────────────────────────────────── │
│ [Save Configuration] [Test Service Setup] [Medical Templates]        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. INSTALLATION WIZARD

### 5.1 SAAS Installation Wizard

**SAAS System Requirements Check:**

```
┌─ Greek ERP/CRM SAAS Setup ───────────────────────────────────────────┐
│ Step 1 of 8: System Compatibility Check                             │
│ ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 12%                                  │
│ ──────────────────────────────────────────────────────────────────── │
│ Checking your system compatibility with our SAAS platform           │
│                                                                      │
│ ┌─ Browser Requirements ───────────────────────────────────────────────┐ │
│ │ ✓ Chrome/Edge: Version 90+ (Chrome 120.0.6099.109 ✓)             │ │
│ │ ✓ Firefox: Version 88+ (Not Detected)                             │ │
│ │ ✓ Safari: Version 14+ (Not Detected)                              │ │
│ │ ✓ JavaScript: Enabled ✓                                           │ │
│ │ ✓ Cookies: Enabled ✓                                              │ │
│ │ ✓ Local Storage: 10MB+ Available (50MB ✓)                         │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Network Requirements ───────────────────────────────────────────────┐ │
│ │ ✓ Internet Speed: 10 Mbps+ (95 Mbps ✓)                            │ │
│ │ ✓ Latency: <200ms (23ms ✓)                                        │ │
│ │ ✓ Firewall: Ports 443,80 Open (✓)                                 │ │
│ │ ✓ DNS Resolution: Working (✓)                                      │ │
│ │ ✓ SSL/TLS: Version 1.2+ (TLS 1.3 ✓)                               │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Device Compatibility ───────────────────────────────────────────────┐ │
│ │ ✓ Desktop: Windows 10+/macOS 10.15+/Linux (Windows 11 ✓)         │ │
│ │ ✓ Mobile: iOS 13+/Android 8+ (Android 14 ✓)                       │ │
│ │ ✓ Screen Resolution: 1024x768+ (1920x1080 ✓)                      │ │
│ │ ✓ RAM: 4GB+ Available (16GB ✓)                                     │ │
│ │ ⚠️ Recommended: 8GB+ RAM for optimal performance                   │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Greek Business Features ────────────────────────────────────────────┐ │
│ │ ✓ Greek Keyboard Support: Enabled (✓)                             │ │
│ │ ✓ Greek Fonts: Available (✓)                                      │ │
│ │ ✓ Euro Currency: Supported (✓)                                    │ │
│ │ ✓ Greek Date Format: Configured (✓)                               │ │
│ │ ✓ Location Services: Available (✓)                                │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Performance Test Results ───────────────────────────────────────────┐ │
│ │ ✓ Page Load Speed: 1.2 seconds (Excellent)                        │ │
│ │ ✓ JavaScript Performance: 8,500 (Good)                            │ │
│ │ ✓ Network Throughput: 94 Mbps (Excellent)                         │ │
│ │ ✓ Database Response: 45ms (Excellent)                             │ │
│ │ Overall Grade: A+ (Excellent Performance)                          │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ──────────────────────────────────────────────────────────────────── │
│ [Run Extended Test] [Continue to Business Setup →] [Support] [Exit]  │
└──────────────────────────────────────────────────────────────────────┘
```

**Step-by-Step Business Configuration:**

```
┌─ Greek ERP/CRM Setup Wizard ─────────────────────────────────────────┐
│ Step 1 of 10: System Requirements Check                             │
│ ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 10%                                  │
│ ──────────────────────────────────────────────────────────────────── │
│ Checking system requirements for optimal performance                 │
│                                                                      │
│ ┌─ Hardware Requirements ──────────────────────────────────────────────┐ │
│ │ ✓ RAM: 8GB+ Available (16GB Detected)                             │ │
│ │ ✓ CPU: Intel i5/AMD Ryzen 5+ (Intel i7-12700K)                   │ │
│ │ ✓ Storage: 50GB+ Free Space (250GB Available)                     │ │
│ │ ✓ Network: Broadband Internet (100 Mbps)                          │ │
│ │ ⚠️ Display: 1920x1080+ Recommended (1366x768 Current)             │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Software Requirements ──────────────────────────────────────────────┐ │
│ │ ✓ Operating System: Windows 10+ (Windows 11 Pro)                  │ │
│ │ ✓ Browser: Chrome 90+ (Chrome 120.0.6099.109)                     │ │
│ │ ✓ .NET Framework: 4.8+ (8.0 Detected)                             │ │
│ │ ✓ Visual C++ Redistributables: 2015-2022 (Installed)              │ │
│ │ ✓ Windows Updates: Current (Last Update: 2024-01-15)              │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Network & Security Check ───────────────────────────────────────────┐ │
│ │ ✓ Internet Connectivity: Stable (23ms latency)                    │ │
│ │ ✓ Firewall Configuration: Compatible                               │ │
│ │ ✓ Antivirus Software: Compatible (Windows Defender)               │ │
│ │ ✓ Port Availability: 443, 80, 5432 (Available)                    │ │
│ │ ⚠️ Administrator Rights: Required for installation                  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Performance Benchmark ──────────────────────────────────────────────┐ │
│ │ ✓ CPU Performance: 15,420 (Excellent)                             │ │
│ │ ✓ Memory Speed: 3,200 MHz DDR4 (Good)                             │ │
│ │ ✓ Storage Speed: 550 MB/s SSD (Excellent)                         │ │
│ │ ✓ Network Speed: 95 Mbps Down / 20 Mbps Up (Good)                 │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ──────────────────────────────────────────────────────────────────── │
│ [Fix Issues] [Continue to Prerequisites →] [View Details] [Save & Exit] │
└──────────────────────────────────────────────────────────────────────┘

┌─ Greek ERP/CRM Setup Wizard ─────────────────────────────────────────┐
│ Step 2 of 10: Prerequisites & Dependencies                          │
│ ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 20%                                  │
│ ──────────────────────────────────────────────────────────────────── │
│ Installing required components and dependencies                      │
│                                                                      │
│ ┌─ Database Requirements ──────────────────────────────────────────────┐ │
│ │ PostgreSQL 16.1:                                                  │ │
│ │ ✓ Download Complete (245MB)                                       │ │
│ │ ⏳ Installing... 65%                                              │ │
│ │ ✓ Configuration: UTF-8, Greek Collation                           │ │
│ │ ✓ Performance Tuning: 8GB RAM Optimized                           │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Application Runtime ────────────────────────────────────────────────┐ │
│ │ ✓ Python 3.12.1 Runtime (45MB)                                    │ │
│ │ ✓ Node.js 20.10.0 & NPM (38MB)                                    │ │
│ │ ✓ Redis 7.2.4 Cache Server (12MB)                                 │ │
│ │ ⏳ Greek Language Packs (25MB)                                     │ │
│ │ ⏳ Business Logic Engine (156MB)                                   │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Greek Compliance Components ────────────────────────────────────────┐ │
│ │ ✓ AADE Integration Module (8MB)                                    │ │
│ │ ✓ Greek Tax Calculation Engine (15MB)                              │ │
│ │ ✓ Greek Banking Formats (5MB)                                      │ │
│ │ ✓ Greek Address Validation (12MB)                                  │ │
│ │ ⏳ Greek Legal Templates (22MB)                                    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Security & Encryption ──────────────────────────────────────────────┐ │
│ │ ✓ SSL Certificates Generation                                      │ │
│ │ ✓ Database Encryption Setup                                        │ │
│ │ ✓ API Security Configuration                                       │ │
│ │ ✓ Backup & Recovery Tools                                          │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ Overall Progress: ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░ 72%                             │
│ ──────────────────────────────────────────────────────────────────── │
│ [Pause Installation] [Continue to Business Info →] [View Logs] [Exit] │
└──────────────────────────────────────────────────────────────────────┘

┌─ Greek ERP/CRM Setup Wizard ─────────────────────────────────────────┐
│ Step 3 of 10: Business Information                                  │
│ ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░ 30%                                  │
│ ──────────────────────────────────────────────────────────────────── │
│ Tell us about your business for optimal configuration                │
│                                                                      │
│ Company Name: [________________________]                             │
│ ΑΦΜ (Tax ID): [_________] ΔΟΥ: [Α' ΑΘΗΝΩΝ ▼]                        │
│                                                                      │
│ Business Type:                                                       │
│ [○] Healthcare (Doctor/Medical)   [○] Professional Services          │
│ [○] Retail Store                  [○] Restaurant/Cafe               │
│ [○] E-commerce                    [○] Education/Training            │
│ [○] Manufacturing                 [○] Construction                  │
│ [○] Other: [_____________]                                          │
│                                                                      │
│ Primary Location:                                                    │
│ Address: [_________________________________]                        │
│ City: [_______________] Postal Code: [_____]                        │
│ Location Type: [● Mainland] [○ Island] [○ Special Zone]             │
│                                                                      │
│ Island Details (if applicable):                                     │
│ Island Group: [Cyclades ▼] VAT Zone: [Reduced Rate ▼]              │
│ ──────────────────────────────────────────────────────────────────── │
│ [← Back] [Continue to VAT Configuration →] [Save & Exit]            │
└──────────────────────────────────────────────────────────────────────┘

┌─ Greek ERP/CRM Setup Wizard ─────────────────────────────────────────┐
│ Step 4 of 10: VAT & Tax Configuration                               │
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░ 40%                                  │
│ ──────────────────────────────────────────────────────────────────── │
│ Configure VAT rules based on your business type and location         │
│                                                                      │
│ ┌─ Detected VAT Configuration ─────────────────────────────────────────┐ │
│ │ Business Type: Healthcare (Doctor)                                 │ │
│ │ Location: Mykonos, Cyclades                                        │ │
│ │                                                                    │ │
│ │ ✓ VAT Exempt - Medical Services (0%)                               │ │
│ │ ⚠️ Note: VAT exemption may change in future legislation            │ │
│ │                                                                    │ │
│ │ Location Benefits:                                                 │ │
│ │ ✓ Island reduced VAT (30% reduction) - if VAT applied             │ │
│ │ ✓ Tourism area special rules                                       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ Special Scenarios (check if applicable):                            │
│ [☐] Medical equipment sales (different VAT)                         │
│ [☐] Pharmaceutical products (reduced VAT)                           │
│ [☐] Educational materials (reduced VAT)                             │
│ [☐] Digital services to EU (VAT MOSS)                               │
│                                                                      │
│ Future-Proofing Options:                                             │
│ [☑] Enable VAT rule updates via system updates                      │
│ [☑] Notifications for tax law changes                               │
│ [☑] Backup plans for potential VAT changes                          │
│ ──────────────────────────────────────────────────────────────────── │
│ [← Back] [Continue to Product Configuration →] [Save & Exit]        │
└──────────────────────────────────────────────────────────────────────┘

┌─ Greek ERP/CRM Setup Wizard ─────────────────────────────────────────┐
│ Step 5 of 10: Product & Service Configuration                       │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░ 50%                                  │
│ ──────────────────────────────────────────────────────────────────── │
│ How do you want to manage your products and services?               │
│                                                                      │
│ ┌─ Recommended for Healthcare ─────────────────────────────────────────┐ │
│ │ ✓ Service-based business                                           │ │
│ │ ✓ Appointment scheduling                                           │ │
│ │ ✓ Patient management                                               │ │
│ │ ✓ Medical history tracking                                         │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ Primary Service Types:                                               │
│ [☑] General Consultation      Duration: [30] minutes                │
│ [☑] Specialist Consultation   Duration: [45] minutes                │
│ [☐] Medical Procedures        Duration: [Variable]                  │
│ [☐] Diagnostic Tests          Duration: [15] minutes                │
│ [☐] Medical Equipment Sales   (Products with inventory)             │
│                                                                      │
│ Pricing Structure:                                                   │
│ [● Per consultation] [○ Hourly rate] [○ Package deals]              │
│                                                                      │
│ Additional Features:                                                 │
│ [☑] Insurance billing                                               │
│ [☑] Prescription management                                         │
│ [☑] Lab integration                                                 │
│ [☑] GDPR compliance tools                                           │
│ ──────────────────────────────────────────────────────────────────── │
│ [← Back] [Continue to Compliance Setup →] [Save & Exit]             │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 Local Installation Wizard

**Platform-Specific Installation:**

```
┌─ Greek ERP/CRM Local Installation ───────────────────────────────────┐
│ Windows Installation Wizard                                          │
│ ──────────────────────────────────────────────────────────────────── │
│ System Requirements Check:                                           │
│ ✓ Windows 10/11 (Build 19041+)                                      │
│ ✓ 8GB RAM Available                                                 │
│ ✓ 50GB Disk Space Available                                         │
│ ✓ Internet Connection                                                │
│                                                                      │
│ Installing Components:                                               │
│ ✓ PostgreSQL 16.1 Database                                          │
│ ✓ Redis 7.2.4 Cache Server                                          │
│ ✓ Python 3.12.1 Runtime                                             │
│ ⏳ Node.js 20.10.0 & NPM                                            │
│ ⏳ Greek ERP/CRM Application                                         │
│ ⏳ Windows Service Configuration                                     │
│                                                                      │
│ Installation Progress: ▓▓▓▓▓▓▓▓▓▓▓░░░░░ 65%                         │
│                                                                      │
│ Next Steps:                                                          │
│ 1. Database initialization                                           │
│ 2. Greek localization setup                                         │
│ 3. Business configuration wizard                                     │
│ 4. Initial user account creation                                     │
│ 5. System testing & validation                                       │
│                                                                      │
│ [Cancel Installation] [View Details] [Continue in Background]       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. REGULATORY UPDATE SYSTEM

### 6.1 Tax Law Change Management

**Future-Proof Tax Updates:**

```typescript
interface TaxRegulationUpdate {
  id: string;
  updateType:
    | "vat_rate_change"
    | "exemption_change"
    | "new_rule"
    | "location_change";

  // Regulation Details
  regulationTitle: string;
  regulationNumber: string;
  publishedDate: Date;
  effectiveDate: Date;
  expiryDate?: Date;

  // Impact Assessment
  affectedBusinessTypes: BusinessType[];
  affectedLocations: string[];
  impactLevel: "low" | "medium" | "high" | "critical";

  // Changes
  oldRules: TaxRule[];
  newRules: TaxRule[];
  migrationRequired: boolean;

  // Implementation
  implementationStatus: "pending" | "testing" | "deployed" | "completed";
  implementationNotes: string;

  // Notifications
  customersNotified: boolean;
  notificationsSent: Date[];
  acknowledgmentRequired: boolean;
}

interface TaxRule {
  id: string;
  ruleType: string;
  businessTypes: BusinessType[];
  locations: string[];
  vatRate: number;
  exemptionCriteria?: string[];
  effectiveFrom: Date;
  effectiveTo?: Date;
  description: string;
}

class RegulatoryUpdateManager {
  async checkForUpdates(): Promise<TaxRegulationUpdate[]> {
    // Check government sources for regulation updates
    const updates = await this.fetchRegulatoryUpdates();

    // Analyze impact on existing configurations
    const impactAnalysis = await this.analyzeImpact(updates);

    // Notify affected customers
    await this.notifyCustomers(impactAnalysis);

    return updates;
  }

  async applyRegulationUpdate(updateId: string): Promise<void> {
    const update = await this.getUpdate(updateId);

    // Backup current configuration
    await this.backupCurrentRules();

    // Apply new rules
    await this.implementNewRules(update.newRules);

    // Update affected business configurations
    await this.updateBusinessConfigurations(update);

    // Validate changes
    await this.validateRuleChanges();

    // Notify completion
    await this.notifyUpdateComplete(update);
  }
}
```

### 6.2 Update Notification System

**Regulatory Change Notifications:**

```
┌─ Regulatory Update Notification ─────────────────────────────────────┐
│ ⚠️ Important Tax Law Change - Action Required                        │
│ ──────────────────────────────────────────────────────────────────── │
│ Update: Medical Services VAT Implementation                          │
│ Regulation: Υ.Α. 12345/2028                                         │
│ Effective Date: January 1, 2028                                     │
│ Impact Level: 🔴 CRITICAL                                           │
│                                                                      │
│ ┌─ Changes Summary ────────────────────────────────────────────────────┐ │
│ │ OLD RULE: Medical services are VAT exempt (0%)                    │ │
│ │ NEW RULE: Medical services subject to 24% VAT                     │ │
│ │                                                                    │ │
│ │ Affected Business Types:                                           │ │
│ │ • Healthcare providers                                             │ │
│ │ • Medical practitioners                                            │ │
│ │ • Dental practices                                                 │ │
│ │ • Physiotherapy centers                                            │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Impact on Your Business ───────────────────────────────────────────┐ │
│ │ Business Type: Healthcare (Doctor)                                 │ │
│ │ Current VAT Rate: 0% (Exempt)                                      │ │
│ │ New VAT Rate: 24% (Standard)                                       │ │
│ │                                                                    │ │
│ │ Estimated Impact:                                                  │ │
│ │ • Monthly revenue: €15,000                                         │ │
│ │ • Additional VAT to collect: €3,600/month                         │ │
│ │ • System updates required: ✓ Automatic                            │ │
│ │ • Price adjustments needed: ⚠️ Customer communication required     │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─ Preparation Steps ──────────────────────────────────────────────────┐ │
│ │ ☐ 1. Review new pricing strategy                                   │ │
│ │ ☐ 2. Update service prices (system will calculate VAT)            │ │
│ │ ☐ 3. Notify existing patients about price changes                 │ │
│ │ ☐ 4. Update appointment booking system                             │ │
│ │ ☐ 5. Test new VAT calculations                                     │ │
│ │                                                                    │ │
│ │ Deadline for preparation: December 15, 2027                       │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ [Accept & Schedule Update] [View Full Regulation] [Get Support]      │
│ [Remind Me Later] [Mark as Acknowledged]                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. CONCLUSION

This comprehensive Business Configuration & Greek Tax Complexity system provides:

**✅ Adaptive Business Configuration:**

- Support for any business type (doctors, engineers, retail, hospitality, etc.)
- Pre-configured templates with industry-specific features
- Flexible product/service management (simple quantities to complex variants)

**✅ Dynamic VAT Engine:**

- Multi-criteria VAT calculation (location, consumption method, business type)
- Island reduced VAT support
- Future-proof regulatory change management
- Complex scenarios (takeaway vs dine-in, profession-based exemptions)

**✅ Installation Wizards:**

- SAAS guided setup with business type detection
- Local installation with platform-specific packages
- Automatic configuration based on business needs
- Step-by-step compliance setup

**✅ Future-Proof Design:**

- Regulatory update system for tax law changes
- Impact analysis and customer notification
- Backup and rollback capabilities
- Seamless rule updates without system downtime

This system ensures Greek businesses can operate efficiently regardless of their complexity level, while maintaining full compliance with current and future Greek tax regulations.
