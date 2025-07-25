"use client";

import React, { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Info,
  ExternalLink,
  BookOpen,
  Scale,
  Building,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface GreekBusinessTerm {
  term: string;
  greekTerm: string;
  category:
    | "legal"
    | "tax"
    | "accounting"
    | "commerce"
    | "financial"
    | "regulatory";
  definition: string;
  greekDefinition: string;
  legalReference?: string;
  usage?: string;
  examples?: string[];
  relatedTerms?: string[];
  importance?: "low" | "medium" | "high" | "critical";
  lastUpdated?: Date;
  source?: string;
  url?: string;
}

export interface GreekBusinessTermDisplayProps {
  term: GreekBusinessTerm | string;
  variant?: "inline" | "card" | "detailed" | "tooltip";
  showDefinition?: boolean;
  showLegalReference?: boolean;
  showExamples?: boolean;
  showRelatedTerms?: boolean;
  language?: "el" | "en" | "both";
  className?: string;
  onClick?: (term: GreekBusinessTerm) => void;
  interactive?: boolean;
}

// Predefined Greek business terms database
const GREEK_BUSINESS_TERMS: Record<string, GreekBusinessTerm> = {
  AFM: {
    term: "Tax Registration Number",
    greekTerm: "Αριθμός Φορολογικού Μητρώου (Α.Φ.Μ.)",
    category: "tax",
    definition: "A unique 9-digit number assigned to every taxpayer in Greece",
    greekDefinition:
      "Μοναδικός 9ψήφιος αριθμός που αποδίδεται σε κάθε φορολογούμενο στην Ελλάδα",
    legalReference: "Ν. 3842/2010, άρθρο 12",
    usage:
      "Required for all business transactions, tax filings, and official documents",
    examples: ["123456789", "999888777"],
    relatedTerms: ["DOY", "Tax Office", "AADE"],
    importance: "critical",
    source: "AADE - Independent Authority for Public Revenue",
  },
  DOY: {
    term: "Tax Office",
    greekTerm: "Δημόσια Οικονομική Υπηρεσία (Δ.Ο.Υ.)",
    category: "tax",
    definition:
      "Local tax office responsible for tax collection and taxpayer services",
    greekDefinition:
      "Τοπική υπηρεσία αρμόδια για τη συλλογή φόρων και την εξυπηρέτηση φορολογουμένων",
    legalReference: "Ν. 4270/2014",
    usage: "Taxpayers must register with their local DOY for tax obligations",
    examples: ["DOY Αθηνών", "DOY Θεσσαλονίκης", "DOY Πατρών"],
    relatedTerms: ["AFM", "AADE", "Tax Declaration"],
    importance: "high",
    source: "Ministry of Finance",
  },
  AADE: {
    term: "Independent Authority for Public Revenue",
    greekTerm: "Ανεξάρτητη Αρχή Δημοσίων Εσόδων (Α.Α.Δ.Ε.)",
    category: "tax",
    definition:
      "Greek tax authority responsible for tax administration and collection",
    greekDefinition:
      "Ελληνική φορολογική αρχή υπεύθυνη για τη διοίκηση και συλλογή φόρων",
    legalReference: "Ν. 4389/2016",
    usage: "Central authority overseeing all tax-related activities in Greece",
    examples: ["MyAADE portal", "TaxisNet", "Digital services"],
    relatedTerms: ["AFM", "DOY", "TaxisNet"],
    importance: "critical",
    source: "AADE Official Portal",
  },
  FPA: {
    term: "Value Added Tax (VAT)",
    greekTerm: "Φόρος Προστιθέμενης Αξίας (Φ.Π.Α.)",
    category: "tax",
    definition:
      "Consumption tax levied on the value added to goods and services",
    greekDefinition:
      "Φόρος κατανάλωσης που επιβάλλεται στην προστιθέμενη αξία αγαθών και υπηρεσιών",
    legalReference: "Ν. 2859/2000 (Κώδικας ΦΠΑ)",
    usage: "Applied to most commercial transactions in Greece",
    examples: [
      "24% standard rate",
      "13% reduced rate",
      "6% super-reduced rate",
    ],
    relatedTerms: ["Invoice", "Tax Return", "Deduction"],
    importance: "critical",
    source: "Greek VAT Code",
  },
  AE: {
    term: "Société Anonyme (Public Limited Company)",
    greekTerm: "Ανώνυμη Εταιρεία (Α.Ε.)",
    category: "legal",
    definition: "Greek corporate form equivalent to a public limited company",
    greekDefinition:
      "Ελληνική εταιρική μορφή ισοδύναμη με δημόσια εταιρεία περιορισμένης ευθύνης",
    legalReference: "Ν. 4548/2018 (Νόμος για τις ΑΕ)",
    usage: "Used for larger businesses with share capital divided into shares",
    examples: ["OTE A.E.", "Alpha Bank A.E.", "ΤΙΤΑΝ Α.Ε."],
    relatedTerms: ["EPE", "IKE", "Share Capital", "Board of Directors"],
    importance: "high",
    source: "Company Law 4548/2018",
  },
  EPE: {
    term: "Limited Liability Company",
    greekTerm: "Εταιρεία Περιορισμένης Ευθύνης (Ε.Π.Ε.)",
    category: "legal",
    definition: "Greek corporate form with limited liability for partners",
    greekDefinition:
      "Ελληνική εταιρική μορφή με περιορισμένη ευθύνη των εταίρων",
    legalReference: "Ν. 3190/1955",
    usage: "Popular choice for small to medium-sized businesses",
    examples: ["Trading EPE", "Services EPE", "Construction EPE"],
    relatedTerms: ["AE", "IKE", "Partnership", "Limited Liability"],
    importance: "high",
    source: "Law 3190/1955",
  },
  IKE: {
    term: "Private Company",
    greekTerm: "Ιδιωτική Κεφαλαιουχική Εταιρεία (Ι.Κ.Ε.)",
    category: "legal",
    definition: "Modern Greek corporate form with flexible structure",
    greekDefinition: "Σύγχρονη ελληνική εταιρική μορφή με ευέλικτη δομή",
    legalReference: "Ν. 4072/2012",
    usage: "Flexible alternative to traditional corporate forms",
    examples: ["Tech IKE", "Consulting IKE", "Import-Export IKE"],
    relatedTerms: ["AE", "EPE", "Partnership Agreement", "Share Capital"],
    importance: "medium",
    source: "Law 4072/2012",
  },
};

export const GreekBusinessTermDisplay: React.FC<
  GreekBusinessTermDisplayProps
> = ({
  term,
  variant = "inline",
  showDefinition = true,
  showLegalReference = false,
  showExamples = false,
  showRelatedTerms = false,
  language = "both",
  className = "",
  onClick,
  interactive = false,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const termData = typeof term === "string" ? GREEK_BUSINESS_TERMS[term] : term;

  if (!termData) {
    return (
      <span className={`text-red-500 ${className}`}>
        {typeof term === "string" ? term : "Unknown term"}
      </span>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "legal":
        return <Scale className="w-4 h-4" />;
      case "tax":
        return <FileText className="w-4 h-4" />;
      case "accounting":
        return <BookOpen className="w-4 h-4" />;
      case "commerce":
        return <Building className="w-4 h-4" />;
      case "financial":
        return <Building className="w-4 h-4" />;
      case "regulatory":
        return <Scale className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "legal":
        return "text-purple-600 bg-purple-100";
      case "tax":
        return "text-blue-600 bg-blue-100";
      case "accounting":
        return "text-green-600 bg-green-100";
      case "commerce":
        return "text-orange-600 bg-orange-100";
      case "financial":
        return "text-indigo-600 bg-indigo-100";
      case "regulatory":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getImportanceColor = (importance?: string) => {
    switch (importance) {
      case "critical":
        return "border-l-red-500 bg-red-50";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50";
      case "low":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const renderTermText = () => {
    switch (language) {
      case "el":
        return termData.greekTerm;
      case "en":
        return termData.term;
      case "both":
      default:
        return (
          <span>
            <span className="font-medium">{termData.term}</span>
            <span className="text-gray-500 ml-2">({termData.greekTerm})</span>
          </span>
        );
    }
  };

  const renderDefinition = () => {
    if (!showDefinition) return null;

    const definition =
      language === "el" ? termData.greekDefinition : termData.definition;
    return <p className="text-sm text-gray-600 mt-2">{definition}</p>;
  };

  if (variant === "inline") {
    return (
      <span
        className={`
          inline-flex items-center text-blue-600 hover:text-blue-800 cursor-help
          ${interactive ? "underline" : ""}
          ${className}
        `}
        onClick={() => interactive && onClick?.(termData)}
        title={showDefinition ? termData.definition : undefined}
      >
        {renderTermText()}
        {showDefinition && <Info className="w-3 h-3 ml-1 opacity-70" />}
      </span>
    );
  }

  if (variant === "tooltip") {
    return (
      <div className={`relative group ${className}`}>
        <span className="text-blue-600 hover:text-blue-800 cursor-help border-b border-dashed border-blue-300">
          {renderTermText()}
        </span>
        <div className="absolute z-10 invisible group-hover:visible bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg max-w-xs">
          <div className="font-medium mb-1">{termData.term}</div>
          <div className="text-gray-300">{termData.definition}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    );
  }

  if (variant === "card" || variant === "detailed") {
    return (
      <div
        className={`
        bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow
        ${termData.importance ? getImportanceColor(termData.importance) : ""}
        border-l-4
        ${interactive ? "cursor-pointer" : ""}
        ${className}
      `}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className={`p-1.5 rounded-md ${getCategoryColor(
                    termData.category
                  )}`}
                >
                  {getCategoryIcon(termData.category)}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(
                    termData.category
                  )}`}
                >
                  {t(`greekBusiness.categories.${termData.category}`)}
                </span>
                {termData.importance && (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      termData.importance === "critical"
                        ? "bg-red-100 text-red-800"
                        : termData.importance === "high"
                        ? "bg-orange-100 text-orange-800"
                        : termData.importance === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {t(`greekBusiness.importance.${termData.importance}`)}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {renderTermText()}
              </h3>
            </div>

            {variant === "detailed" && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {/* Definition */}
          {renderDefinition()}

          {/* Usage */}
          {termData.usage && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {t("greekBusiness.usage")}
              </h4>
              <p className="text-sm text-gray-600">{termData.usage}</p>
            </div>
          )}

          {/* Expanded Content */}
          {variant === "detailed" &&
            (isExpanded ||
              showLegalReference ||
              showExamples ||
              showRelatedTerms) && (
              <div className="mt-4 space-y-3">
                {/* Legal Reference */}
                {(showLegalReference || isExpanded) &&
                  termData.legalReference && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1 flex items-center">
                        <Scale className="w-4 h-4 mr-1" />
                        {t("greekBusiness.legalReference")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {termData.legalReference}
                      </p>
                    </div>
                  )}

                {/* Examples */}
                {(showExamples || isExpanded) &&
                  termData.examples &&
                  termData.examples.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {t("greekBusiness.examples")}
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {termData.examples.map((example, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Related Terms */}
                {(showRelatedTerms || isExpanded) &&
                  termData.relatedTerms &&
                  termData.relatedTerms.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        {t("greekBusiness.relatedTerms")}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {termData.relatedTerms.map((relatedTerm, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full hover:bg-gray-200 cursor-pointer"
                            onClick={() => {
                              const related = GREEK_BUSINESS_TERMS[relatedTerm];
                              if (related) onClick?.(related);
                            }}
                          >
                            {relatedTerm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Source and URL */}
                {(termData.source || termData.url) && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {termData.source && (
                        <span>
                          {t("greekBusiness.source")}: {termData.source}
                        </span>
                      )}
                      {termData.url && (
                        <a
                          href={termData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          {t("greekBusiness.learnMore")}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>
                    {termData.lastUpdated && (
                      <div className="text-xs text-gray-400 mt-1">
                        {t("greekBusiness.lastUpdated")}:{" "}
                        {termData.lastUpdated.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    );
  }

  return null;
};

// Helper function to get term data
export const getGreekBusinessTerm = (
  termKey: string
): GreekBusinessTerm | undefined => {
  return GREEK_BUSINESS_TERMS[termKey];
};

// Helper function to search terms
export const searchGreekBusinessTerms = (
  query: string
): GreekBusinessTerm[] => {
  const searchLower = query.toLowerCase();
  return Object.values(GREEK_BUSINESS_TERMS).filter(
    (term) =>
      term.term.toLowerCase().includes(searchLower) ||
      term.greekTerm.toLowerCase().includes(searchLower) ||
      term.definition.toLowerCase().includes(searchLower) ||
      term.greekDefinition.toLowerCase().includes(searchLower)
  );
};

export default GreekBusinessTermDisplay;
