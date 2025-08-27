# Legal-US UI/UX Specification

**Version:** 1.0.0  
**Created:** August 15, 2025  
**Target:** Legal-US Pack Interface Design  
**Multilingual:** English (primary) + Spanish (US legal market)  
**Theme Support:** Dark/Light variants with Legal theme base

---

## 🎯 **UI/UX OVERVIEW**

The Legal-US pack interface provides a modern, AI-powered legal practice management system with comprehensive multilingual support, accessibility compliance, and theme variant integration.

---

## 📱 **DESIGN PRINCIPLES**

### **2025 Modern Standards**

**Mobile-First Design:**

- Responsive layouts that work on all devices
- Touch-optimized interfaces with gesture support
- Offline capability for core functions
- Progressive Web App (PWA) support

**Accessibility (WCAG 2.1 AA):**

- Screen reader compatibility with semantic markup
- Keyboard navigation with focus management
- High contrast modes with customizable themes
- Voice commands with natural language processing

**Theme Variant Support:**

- Dark/Light mode toggle with system preference detection
- Legal theme base with professional color palette
- CSS custom properties for dynamic theming
- Tenant-specific branding capabilities

---

## 🌐 **MULTILINGUAL SUPPORT**

### **Supported Languages**

**Primary:** English (en-US) - Complete legal terminology
**Secondary:** Spanish (es-US) - US Hispanic legal market support

### **Translation Key Strategy**

Following [TRANSLATION_STANDARD.md](./TRANSLATION_STANDARD.md):

**Flat Key Structure:**

- ✅ Use: `"client_name"`, `"matter_status"`, `"billing_arrangement"`
- ❌ Avoid: `"forms.client_name"`, `"tables.matter_status"`

**Legal-Specific Key Patterns:**

```json
{
  // Entity Labels
  "client_name": "Client Name",
  "matter_name": "Matter Name",
  "time_entry": "Time Entry",
  "trust_account": "Trust Account",

  // Legal Actions
  "conflict_check": "Conflict Check",
  "iolta_compliance": "IOLTA Compliance",
  "statute_of_limitations": "Statute of Limitations",
  "engagement_letter": "Engagement Letter",

  // Status Values
  "matter_status_active": "Active",
  "matter_status_closed": "Closed",
  "billing_status_billable": "Billable",
  "billing_status_non_billable": "Non-Billable",

  // AI Features
  "ai_lead_score": "AI Lead Score",
  "ai_case_assessment": "AI Case Assessment",
  "ai_conflict_detection": "AI Conflict Detection"
}
```

---

## 📄 **COMPLETE PAGE INVENTORY**

### **Authentication & System Pages:**

1. **Login Page** (`/login`) - Multi-factor authentication with legal compliance
2. **Forgot Password** (`/forgot-password`) - Secure password recovery
3. **Reset Password** (`/reset-password/{token}`) - Token-based password reset
4. **Two-Factor Setup** (`/2fa-setup`) - Security enhancement for attorneys
5. **Account Activation** (`/activate/{token}`) - Email verification process
6. **Error Pages** (`/404`, `/403`, `/500`) - Branded error handling

### **Account Management Pages:**

7. **Account Settings** (`/account/settings`) - Profile and preferences
8. **Subscription Management** (`/account/subscription`) - Plan and billing cycle
9. **Billing & Payment** (`/account/billing`) - Payment methods and invoices
10. **Notification Preferences** (`/account/notifications`) - Email/SMS preferences
11. **Security Settings** (`/account/security`) - Password, 2FA, sessions
12. **Profile Management** (`/account/profile`) - Attorney information and credentials

### **Core Legal Practice Pages:**

13. **Dashboard** (`/dashboard`) - Practice overview with AI insights
14. **Clients List** (`/clients`) - Client management with CRM features
15. **Client Detail** (`/clients/{id}`) - 360-degree client view
16. **Client Create/Edit** (`/clients/new`, `/clients/{id}/edit`) - Client forms
17. **Matters List** (`/matters`) - Matter lifecycle management
18. **Matter Detail** (`/matters/{id}`) - Complete matter overview
19. **Matter Create/Edit** (`/matters/new`, `/matters/{id}/edit`) - Matter forms
20. **Time Entry** (`/time-entry`) - AI-powered time tracking
21. **Time Entries List** (`/time-entries`) - Time management dashboard
22. **Invoices List** (`/invoices`) - Billing and payment tracking
23. **Invoice Detail/Edit** (`/invoices/{id}`, `/invoices/new`) - Invoice management
24. **Trust Accounts** (`/trust-accounts`) - IOLTA compliance dashboard
25. **Communications** (`/communications`) - Client interaction history
26. **Calendar/Deadlines** (`/calendar`) - Legal calendar with statute tracking
27. **Document Library** (`/documents`) - Secure document management
28. **Court Filings** (`/court-filings`) - E-filing and court integration
29. **Conflict Checking** (`/conflicts`) - AI-powered conflict detection
30. **Legal Research** (`/research`) - Integrated legal research tools

### **Reports & Analytics Pages:**

31. **Financial Reports** (`/reports/financial`) - Practice financial analysis
32. **Time Reports** (`/reports/time`) - Attorney productivity analysis
33. **IOLTA Reports** (`/reports/iolta`) - Trust account compliance reports

### **Integration Management Pages:**

34. **Integrations Dashboard** (`/integrations`) - Integration status overview
35. **Court System Setup** (`/integrations/court-systems`) - E-filing configuration
36. **IOLTA Banking Setup** (`/integrations/banking`) - Banking integration
37. **State Bar Integration** (`/integrations/state-bar`) - Attorney verification

### **Administration Pages:**

38. **Settings** (`/settings`) - System configuration
39. **User Management** (`/users`) - Staff and permissions

---

## 📄 **DETAILED PAGE SPECIFICATIONS**

### **1. Legal Dashboard Page**

**Route:** `/dashboard`  
**Purpose:** Main practice overview with AI insights and key metrics

**Layout Structure:**

```json
{
  "page_type": "dashboard",
  "layout": "legal_dashboard_layout",
  "sections": [
    {
      "section_id": "header",
      "components": ["navigation", "user_menu", "theme_toggle"]
    },
    {
      "section_id": "metrics_row",
      "components": ["client_metrics", "matter_metrics", "billing_metrics"]
    },
    {
      "section_id": "main_content",
      "components": ["recent_matters", "upcoming_deadlines", "revenue_chart"]
    },
    {
      "section_id": "sidebar",
      "components": ["ai_insights", "quick_actions", "statute_alerts"]
    }
  ]
}
```

**Translation Keys Required:**

```json
{
  "dashboard_title": "Legal Practice Dashboard",
  "total_clients": "Total Clients",
  "active_matters": "Active Matters",
  "monthly_revenue": "Monthly Revenue",
  "recent_matters": "Recent Matters",
  "upcoming_deadlines": "Upcoming Deadlines",
  "statute_alerts": "Statute of Limitations Alerts",
  "ai_insights": "AI Insights",
  "case_assessment": "Case Assessment",
  "productivity_score": "Productivity Score"
}
```

### **2. Client Management Pages**

**2a. Client List Page**

**Route:** `/clients`  
**Purpose:** Comprehensive client listing with CRM features

**Translation Keys Required:**

```json
{
  "clients_title": "Clients",
  "add_client": "Add Client",
  "search_clients": "Search Clients",
  "filter_by_status": "Filter by Status",
  "client_type": "Client Type",
  "intake_date": "Intake Date",
  "last_contact": "Last Contact",
  "matter_count": "Matter Count",
  "total_billed": "Total Billed",
  "lead_score": "Lead Score",
  "risk_level": "Risk Level",
  "actions": "Actions"
}
```

**2b. Client Detail Page**

**Route:** `/clients/{id}`  
**Purpose:** 360-degree client view with relationship mapping

**Translation Keys Required:**

```json
{
  "client_information": "Client Information",
  "contact_details": "Contact Details",
  "billing_information": "Billing Information",
  "communication_history": "Communication History",
  "related_matters": "Related Matters",
  "documents": "Documents",
  "notes": "Notes",
  "edit_client": "Edit Client",
  "send_message": "Send Message",
  "create_matter": "Create Matter"
}
```

### **3. Matter Management Pages**

**3a. Matter List Page**

**Route:** `/matters`  
**Purpose:** Matter lifecycle management with AI insights

**Translation Keys Required:**

```json
{
  "matters_title": "Matters",
  "add_matter": "Add Matter",
  "practice_area": "Practice Area",
  "responsible_attorney": "Responsible Attorney",
  "matter_status": "Matter Status",
  "open_date": "Open Date",
  "case_strength": "Case Strength",
  "outcome_prediction": "Outcome Prediction",
  "profitability": "Profitability",
  "next_deadline": "Next Deadline"
}
```

**3b. Matter Detail Page**

**Route:** `/matters/{id}`  
**Purpose:** Complete matter management with AI case assessment

**Translation Keys Required:**

```json
{
  "matter_overview": "Matter Overview",
  "case_details": "Case Details",
  "ai_assessment": "AI Assessment",
  "timeline": "Timeline",
  "budget_tracking": "Budget Tracking",
  "time_entries": "Time Entries",
  "expenses": "Expenses",
  "deadlines": "Deadlines",
  "opposing_counsel": "Opposing Counsel",
  "court_information": "Court Information"
}
```

### **4. Time Tracking Pages**

**4a. Time Entry Page**

**Route:** `/time-entry`  
**Purpose:** AI-powered time tracking with smart categorization

**Translation Keys Required:**

```json
{
  "time_entry_title": "Time Entry",
  "start_timer": "Start Timer",
  "stop_timer": "Stop Timer",
  "matter_selection": "Matter Selection",
  "activity_type": "Activity Type",
  "hours_worked": "Hours Worked",
  "description": "Description",
  "billing_status": "Billing Status",
  "ai_suggestions": "AI Suggestions",
  "save_entry": "Save Entry",
  "save_and_new": "Save & New Entry"
}
```

### **5. Billing & Invoice Pages**

**5a. Invoice List Page**

**Route:** `/invoices`  
**Purpose:** Advanced billing management with IOLTA compliance

**Translation Keys Required:**

```json
{
  "invoices_title": "Invoices",
  "create_invoice": "Create Invoice",
  "invoice_number": "Invoice Number",
  "invoice_date": "Invoice Date",
  "due_date": "Due Date",
  "amount_due": "Amount Due",
  "payment_status": "Payment Status",
  "days_outstanding": "Days Outstanding",
  "send_invoice": "Send Invoice",
  "record_payment": "Record Payment"
}
```

**5b. Trust Account Management Page**

**Route:** `/trust-accounts`  
**Purpose:** IOLTA compliance and trust account management

**Translation Keys Required:**

```json
{
  "trust_accounts_title": "Trust Accounts",
  "iolta_compliance": "IOLTA Compliance",
  "account_balance": "Account Balance",
  "client_balances": "Client Balances",
  "reconciliation": "Reconciliation",
  "last_reconciled": "Last Reconciled",
  "compliance_status": "Compliance Status",
  "client_ledger": "Client Ledger",
  "bank_transactions": "Bank Transactions"
}
```

### **6. Client Portal Pages**

**6a. Client Portal Dashboard**

**Route:** `/portal/dashboard`  
**Purpose:** Secure client self-service portal

**Translation Keys Required:**

```json
{
  "portal_welcome": "Welcome to Your Client Portal",
  "my_matters": "My Matters",
  "recent_activity": "Recent Activity",
  "upcoming_appointments": "Upcoming Appointments",
  "outstanding_invoices": "Outstanding Invoices",
  "document_library": "Document Library",
  "secure_messages": "Secure Messages",
  "contact_attorney": "Contact Attorney"
}
```

---

## 🎨 **LAYOUT SPECIFICATIONS**

### **Legal Dashboard Layout**

**File:** `legal_dashboard_layout.json`

```json
{
  "layout_id": "legal_dashboard_layout",
  "layout_name": "Legal Practice Dashboard",
  "layout_type": "dashboard",
  "responsive_breakpoints": {
    "mobile": "640px",
    "tablet": "768px",
    "desktop": "1024px",
    "wide": "1280px"
  },
  "sections": {
    "header": {
      "css_classes": "h-16 bg-background border-b border-border",
      "theme_variants": {
        "light": "bg-white border-gray-200",
        "dark": "bg-gray-900 border-gray-800"
      }
    },
    "main": {
      "css_classes": "flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6",
      "responsive": {
        "mobile": "grid-cols-1 gap-4 p-4",
        "tablet": "grid-cols-2 gap-4 p-4",
        "desktop": "grid-cols-4 gap-6 p-6"
      }
    },
    "sidebar": {
      "css_classes": "w-80 bg-muted/50 border-l border-border p-4",
      "responsive": {
        "mobile": "hidden",
        "tablet": "hidden",
        "desktop": "block"
      }
    }
  }
}
```

### **Legal Form Layout**

**File:** `legal_form_layout.json`

```json
{
  "layout_id": "legal_form_layout",
  "layout_name": "Legal Form Layout",
  "layout_type": "form",
  "sections": {
    "header": {
      "css_classes": "border-b border-border pb-4 mb-6"
    },
    "form_content": {
      "css_classes": "max-w-4xl mx-auto space-y-6",
      "responsive": {
        "mobile": "max-w-full px-4",
        "tablet": "max-w-2xl px-6",
        "desktop": "max-w-4xl"
      }
    },
    "actions": {
      "css_classes": "flex justify-end space-x-4 pt-6 border-t border-border"
    }
  }
}
```

---

## 🌟 **COMPONENT SPECIFICATIONS**

### **AI Insight Widget**

**Purpose:** Display AI-powered insights and recommendations

**Translation Keys:**

```json
{
  "ai_insight_title": "AI Insights",
  "case_recommendations": "Case Recommendations",
  "productivity_tips": "Productivity Tips",
  "billing_optimization": "Billing Optimization",
  "conflict_alerts": "Conflict Alerts",
  "see_all_insights": "See All Insights"
}
```

### **Legal Metrics Card**

**Purpose:** Display key practice metrics with trends

**Translation Keys:**

```json
{
  "this_month": "This Month",
  "last_month": "Last Month",
  "percent_change": "% Change",
  "trend_up": "Trending Up",
  "trend_down": "Trending Down",
  "view_details": "View Details"
}
```

### **Matter Status Badge**

**Purpose:** Visual status indicators for matters

**Translation Keys:**

```json
{
  "status_open": "Open",
  "status_active": "Active",
  "status_on_hold": "On Hold",
  "status_closed": "Closed",
  "status_archived": "Archived"
}
```

---

## 🎯 **ACCESSIBILITY REQUIREMENTS**

### **WCAG 2.1 AA Compliance**

**Keyboard Navigation:**

- All interactive elements must be keyboard accessible
- Clear focus indicators with 2px outline
- Logical tab order throughout interfaces
- Skip links for main content areas

**Screen Reader Support:**

- Semantic HTML markup with proper headings
- ARIA labels for complex components
- Role attributes for custom elements
- Alt text for all informative images

**Color & Contrast:**

- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Color not used as sole means of conveying information
- High contrast mode support

### **Voice Command Integration**

**Supported Commands:**

```json
{
  "voice_commands": {
    "navigate_to_clients": "Go to clients",
    "create_new_matter": "Create new matter",
    "start_timer": "Start time tracking",
    "search_matters": "Search matters",
    "show_deadlines": "Show upcoming deadlines"
  }
}
```

---

## 📱 **MOBILE OPTIMIZATION**

### **Touch Interface**

**Touch Targets:**

- Minimum 44px touch target size
- 8px spacing between touch targets
- Swipe gestures for navigation
- Pull-to-refresh functionality

**Mobile-Specific Features:**

- Biometric authentication (Face ID/Touch ID)
- Camera integration for document scanning
- GPS integration for location-based time tracking
- Offline sync for core functionality

---

## 🔒 **SECURITY & PRIVACY**

### **Client Portal Security**

**Authentication:**

- Multi-factor authentication required
- Session timeout configuration
- Secure password requirements
- Audit logging for all access

**Data Protection:**

- End-to-end encryption for messages
- Attorney-client privilege protection
- GDPR compliance for data handling
- Secure document sharing with expiration

---

This specification ensures the Legal-US pack provides a modern, accessible, and multilingual interface that meets the demanding requirements of legal practice management while maintaining the highest standards of security and usability.
