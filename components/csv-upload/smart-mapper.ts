/**
 * Smart Auto-Mapping Utility
 * 
 * Provides intelligent field mapping suggestions using:
 * - Fuzzy string matching for column name similarity
 * - Data pattern recognition (email, phone, date, etc.)
 * - Confidence scoring system
 */

import { SchemaField } from "@/components/campaigns/schema-config-editor";

// Standard system fields with common aliases
const STANDARD_FIELDS = [
  { 
    key: "firstName", 
    label: "First Name",
    aliases: ["first name", "firstname", "first", "prenom", "prénom", "given name", "givenname", "fname"],
    patterns: [] 
  },
  { 
    key: "lastName", 
    label: "Last Name",
    aliases: ["last name", "lastname", "last", "nom", "family name", "familyname", "surname", "lname"],
    patterns: [] 
  },
  { 
    key: "email", 
    label: "Email",
    aliases: ["email", "e-mail", "mail", "email address", "courriel", "emailaddress"],
    patterns: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/] 
  },
  { 
    key: "phone", 
    label: "Phone",
    aliases: ["phone", "telephone", "tel", "mobile", "cell", "phone number", "phonenumber", "téléphone", "numero"],
    patterns: [/^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/] 
  },
  { 
    key: "jobTitle", 
    label: "Job Title",
    aliases: ["job title", "jobtitle", "title", "position", "role", "fonction", "poste", "job"],
    patterns: [] 
  },
  { 
    key: "company", 
    label: "Company",
    aliases: ["company", "organization", "organisation", "entreprise", "société", "societe", "firm", "business"],
    patterns: [] 
  },
];

// Data type patterns for automatic detection
const DATA_TYPE_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  date: /^(\d{1,4}[-\/\.]\d{1,2}[-\/\.]\d{1,4})|(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})$/,
  number: /^-?[\d,]+\.?\d*$/,
  currency: /^[$€£¥]?\s?[\d,]+\.?\d*\s?[$€£¥]?$/,
  boolean: /^(true|false|yes|no|oui|non|1|0)$/i,
};

export interface MappingSuggestion {
  csvColumn: string;
  suggestedField: string;
  fieldLabel: string;
  confidence: number;
  reason: string;
  detectedType?: SchemaField["type"];
  isStandardField: boolean;
}

export interface ColumnStatistics {
  column: string;
  totalValues: number;
  emptyValues: number;
  uniqueValues: number;
  sampleValues: string[];
  detectedType: SchemaField["type"];
  typeConfidence: number;
  issues: ColumnIssue[];
}

export interface ColumnIssue {
  type: "empty" | "duplicate" | "inconsistent" | "invalid";
  message: string;
  severity: "warning" | "error" | "info";
  affectedCount?: number;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score (0-1) based on Levenshtein distance
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

/**
 * Check if a string contains any of the keywords
 */
function containsKeyword(str: string, keywords: string[]): { match: boolean; score: number } {
  const normalized = str.toLowerCase().replace(/[_\-\s]+/g, " ").trim();
  
  for (const keyword of keywords) {
    if (normalized === keyword) {
      return { match: true, score: 1 };
    }
    if (normalized.includes(keyword) || keyword.includes(normalized)) {
      const lengthRatio = Math.min(normalized.length, keyword.length) / Math.max(normalized.length, keyword.length);
      return { match: true, score: 0.7 + (lengthRatio * 0.2) };
    }
  }
  
  // Fuzzy match
  let bestScore = 0;
  for (const keyword of keywords) {
    const score = stringSimilarity(normalized, keyword);
    if (score > bestScore) {
      bestScore = score;
    }
  }
  
  return { match: bestScore > 0.7, score: bestScore };
}

/**
 * Detect the data type from sample values
 */
export function detectDataType(values: string[]): { type: SchemaField["type"]; confidence: number } {
  const nonEmptyValues = values.filter(v => v && v.trim() !== "");
  if (nonEmptyValues.length === 0) {
    return { type: "text", confidence: 0.5 };
  }

  const typeScores: Record<string, number> = {
    email: 0,
    phone: 0,
    url: 0,
    date: 0,
    number: 0,
    currency: 0,
    checkbox: 0,
  };

  for (const value of nonEmptyValues) {
    const trimmed = value.trim();
    
    if (DATA_TYPE_PATTERNS.email.test(trimmed)) typeScores.email++;
    if (DATA_TYPE_PATTERNS.phone.test(trimmed)) typeScores.phone++;
    if (DATA_TYPE_PATTERNS.url.test(trimmed)) typeScores.url++;
    if (DATA_TYPE_PATTERNS.date.test(trimmed)) typeScores.date++;
    if (DATA_TYPE_PATTERNS.number.test(trimmed)) typeScores.number++;
    if (DATA_TYPE_PATTERNS.currency.test(trimmed)) typeScores.currency++;
    if (DATA_TYPE_PATTERNS.boolean.test(trimmed)) typeScores.checkbox++;
  }

  const total = nonEmptyValues.length;
  let bestType: SchemaField["type"] = "text";
  let bestScore = 0;

  for (const [type, count] of Object.entries(typeScores)) {
    const score = count / total;
    if (score > bestScore && score > 0.5) {
      bestScore = score;
      bestType = type as SchemaField["type"];
    }
  }

  return { type: bestType, confidence: bestScore || 0.5 };
}

/**
 * Detect potential dropdown values from unique values
 */
export function detectDropdownOptions(values: string[]): string[] | null {
  const nonEmpty = values.filter(v => v && v.trim() !== "");
  const uniqueValues = [...new Set(nonEmpty.map(v => v.trim()))];
  
  // If there are 2-15 unique values and they're repeated, it's likely a dropdown
  if (uniqueValues.length >= 2 && uniqueValues.length <= 15 && uniqueValues.length < nonEmpty.length * 0.3) {
    return uniqueValues.sort();
  }
  
  return null;
}

/**
 * Generate smart mapping suggestions for CSV columns
 */
export function generateMappingSuggestions(
  csvHeaders: string[],
  sampleData: Record<string, string>[],
  existingSchemaFields: SchemaField[] = []
): MappingSuggestion[] {
  const suggestions: MappingSuggestion[] = [];
  const usedFields = new Set<string>();

  // Combine standard fields with existing schema fields
  const allFields = [
    ...STANDARD_FIELDS.map(f => ({ ...f, isStandard: true })),
    ...existingSchemaFields.map(f => ({
      key: `custom:${f.key}`,
      label: f.label,
      aliases: [f.key.toLowerCase(), f.label.toLowerCase()],
      patterns: [] as RegExp[],
      isStandard: false,
    })),
  ];

  for (const csvColumn of csvHeaders) {
    let bestMatch: MappingSuggestion | null = null;
    let bestScore = 0;

    // Get sample values for this column
    const columnValues = sampleData.map(row => row[csvColumn] || "");
    const { type: detectedType, confidence: typeConfidence } = detectDataType(columnValues);

    for (const field of allFields) {
      if (usedFields.has(field.key)) continue;

      let score = 0;
      let reason = "";

      // Check alias match
      const aliasMatch = containsKeyword(csvColumn, field.aliases);
      if (aliasMatch.match) {
        score = aliasMatch.score;
        reason = `Column name matches "${field.label}"`;
      }

      // Check data pattern match (only for standard fields with patterns)
      if (field.patterns.length > 0 && columnValues.length > 0) {
        const patternMatches = columnValues.filter(v => 
          v && field.patterns.some(p => p.test(v.trim()))
        ).length;
        const patternScore = patternMatches / Math.max(columnValues.filter(v => v).length, 1);
        
        if (patternScore > 0.5) {
          if (patternScore > score) {
            score = patternScore;
            reason = `Data pattern matches ${field.label} format`;
          } else if (score > 0) {
            score = (score + patternScore) / 2 + 0.1; // Boost when both match
            reason = `Column name and data pattern match "${field.label}"`;
          }
        }
      }

      if (score > bestScore && score > 0.4) {
        bestScore = score;
        bestMatch = {
          csvColumn,
          suggestedField: field.key,
          fieldLabel: field.label,
          confidence: Math.min(score, 1),
          reason,
          detectedType: field.isStandard ? undefined : detectedType,
          isStandardField: field.isStandard,
        };
      }
    }

    if (bestMatch) {
      usedFields.add(bestMatch.suggestedField);
      suggestions.push(bestMatch);
    } else {
      // No match - suggest as custom field
      suggestions.push({
        csvColumn,
        suggestedField: "skip",
        fieldLabel: "Skip this column",
        confidence: 0,
        reason: "No matching field found",
        detectedType,
        isStandardField: false,
      });
    }
  }

  return suggestions;
}

/**
 * Analyze column data and generate statistics
 */
export function analyzeColumnData(
  columnName: string,
  values: string[]
): ColumnStatistics {
  const issues: ColumnIssue[] = [];
  
  const emptyCount = values.filter(v => !v || v.trim() === "").length;
  const nonEmptyValues = values.filter(v => v && v.trim() !== "");
  const uniqueValues = [...new Set(nonEmptyValues.map(v => v.trim()))];
  const duplicateCount = nonEmptyValues.length - uniqueValues.length;

  // Detect issues
  if (emptyCount > 0) {
    const percentage = Math.round((emptyCount / values.length) * 100);
    issues.push({
      type: "empty",
      message: `${emptyCount} empty values (${percentage}%)`,
      severity: percentage > 50 ? "warning" : "info",
      affectedCount: emptyCount,
    });
  }

  if (duplicateCount > 0 && uniqueValues.length < values.length * 0.5) {
    issues.push({
      type: "duplicate",
      message: `${duplicateCount} duplicate values detected`,
      severity: "info",
      affectedCount: duplicateCount,
    });
  }

  // Detect type
  const { type, confidence } = detectDataType(nonEmptyValues);

  // Check for inconsistent data types
  if (confidence < 0.8 && nonEmptyValues.length > 5) {
    issues.push({
      type: "inconsistent",
      message: "Mixed data formats detected",
      severity: "warning",
    });
  }

  return {
    column: columnName,
    totalValues: values.length,
    emptyValues: emptyCount,
    uniqueValues: uniqueValues.length,
    sampleValues: uniqueValues.slice(0, 5),
    detectedType: type,
    typeConfidence: confidence,
    issues,
  };
}

/**
 * Analyze all columns and return comprehensive statistics
 */
export function analyzeAllColumns(
  headers: string[],
  rows: Record<string, string>[]
): ColumnStatistics[] {
  return headers.map(header => {
    const values = rows.map(row => row[header] || "");
    return analyzeColumnData(header, values);
  });
}

/**
 * Get field type icon name based on type
 */
export function getFieldTypeIcon(type: SchemaField["type"]): string {
  const iconMap: Record<string, string> = {
    text: "Type",
    textarea: "AlignLeft",
    number: "Hash",
    currency: "DollarSign",
    date: "Calendar",
    email: "Mail",
    phone: "Phone",
    url: "Link",
    checkbox: "CheckSquare",
    dropdown: "ChevronDown",
    tags: "Tags",
  };
  return iconMap[type] || "Type";
}

/**
 * Get confidence level label
 */
export function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 0.9) return { label: "Excellent", color: "success" };
  if (confidence >= 0.7) return { label: "Good", color: "success" };
  if (confidence >= 0.5) return { label: "Fair", color: "warning" };
  return { label: "Low", color: "error" };
}

