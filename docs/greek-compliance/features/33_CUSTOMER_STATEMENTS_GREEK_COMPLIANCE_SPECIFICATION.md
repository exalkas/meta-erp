# Greek Customer Statements Compliance Specification

## Document Information

- **Document ID**: 33
- **Title**: Καταστάσεις Πελατών (Customer Statements) - Greek Compliance Feature
- **Version**: 1.0
- **Date**: January 2025
- **Purpose**: Greek customer statement filing requirements and automated compliance

---

## 1. EXECUTIVE SUMMARY

### 1.1 Feature Overview

**Καταστάσεις Πελατών** (Customer Statements) is a mandatory Greek business compliance requirement where companies must file periodic customer account statements with tax authorities and maintain detailed customer transaction records.

**Key Business Value:**

- **Automatic Compliance**: Never miss Greek customer statement filing deadlines
- **AADE Integration**: Direct submission to Greek tax authorities
- **Automated Generation**: Generate statements automatically based on customer transactions
- **Greek Formatting**: Proper Greek language and formatting standards
- **Historical Records**: Complete audit trail for tax compliance

### 1.2 Greek Business Requirements

**Legal Requirements:**

- Monthly customer statements for B2B transactions above €1,000
- Quarterly statements for all active customers
- Annual comprehensive statements for tax filing
- 7-year retention requirement for all customer statements
- AADE MyDATA integration for electronic filing

**Statement Types:**

- **Monthly Transaction Statements** (Μηνιαία Καταστάσεις)
- **Quarterly Balance Statements** (Τριμηνιαία Καταστάσεις)
- **Annual Compliance Statements** (Ετήσιες Καταστάσεις)
- **On-Demand Statements** (Κατά Παραγγελία)

---

## 2. TECHNICAL IMPLEMENTATION

### 2.1 Data Models

**Customer Statement Model:**

```typescript
interface CustomerStatement {
  id: string;
  statementNumber: string;
  customerId: string;

  // Statement Details
  statementType: CustomerStatementType;
  periodStart: Date;
  periodEnd: Date;
  generatedDate: Date;
  dueDate?: Date;

  // Balances
  openingBalance: number;
  closingBalance: number;
  totalTransactions: number;
  totalPayments: number;
  totalCredits: number;
  outstandingAmount: number;

  // Greek Compliance
  aadeCompliant: boolean;
  aadeSubmissionId?: string;
  aadeSubmissionDate?: Date;
  aadeStatus: "pending" | "submitted" | "accepted" | "rejected";

  // Document Management
  pdfPath: string;
  pdfGeneratedDate: Date;
  emailSent: boolean;
  emailSentDate?: Date;

  // Metadata
  createdBy: string;
  approvedBy?: string;
  status: "draft" | "generated" | "sent" | "filed";

  // Relationships
  transactions: CustomerStatementTransaction[];
  payments: CustomerStatementPayment[];
  vatBreakdown?: VATBreakdown[];
}

enum CustomerStatementType {
  MONTHLY_TRANSACTIONS = "monthly_transactions",
  QUARTERLY_BALANCE = "quarterly_balance",
  ANNUAL_COMPLIANCE = "annual_compliance",
  ON_DEMAND = "on_demand",
  AADE_REQUIRED = "aade_required",
}
```

This feature ensures Greek businesses maintain full compliance with customer statement filing requirements while providing professional, automated statement generation and AADE integration.
