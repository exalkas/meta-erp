/**
 * Translation Context for Multilingual Support
 * Provides translation functions and language management
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Language,
  TranslationContextValue,
  TranslationOptions,
  LanguageResources,
  UserLanguagePreferences,
} from "../types";

// Default translation resources (will be loaded from JSON files)
const DEFAULT_RESOURCES: LanguageResources = {
  el: {
    common: {
      loading: "Φόρτωση...",
      error: "Σφάλμα",
      success: "Επιτυχία",
      cancel: "Ακύρωση",
      confirm: "Επιβεβαίωση",
      save: "Αποθήκευση",
      edit: "Επεξεργασία",
      delete: "Διαγραφή",
      create: "Δημιουργία",
      update: "Ενημέρωση",
      close: "Κλείσιμο",
      back: "Πίσω",
      next: "Επόμενο",
      previous: "Προηγούμενο",
      search: "Αναζήτηση",
      filter: "Φίλτρο",
      sort: "Ταξινόμηση",
      required: "Υποχρεωτικό",
      optional: "Προαιρετικό",
      select: "Επιλογή",
      select_option: "Επιλέξτε μια επιλογή",
      no_results: "Δεν βρέθηκαν αποτελέσματα",
      clear_all: "Καθαρισμός όλων",
      retry: "Δοκιμή ξανά",
      page_of: "Σελίδα {{current}} από {{total}}",
      showing_results: "Εμφάνιση {{start}}-{{end}} από {{total}}",
    },
    forms: {
      field_required: "Το πεδίο είναι υποχρεωτικό",
      invalid_email: "Μη έγκυρη διεύθυνση email",
      invalid_phone: "Μη έγκυρος αριθμός τηλεφώνου",
      invalid_afm: "Μη έγκυρος αριθμός ΑΦΜ",
      invalid_doy: "Μη έγκυρος κωδικός ΔΟΥ",
      invalid_postal_code: "Μη έγκυρος ταχυδρομικός κώδικας",
      invalid_iban: "Μη έγκυρος αριθμός IBAN",
      min_length: "Ελάχιστο μήκος: {{count}} χαρακτήρες",
      max_length: "Μέγιστο μήκος: {{count}} χαρακτήρες",
      min_value: "Ελάχιστη τιμή: {{value}}",
      max_value: "Μέγιστη τιμή: {{value}}",
    },
    greek: {
      afm_label: "Α.Φ.Μ.",
      afm_placeholder: "Εισάγετε τον Α.Φ.Μ.",
      afm_company_helper: "Εισάγετε το Α.Φ.Μ. της επιχείρησης (9 ψηφία)",
      afm_individual_helper: "Εισάγετε το Α.Φ.Μ. του φυσικού προσώπου",
      doy_label: "Δ.Ο.Υ.",
      doy_placeholder: "Επιλέξτε Δ.Ο.Υ.",
      doy_selector_placeholder: "Αναζητήστε ή επιλέξτε Δ.Ο.Υ.",
      doy_search_placeholder: "Αναζητήστε Δ.Ο.Υ. (όνομα, κωδικός, πόλη)",
      phone_label: "Τηλέφωνο",
      phone_placeholder: "Εισάγετε τον αριθμό τηλεφώνου",
      greek_phone_helper: "Εισάγετε έγκυρο ελληνικό τηλέφωνο",
      greek_phone_helper_landline:
        "Εισάγετε σταθερό τηλέφωνο (π.χ. +30 21X XXX XXXX)",
      greek_phone_helper_mobile:
        "Εισάγετε κινητό τηλέφωνο (π.χ. +30 69X XXX XXXX)",
      greek_phone_helper_all: "Εισάγετε σταθερό ή κινητό τηλέφωνο",
      address_label: "Διεύθυνση",
      region_label: "Περιφέρεια",
      postal_code_label: "Τ.Κ.",
      city_label: "Πόλη",
      street_label: "Οδός",
      street_number_label: "Αριθμός",
      legal_form_label: "Νομική Μορφή",
      business_activity_label: "Δραστηριότητα",
      bank_label: "Τράπεζα",
      iban_label: "IBAN",
      vat_rate_label: "Συντελεστής Φ.Π.Α.",
    },
    greekAddress: {
      addressType: "Τύπος Διεύθυνσης",
      street: "Οδός",
      streetPlaceholder: "Εισάγετε την οδό",
      number: "Αριθμός",
      numberPlaceholder: "Αριθμός",
      floor: "Όροφος",
      apartment: "Διαμέρισμα",
      postalCode: "Τ.Κ.",
      city: "Πόλη",
      cityPlaceholder: "Εισάγετε την πόλη",
      region: "Περιφέρεια",
      regionPlaceholder: "Επιλέξτε περιφέρεια",
      landmark: "Χαρακτηριστικό σημείο",
      landmarkPlaceholder: "π.χ. κοντά στο μετρό",
      types: {
        home: "Κατοικία",
        business: "Επιχείρηση",
        billing: "Τιμολόγησης",
        shipping: "Αποστολής",
      },
      validation: {
        streetRequired: "Η οδός είναι υποχρεωτική",
        streetTooShort: "Η οδός πρέπει να έχει τουλάχιστον 3 χαρακτήρες",
        numberRequired: "Ο αριθμός είναι υποχρεωτικός",
        numberInvalid: "Μη έγκυρος αριθμός (π.χ. 123Α)",
        postalCodeRequired: "Ο Τ.Κ. είναι υποχρεωτικός",
        postalCodeInvalid: "Μη έγκυρος ελληνικός Τ.Κ. (5 ψηφία)",
        postalCodeMismatch: "Ο Τ.Κ. δεν ταιριάζει με την πόλη",
        cityRequired: "Η πόλη είναι υποχρεωτική",
        regionRequired: "Η περιφέρεια είναι υποχρεωτική",
      },
    },
    navigation: {
      dashboard: "Κεντρικός Πίνακας",
      customers: "Πελάτες",
      suppliers: "Προμηθευτές",
      products: "Προϊόντα",
      invoices: "Τιμολόγια",
      reports: "Αναφορές",
      test_flow: "Δοκιμαστική Ροή",
      settings: "Ρυθμίσεις",
      app_name: "Axiologic",
      welcome_user: "Καλώς ήρθατε, {{name}}",
      logout: "Αποσύνδεση",
      logging_out: "Αποσύνδεση...",
      access_denied: "Δεν έχετε πρόσβαση. Επικοινωνήστε με τον διαχειριστή.",
    },
    dashboard: {
      welcome_user: "Καλώς ήρθατε, {{name}}!",
      company_overview:
        "Επισκόπηση της επιχείρησής σας • Εταιρεία: {{company}}",
      company_not_set: "Δεν έχει οριστεί",
      development_progress: "Πρόοδος Ανάπτυξης",
      milestone_1_progress: "Milestone 1: CRM + Τιμολόγηση (Ολοκληρώθηκε 75%)",
      erp_core_next: "ERP Core: Αποθέματα + Οικονομικά (Επόμενο)",
      total_customers: "Συνολικοί Πελάτες",
      monthly_invoices: "Μηνιαία Τιμολόγια",
      monthly_revenue: "Μηνιαίος Τζίρος",
      active_opportunities: "Ενεργές Ευκαιρίες",
      recent_activities: "Πρόσφατες Δραστηριότητες",
      quick_actions: "Γρήγορες Ενέργειες",
      new_invoice: "Νέο Τιμολόγιο",
      new_invoice_desc: "Δημιουργία και αποστολή στο AADE",
      new_customer: "Νέος Πελάτης",
      new_customer_desc: "Καταχώρηση επιχείρησης/προμηθευτή",
      new_opportunity: "Νέα Ευκαιρία",
      new_opportunity_desc: "Καταχώρηση ευκαιρίας πώλησης",
      // Error messages
      error_loading_stats: "Σφάλμα φόρτωσης στατιστικών",
      data_temporarily_unavailable: "Δεδομένα προσωρινά μη διαθέσιμα",
      retry_in_moment: "Δοκιμάστε ξανά σε λίγο",
      contact_support: "Επικοινωνήστε με την υποστήριξη",
      loading_stats: "Φόρτωση στατιστικών...",
      stats_unavailable: "Στατιστικά μη διαθέσιμα",
      schedule: "Προγραμματισμός",
      schedule_desc: "Νέο ραντεβού ή δραστηριότητα",
      system_modules: "Μονάδες Συστήματος - Roadmap Ανάπτυξης",
      milestone_1_title: "Milestone 1: CRM + Τιμολόγηση",
      milestone_1_desc: "Βασικές επιχειρηματικές λειτουργίες",
      erp_core_title: "ERP Core: Αποθέματα + Οικονομικά",
      erp_core_desc: "Ολοκληρωμένη επιχειρησιακή διαχείριση",
      erp_expansion_title: "ERP Expansion: Προηγμένες Λειτουργίες",
      erp_expansion_desc: "Προηγμένες αναλύσεις & αυτοματισμοί",
      module_active: "Ενεργό",
      module_developing: "Ανάπτυξη",
      module_planned: "Προγραμματισμένο",
      open_module: "Άνοιγμα μονάδας",
      in_development: "Σε ανάπτυξη",
      next_phase: "Επόμενη φάση",
      view_all_activities: "Δείτε όλες τις δραστηριότητες →",
      no_recent_activities: "Δεν υπάρχουν πρόσφατες δραστηριότητες",
      no_recent_activities_desc:
        "Όταν δημιουργήσετε τιμολόγια, πελάτες ή άλλες δραστηριότητες, θα εμφανιστούν εδώ",
      error_loading_activities: "Σφάλμα φόρτωσης δραστηριοτήτων",
      business_management: "Διαχείριση Επιχειρήσεων",
      business_management_desc: "Πελάτες, προμηθευτές, επαφές & σχέσεις",
      greek_invoicing: "Ελληνική Τιμολόγηση",
      greek_invoicing_desc: "16 είδη παραστατικών & AADE ενσωμάτωση",
      sales_pipeline: "Πωλήσεις & Pipeline",
      sales_pipeline_desc: "Ευκαιρίες, προσφορές & πρόβλεψη πωλήσεων",
      product_catalog: "Κατάλογος Προϊόντων",
      product_catalog_desc: "Προϊόντα, υπηρεσίες & τιμολόγηση",
      inventory_management: "Διαχείριση Αποθέματος",
      inventory_management_desc: "Αποθήκες, κίνηση & αυτοματισμοί",
      financial_management: "Οικονομική Διαχείριση",
      financial_management_desc: "Λογιστική, ταμείο & χρηματοροές",
      business_analytics: "Επιχειρηματικές Αναλύσεις",
      business_analytics_desc: "Dashboards, KPIs & προβλέψεις",
      aade_compliance: "AADE Συμμόρφωση",
      aade_compliance_desc: "MyDATA, φορολογικές υποχρεώσεις",
      hr_management: "Διαχείριση Προσωπικού",
      hr_management_desc: "HR, μισθοδοσία & παρουσίες",
      multi_company_security: "Πολυ-εταιρικό σύστημα ασφαλείας ✓",
      axiologic_integrated: "Axiologic - Ενοποιημένη Επιχειρηματική Διαχείριση",
      development_phases:
        "Milestone 1: CRM + Τιμολόγηση • ERP Core: Αποθέματα + Οικονομικά • ERP Expansion: HR + Analytics",
    },
    auth: {
      welcome: "Καλώς ήρθατε",
      sign_in_prompt: "Συνδεθείτε στον λογαριασμό σας",
      company_description: "Διαχείριση πελατών και επιχειρήσεων",
      all_rights_reserved: "Όλα τα δικαιώματα κατοχυρωμένα.",
      select_language: "Επιλογή γλώσσας",
      select_theme: "Επιλογή θέματος",
    },
    customers: {
      customers_title: "Πελάτες",
      customers_description:
        "Διαχειριστείτε τις σχέσεις με τους πελάτες σας και παρακολουθήστε την απόδοση των πωλήσεων",
      add_new_customer: "Προσθήκη Νέου Πελάτη",
      total_customers: "Συνολικοί Πελάτες",
      active_customers: "Ενεργοί Πελάτες",
      total_sales: "Συνολικές Πωλήσεις",
      average_order_value: "Μέσος Όρος Παραγγελίας",
      customer_directory: "Κατάλογος Πελατών",
      error_loading_stats: "Σφάλμα φόρτωσης στατιστικών πελατών",
      back_to_customers: "Επιστροφή στους Πελάτες",
      create_new_customer: "Δημιουργία Νέου Πελάτη",
      create_customer_description:
        "Συμπληρώστε τα στοιχεία για να δημιουργήσετε έναν νέο πελάτη",
      create_another_customer: "Δημιουργία άλλου πελάτη μετά την αποθήκευση",
      create_another_description:
        "Επιλέξτε αυτό για να παραμείνετε στη σελίδα δημιουργίας και να προσθέσετε πολλούς πελάτες γρήγορα",
    },
    suppliers: {
      suppliers_title: "Προμηθευτές",
      suppliers_description:
        "Διαχειριστείτε τις σχέσεις με τους προμηθευτές σας και τις διαδικασίες προμηθειών",
      add_new_supplier: "Προσθήκη Νέου Προμηθευτή",
      total_suppliers: "Συνολικοί Προμηθευτές",
      active_suppliers: "Ενεργοί Προμηθευτές",
      total_purchases: "Συνολικές Αγορές",
      average_rating: "Μέσος Όρος Αξιολόγησης",
      supplier_directory: "Κατάλογος Προμηθευτών",
      error_loading_stats: "Σφάλμα φόρτωσης στατιστικών προμηθευτών",
      back_to_suppliers: "Επιστροφή στους Προμηθευτές",
      create_new_supplier: "Δημιουργία Νέου Προμηθευτή",
      create_supplier_description:
        "Συμπληρώστε τα στοιχεία για να δημιουργήσετε έναν νέο προμηθευτή",
    },
    business_entities: {
      error_loading_entities: "Σφάλμα φόρτωσης επιχειρήσεων",
      quick_search_placeholder:
        "Γρήγορη αναζήτηση με όνομα, email, ΑΦΜ ή κωδικό...",
      // Customer context
      customer_found: "Βρέθηκε {{count}} πελάτης",
      customers_found: "Βρέθηκαν {{count}} πελάτες",
      // Supplier context
      supplier_found: "Βρέθηκε {{count}} προμηθευτής",
      suppliers_found: "Βρέθηκαν {{count}} προμηθευτές",
      // General entity context
      entity_found: "Βρέθηκε {{count}} επιχείρηση",
      entities_found: "Βρέθηκαν {{count}} επιχειρήσεις",
      filter_label: "Φίλτρο",
      loading_entities: "Φόρτωση επιχειρήσεων...",
      // General empty states
      no_entities_found: "Δεν βρέθηκαν επιχειρήσεις",
      try_adjusting_filters:
        "Δοκιμάστε να αλλάξετε τα κριτήρια αναζήτησης ή τα φίλτρα",
      create_first_entity:
        "Δημιουργήστε την πρώτη σας επιχείρηση για να ξεκινήσετε",
      // Customer specific empty states
      no_customers_found: "Δεν βρέθηκαν πελάτες",
      create_first_customer:
        "Δημιουργήστε τον πρώτο σας πελάτη για να ξεκινήσετε",
      // Supplier specific empty states
      no_suppliers_found: "Δεν βρέθηκαν προμηθευτές",
      create_first_supplier:
        "Δημιουργήστε τον πρώτο σας προμηθευτή για να ξεκινήσετε",
      valid_afm: "Έγκυρος ΑΦΜ",
      contact_info: "Στοιχεία Επικοινωνίας",
      business_details: "Επιχειρηματικά Στοιχεία",
      roles: "Ρόλοι",
      address: "Διεύθυνση",
      // Status translations
      status_active: "Ενεργό",
      status_inactive: "Ανενεργό",
      status_suspended: "Σε αναστολή",
      status_prospect: "Προοπτική",
      status_blocked: "Αποκλεισμένο",
      // Role translations
      role_customer: "Πελάτη",
      role_supplier: "Προμηθευτή",
      role_partner: "Συνεργάτη",
      // Directory and relationship management
      customer_directory: "Κατάλογος Πελατών",
      supplier_directory: "Κατάλογος Προμηθευτών",
      all_directory: "Κατάλογος Επιχειρήσεων",
      manage_customer_relationships:
        "Διαχειριστείτε τις σχέσεις με τους πελάτες σας",
      manage_supplier_relationships:
        "Διαχειριστείτε τις σχέσεις με τους προμηθευτές σας",
      manage_all_relationships:
        "Διαχειριστείτε όλες τις επιχειρηματικές σας σχέσεις",
      add_new_customer: "Προσθήκη Νέου Πελάτη",
      add_new_supplier: "Προσθήκη Νέου Προμηθευτή",
      add_new_all: "Προσθήκη Νέας Επιχείρησης",
      create_customer: "Δημιουργία Πελάτη",
      create_supplier: "Δημιουργία Προμηθευτή",
      create_all: "Δημιουργία Επιχείρησης",
      // Advanced filters
      advanced_filters: "Προηγμένα Φίλτρα",
      entity_types: "Τύποι Επιχείρησης",
      status: "Κατάσταση",
      greek_filters: "Ελληνικά Φίλτρα",
      date_filters: "Φίλτρα Ημερομηνίας",
      created_after: "Δημιουργήθηκε μετά",
      created_before: "Δημιουργήθηκε πριν",
      has_valid_afm: "Έχει Έγκυρο ΑΦΜ",
      vat_exempt: "Απαλλαγή ΦΠΑ",
      // Entity type translations
      entity_type_business: "Επιχείρηση",
      entity_type_individual: "Φυσικό Πρόσωπο",
      entity_type_government: "Κυβερνητικός Οργανισμός",
      entity_type_non_profit: "Μη Κερδοσκοπικός",
      // Form specific translations
      entity_type: "Τύπος Επιχείρησης",
      basic_information: "Βασικές Πληροφορίες",
      business_name: "Επωνυμία Επιχείρησης",
      business_name_placeholder: "Εισάγετε την επωνυμία της επιχείρησης",
      first_name: "Όνομα",
      first_name_placeholder: "Εισάγετε το όνομα",
      last_name: "Επώνυμο",
      last_name_placeholder: "Εισάγετε το επώνυμο",
      display_name: "Εμφανιζόμενο Όνομα",
      display_name_placeholder: "Όνομα για λίστες και αναφορές",
      greek_tax_information: "Ελληνικά Φορολογικά Στοιχεία",
      business_activity_placeholder: "π.χ., Ανάπτυξη Λογισμικού",
      email: "Διεύθυνση Email",
      website: "Ιστοσελίδα",
      mobile: "Κινητό Τηλέφωνο",
      business_settings: "Επιχειρηματικές Ρυθμίσεις",
      payment_terms: "Όροι Πληρωμής",
      cash_on_delivery: "Αντικαταβολή",
      net_15: "Καθαρά 15 ημέρες",
      net_30: "Καθαρά 30 ημέρες",
      net_60: "Καθαρά 60 ημέρες",
      net_90: "Καθαρά 90 ημέρες",
      prepaid: "Προπληρωμή",
      credit_limit: "Όριο Πίστωσης (€)",
      discount_percentage: "Ποσοστό Έκπτωσης (%)",
      additional_notes: "Πρόσθετες Σημειώσεις",
      notes_placeholder: "Πρόσθετες σημειώσεις για αυτή την επιχείρηση...",
      create_new_description:
        "Προσθέστε μια νέα επιχείρηση με ελληνική συμμόρφωση",
      edit_description: "Ενημερώστε τις πληροφορίες της επιχείρησης",
      error_loading_entity: "Αποτυχία φόρτωσης στοιχείων επιχείρησης",
      error_saving_entity: "Αποτυχία αποθήκευσης επιχείρησης",
      entity_created_success: "Η επιχείρηση δημιουργήθηκε επιτυχώς",
      entity_updated_success: "Η επιχείρηση ενημερώθηκε επιτυχώς",
      validation: {
        display_name_required: "Το εμφανιζόμενο όνομα είναι υποχρεωτικό",
        business_name_required: "Η επωνυμία της επιχείρησης είναι υποχρεωτική",
        first_name_required: "Το όνομα είναι υποχρεωτικό",
        last_name_required: "Το επώνυμο είναι υποχρεωτικό",
        invalid_email: "Μη έγκυρη διεύθυνση email",
        invalid_url: "Μη έγκυρη διεύθυνση ιστοσελίδας",
      },
    },
  },
  en: {
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      confirm: "Confirm",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      create: "Create",
      update: "Update",
      close: "Close",
      back: "Back",
      next: "Next",
      previous: "Previous",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      required: "Required",
      optional: "Optional",
      select: "Select",
      select_option: "Select an option",
      no_results: "No results found",
      clear_all: "Clear all",
      retry: "Try again",
      page_of: "Page {{current}} of {{total}}",
      showing_results: "Showing {{start}}-{{end}} of {{total}}",
    },
    forms: {
      field_required: "Field is required",
      invalid_email: "Invalid email address",
      invalid_phone: "Invalid phone number",
      invalid_afm: "Invalid AFM number",
      invalid_doy: "Invalid DOY code",
      invalid_postal_code: "Invalid postal code",
      invalid_iban: "Invalid IBAN number",
      min_length: "Minimum length: {{count}} characters",
      max_length: "Maximum length: {{count}} characters",
      min_value: "Minimum value: {{value}}",
      max_value: "Maximum value: {{value}}",
    },
    greek: {
      afm_label: "Tax Number (AFM)",
      afm_placeholder: "Enter tax number",
      afm_company_helper: "Enter the company's tax number (9 digits)",
      afm_individual_helper: "Enter the individual's tax number",
      doy_label: "Tax Office (DOY)",
      doy_placeholder: "Select tax office",
      doy_selector_placeholder: "Search or select tax office",
      doy_search_placeholder: "Search tax office (name, code, city)",
      phone_label: "Phone",
      phone_placeholder: "Enter phone number",
      greek_phone_helper: "Enter valid Greek phone number",
      greek_phone_helper_landline:
        "Enter landline number (e.g. +30 21X XXX XXXX)",
      greek_phone_helper_mobile: "Enter mobile number (e.g. +30 69X XXX XXXX)",
      greek_phone_helper_all: "Enter landline or mobile number",
      address_label: "Address",
      region_label: "Region",
      postal_code_label: "Postal Code",
      city_label: "City",
      street_label: "Street",
      street_number_label: "Number",
      legal_form_label: "Legal Form",
      business_activity_label: "Business Activity",
      bank_label: "Bank",
      iban_label: "IBAN",
      vat_rate_label: "VAT Rate",
    },
    greekAddress: {
      addressType: "Address Type",
      street: "Street",
      streetPlaceholder: "Enter street",
      number: "Number",
      numberPlaceholder: "Number",
      floor: "Floor",
      apartment: "Apartment",
      postalCode: "Postal Code",
      city: "City",
      cityPlaceholder: "Enter city",
      region: "Region",
      regionPlaceholder: "Select region",
      landmark: "Landmark",
      landmarkPlaceholder: "e.g. near metro station",
      types: {
        home: "Home",
        business: "Business",
        billing: "Billing",
        shipping: "Shipping",
      },
      validation: {
        streetRequired: "Street is required",
        streetTooShort: "Street must be at least 3 characters",
        numberRequired: "Number is required",
        numberInvalid: "Invalid number format (e.g. 123A)",
        postalCodeRequired: "Postal code is required",
        postalCodeInvalid: "Invalid Greek postal code (5 digits)",
        postalCodeMismatch: "Postal code doesn't match city",
        cityRequired: "City is required",
        regionRequired: "Region is required",
      },
    },
    navigation: {
      dashboard: "Dashboard",
      customers: "Customers",
      suppliers: "Suppliers",
      products: "Products",
      invoices: "Invoices",
      reports: "Reports",
      test_flow: "Test Workflow",
      settings: "Settings",
      app_name: "Axiologic",
      welcome_user: "Welcome, {{name}}",
      logout: "Logout",
      logging_out: "Logging out...",
      access_denied: "Access denied. Please contact your administrator.",
    },
    dashboard: {
      welcome_user: "Welcome, {{name}}!",
      company_overview: "Business overview • Company: {{company}}",
      company_not_set: "Not set",
      development_progress: "Development Progress",
      milestone_1_progress: "Milestone 1: CRM + Invoicing (75% Complete)",
      erp_core_next: "ERP Core: Inventory + Finance (Next)",
      total_customers: "Total Customers",
      monthly_invoices: "Monthly Invoices",
      monthly_revenue: "Monthly Revenue",
      active_opportunities: "Active Opportunities",
      recent_activities: "Recent Activities",
      quick_actions: "Quick Actions",
      new_invoice: "New Invoice",
      new_invoice_desc: "Create and send to AADE",
      new_customer: "New Customer",
      new_customer_desc: "Register business/supplier",
      new_opportunity: "New Opportunity",
      new_opportunity_desc: "Register sales opportunity",
      // Error messages
      error_loading_stats: "Error loading statistics",
      data_temporarily_unavailable: "Data temporarily unavailable",
      retry_in_moment: "Please try again in a moment",
      contact_support: "Contact support if the problem persists",
      loading_stats: "Loading statistics...",
      stats_unavailable: "Statistics unavailable",
      schedule: "Schedule",
      schedule_desc: "New appointment or activity",
      system_modules: "System Modules - Development Roadmap",
      milestone_1_title: "Milestone 1: CRM + Invoicing",
      milestone_1_desc: "Core business operations",
      erp_core_title: "ERP Core: Inventory + Finance",
      erp_core_desc: "Integrated business management",
      erp_expansion_title: "ERP Expansion: Advanced Features",
      erp_expansion_desc: "Advanced analytics & automation",
      module_active: "Active",
      module_developing: "Development",
      module_planned: "Planned",
      open_module: "Open module",
      in_development: "In development",
      next_phase: "Next phase",
      view_all_activities: "View all activities →",
      no_recent_activities: "No recent activities",
      no_recent_activities_desc:
        "When you create invoices, customers, or other activities, they will appear here",
      error_loading_activities: "Error loading activities",
      business_management: "Business Management",
      business_management_desc:
        "Customers, suppliers, contacts & relationships",
      greek_invoicing: "Greek Invoicing",
      greek_invoicing_desc: "16 document types & AADE integration",
      sales_pipeline: "Sales & Pipeline",
      sales_pipeline_desc: "Opportunities, quotes & sales forecasting",
      product_catalog: "Product Catalog",
      product_catalog_desc: "Products, services & pricing",
      inventory_management: "Inventory Management",
      inventory_management_desc: "Warehouses, movement & automation",
      financial_management: "Financial Management",
      financial_management_desc: "Accounting, cash flow & finance",
      business_analytics: "Business Analytics",
      business_analytics_desc: "Dashboards, KPIs & forecasting",
      aade_compliance: "AADE Compliance",
      aade_compliance_desc: "MyDATA, tax obligations",
      hr_management: "HR Management",
      hr_management_desc: "HR, payroll & attendance",
      multi_company_security: "Multi-company security system ✓",
      axiologic_integrated: "Axiologic - Integrated Business Management",
      development_phases:
        "Milestone 1: CRM + Invoicing • ERP Core: Inventory + Finance • ERP Expansion: HR + Analytics",
    },
    auth: {
      welcome: "Welcome",
      sign_in_prompt: "Sign in to your account",
      company_description: "Customer and Business Management",
      all_rights_reserved: "All rights reserved.",
      select_language: "Select language",
      select_theme: "Select theme",
    },
    customers: {
      customers_title: "Customers",
      customers_description:
        "Manage your customer relationships and track sales performance",
      add_new_customer: "Add New Customer",
      total_customers: "Total Customers",
      active_customers: "Active Customers",
      total_sales: "Total Sales",
      average_order_value: "Avg. Order Value",
      customer_directory: "Customer Directory",
      error_loading_stats: "Error loading customer statistics",
      back_to_customers: "Back to Customers",
      create_new_customer: "Create New Customer",
      create_customer_description:
        "Fill in the details to create a new customer",
      create_another_customer: "Create another customer after saving",
      create_another_description:
        "Check this to stay on the creation page and add multiple customers quickly",
    },
    suppliers: {
      suppliers_title: "Suppliers",
      suppliers_description:
        "Manage your supplier relationships and procurement processes",
      add_new_supplier: "Add New Supplier",
      total_suppliers: "Total Suppliers",
      active_suppliers: "Active Suppliers",
      total_purchases: "Total Purchases",
      average_rating: "Average Rating",
      supplier_directory: "Supplier Directory",
      error_loading_stats: "Error loading supplier statistics",
      back_to_suppliers: "Back to Suppliers",
      create_new_supplier: "Create New Supplier",
      create_supplier_description:
        "Fill in the details to create a new supplier",
    },
    business_entities: {
      error_loading_entities: "Error loading business entities",
      quick_search_placeholder:
        "Quick search by name, email, AFM, or entity code...",
      // Customer context
      customer_found: "{{count}} Customer found",
      customers_found: "{{count}} Customers found",
      // Supplier context
      supplier_found: "{{count}} Supplier found",
      suppliers_found: "{{count}} Suppliers found",
      // General entity context
      entity_found: "{{count}} Entity found",
      entities_found: "{{count}} Entities found",
      filter_label: "Filter",
      loading_entities: "Loading entities...",
      // General empty states
      no_entities_found: "No Business Entities Found",
      try_adjusting_filters: "Try adjusting your search criteria or filters",
      create_first_entity: "Create your first business entity to get started",
      // Customer specific empty states
      no_customers_found: "No Customers Found",
      create_first_customer: "Create your first customer to get started",
      // Supplier specific empty states
      no_suppliers_found: "No Suppliers Found",
      create_first_supplier: "Create your first supplier to get started",
      valid_afm: "Valid AFM",
      contact_info: "Contact Info",
      business_details: "Business Details",
      roles: "Roles",
      address: "Address",
      // Status translations
      status_active: "Active",
      status_inactive: "Inactive",
      status_suspended: "Suspended",
      status_prospect: "Prospect",
      status_blocked: "Blocked",
      // Role translations
      role_customer: "Customer",
      role_supplier: "Supplier",
      role_partner: "Partner",
      // Directory and relationship management
      customer_directory: "Customer Directory",
      supplier_directory: "Supplier Directory",
      all_directory: "Business Directory",
      manage_customer_relationships:
        "Manage your customer relationships and track sales performance",
      manage_supplier_relationships:
        "Manage your supplier relationships and procurement processes",
      manage_all_relationships:
        "Manage your business relationships and contacts",
      add_new_customer: "Add New Customer",
      add_new_supplier: "Add New Supplier",
      add_new_all: "Add New Entity",
      create_customer: "Create Customer",
      create_supplier: "Create Supplier",
      create_all: "Create Entity",
      // Advanced filters
      advanced_filters: "Advanced Filters",
      entity_types: "Entity Types",
      status: "Status",
      greek_filters: "Greek Filters",
      date_filters: "Date Filters",
      created_after: "Created After",
      created_before: "Created Before",
      has_valid_afm: "Has Valid AFM",
      vat_exempt: "VAT Exempt",
      // Entity type translations
      entity_type_business: "Business",
      entity_type_individual: "Individual",
      entity_type_government: "Government",
      entity_type_non_profit: "Non-Profit",
      // Form specific translations
      entity_type: "Entity Type",
      basic_information: "Basic Information",
      business_name: "Business Name",
      business_name_placeholder: "Enter business name",
      first_name: "First Name",
      first_name_placeholder: "Enter first name",
      last_name: "Last Name",
      last_name_placeholder: "Enter last name",
      display_name: "Display Name",
      display_name_placeholder: "Display name for lists and reports",
      greek_tax_information: "Greek Tax Information",
      business_activity_placeholder: "e.g., Software Development",
      email: "Email Address",
      website: "Website",
      mobile: "Mobile Number",
      business_settings: "Business Settings",
      payment_terms: "Payment Terms",
      cash_on_delivery: "Cash on Delivery",
      net_15: "Net 15 days",
      net_30: "Net 30 days",
      net_60: "Net 60 days",
      net_90: "Net 90 days",
      prepaid: "Prepaid",
      credit_limit: "Credit Limit (€)",
      discount_percentage: "Discount (%)",
      additional_notes: "Additional Notes",
      notes_placeholder: "Additional notes about this entity...",
      create_new_description: "Add a new business entity with Greek compliance",
      edit_description: "Update business entity information",
      error_loading_entity: "Failed to load entity data",
      error_saving_entity: "Failed to save business entity",
      entity_created_success: "Business entity created successfully",
      entity_updated_success: "Business entity updated successfully",
      validation: {
        display_name_required: "Display name is required",
        business_name_required: "Business name is required",
        first_name_required: "First name is required",
        last_name_required: "Last name is required",
        invalid_email: "Invalid email address",
        invalid_url: "Invalid website URL",
      },
    },
  },
};

// Translation context
const TranslationContext = createContext<TranslationContextValue | null>(null);

// Storage keys
const LANGUAGE_STORAGE_KEY = "ui_language";
const PREFERENCES_STORAGE_KEY = "ui_language_preferences";

// Language detection utilities
const detectLanguageFromPath = (): Language | null => {
  const path = window.location.pathname;
  const pathLang = path.split("/")[1];
  return pathLang === "el" || pathLang === "en" ? pathLang : null;
};

const detectLanguageFromNavigator = (): Language | null => {
  const browserLang = navigator.language || navigator.languages?.[0];
  if (browserLang?.startsWith("el")) return "el";
  if (browserLang?.startsWith("en")) return "en";
  return null;
};

const detectLanguageFromHeaders = (): Language | null => {
  // For SSR, this would check Accept-Language header
  // For now, we'll use navigator as fallback
  return detectLanguageFromNavigator();
};

// Translation utilities
const interpolateString = (
  str: string,
  variables?: Record<string, string | number>
): string => {
  if (!variables) return str;

  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return String(variables[key] || match);
  });
};

const getNestedValue = (obj: any, path: string): string | undefined => {
  return path.split(".").reduce((current, key) => current?.[key], obj);
};

// Translation provider component
interface TranslationProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
  resources?: LanguageResources;
  detectLanguage?: boolean;
  storageKey?: string;
  fallbackLanguage?: Language;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  defaultLanguage = "el",
  resources = DEFAULT_RESOURCES,
  detectLanguage = true,
  storageKey = LANGUAGE_STORAGE_KEY,
  fallbackLanguage = "en",
}) => {
  // Initialize language with stable SSR value
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [translationResources, setTranslationResources] =
    useState<LanguageResources>(resources);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration mismatch by updating language after mount
  useEffect(() => {
    setIsClient(true);

    // Only check stored/detected language after client mount
    if (typeof window !== "undefined") {
      // Try to get from localStorage first
      const stored = localStorage.getItem(storageKey);
      if (stored && (stored === "el" || stored === "en")) {
        setLanguageState(stored as Language);
        return;
      }

      // Auto-detect language if enabled
      if (detectLanguage) {
        const detected =
          detectLanguageFromPath() ||
          detectLanguageFromHeaders() ||
          detectLanguageFromNavigator();

        if (detected) {
          localStorage.setItem(storageKey, detected);
          setLanguageState(detected);
          return;
        }
      }
    }
  }, [detectLanguage, storageKey]);

  // Language preferences
  const [preferences, setPreferences] = useState<UserLanguagePreferences>(
    () => {
      if (typeof window === "undefined") {
        return {
          primaryLanguage: language,
          fallbackLanguage: fallbackLanguage,
          dateFormat: "dd/MM/yyyy",
          numberFormat: "european",
          currency: "EUR",
          timezone: "Europe/Athens",
        };
      }

      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Fall through to defaults
        }
      }

      return {
        primaryLanguage: language,
        fallbackLanguage: fallbackLanguage,
        dateFormat: "dd/MM/yyyy",
        numberFormat: "european",
        currency: "EUR",
        timezone: "Europe/Athens",
      };
    }
  );

  // Update language and persist to storage
  const setLanguage = useCallback(
    (newLanguage: Language) => {
      setLanguageState(newLanguage);
      localStorage.setItem(storageKey, newLanguage);

      // Update preferences
      setPreferences((prev) => ({
        ...prev,
        primaryLanguage: newLanguage,
      }));
    },
    [storageKey]
  );

  // Translation function
  const t = useCallback(
    (key: string, options?: TranslationOptions): string => {
      const {
        ns = "common",
        defaultValue = key,
        variables,
        count,
      } = options || {};

      try {
        // Get translation from current language
        const currentLangResources = translationResources[language];
        if (currentLangResources) {
          const namespace = currentLangResources[ns];
          if (namespace) {
            const value = getNestedValue(namespace, key);
            if (value) {
              // Handle pluralization
              if (count !== undefined && typeof count === "number") {
                // Simple pluralization logic - can be extended
                const pluralKey = count === 1 ? key : `${key}_plural`;
                const pluralValue = getNestedValue(namespace, pluralKey);
                if (pluralValue) {
                  return interpolateString(pluralValue, {
                    ...variables,
                    count,
                  });
                }
              }

              return interpolateString(value, variables);
            }
          }
        }

        // Fallback to fallback language
        const fallbackLangResources = translationResources[fallbackLanguage];
        if (fallbackLangResources) {
          const namespace = fallbackLangResources[ns];
          if (namespace) {
            const value = getNestedValue(namespace, key);
            if (value) {
              return interpolateString(value, variables);
            }
          }
        }

        // Return default value or key
        return interpolateString(defaultValue, variables);
      } catch (err) {
        console.warn(`Translation error for key "${key}":`, err);
        return defaultValue;
      }
    },
    [language, translationResources, fallbackLanguage]
  );

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  // Context value
  const contextValue = useMemo<TranslationContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      resources: translationResources,
      isLoading,
      error,
    }),
    [language, setLanguage, t, translationResources, isLoading, error]
  );

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

// Hook to use translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};

// Hook to get current language and setter
export const useLanguage = () => {
  const { language, setLanguage } = useTranslation();
  return { language, setLanguage };
};

// Hook to get translation function with namespace
export const useTranslationNamespace = (namespace: string) => {
  const { t } = useTranslation();
  return useCallback(
    (key: string, options?: Omit<TranslationOptions, "ns">) => {
      return t(key, { ...options, ns: namespace });
    },
    [t, namespace]
  );
};
