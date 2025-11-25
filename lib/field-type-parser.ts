import { SchemaField, DropdownOption } from "@/components/campaigns/schema-config-editor";

/**
 * Parse a CSV value based on the field type
 */
export function parseFieldValue(
  value: string,
  fieldType: SchemaField["type"],
  options?: string[]
): any {
  if (!value || value.trim() === "") {
    return null;
  }

  const trimmedValue = value.trim();

  switch (fieldType) {
    case "checkbox":
      // Handle various boolean representations
      const lowerValue = trimmedValue.toLowerCase();
      if (["true", "yes", "1", "y", "checked", "on"].includes(lowerValue)) {
        return true;
      }
      if (["false", "no", "0", "n", "unchecked", "off", ""].includes(lowerValue)) {
        return false;
      }
      // Default to false if unclear
      return false;

    case "number":
      const numValue = parseFloat(trimmedValue.replace(/[^\d.-]/g, ""));
      return isNaN(numValue) ? null : numValue;

    case "currency":
      // Remove currency symbols and parse
      const currencyValue = parseFloat(
        trimmedValue.replace(/[^\d.-]/g, "").replace(/,/g, "")
      );
      return isNaN(currencyValue) ? null : currencyValue;

    case "date":
      // Try to parse date
      const dateValue = new Date(trimmedValue);
      return isNaN(dateValue.getTime()) ? trimmedValue : dateValue.toISOString();

    case "dropdown":
      // Validate against options if provided
      if (options && options.length > 0) {
        // Handle both string[] and DropdownOption[] formats
        const optionValues = options.map((opt) =>
          typeof opt === "string" ? opt : (opt as any).value
        );
        // Case-insensitive match
        const matchedValue = optionValues.find(
          (opt) => opt.toLowerCase() === trimmedValue.toLowerCase()
        );
        return matchedValue || trimmedValue; // Return original if no match (for flexibility)
      }
      return trimmedValue;

    case "email":
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(trimmedValue) ? trimmedValue : trimmedValue; // Return anyway, validation happens elsewhere

    case "phone":
      // Clean phone number (remove non-digits except +)
      return trimmedValue.replace(/[^\d+()-]/g, "");

    case "url":
      // Ensure URL has protocol
      if (trimmedValue && !trimmedValue.match(/^https?:\/\//)) {
        return `https://${trimmedValue}`;
      }
      return trimmedValue;

    case "tags":
      // Split by comma, semicolon, or newline
      return trimmedValue
        .split(/[,;\n]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

    case "textarea":
    case "text":
    default:
      return trimmedValue;
  }
}

/**
 * Validate a value against field constraints
 */
export function validateFieldValue(
  value: any,
  field: SchemaField
): { valid: boolean; error?: string } {
  // Check required
  if (field.required && (value === null || value === undefined || value === "")) {
    return { valid: false, error: `${field.label} is required` };
  }

  // Check dropdown options
  if (field.type === "dropdown" && field.options && field.options.length > 0) {
    const optionValues = field.options.map((opt) =>
      typeof opt === "string" ? opt : (opt as DropdownOption).value
    );
    if (value && !optionValues.includes(value)) {
      return {
        valid: false,
        error: `${field.label} must be one of: ${optionValues.join(", ")}`,
      };
    }
  }

  // Check email format
  if (field.type === "email" && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: `${field.label} must be a valid email address` };
    }
  }

  // Check URL format
  if (field.type === "url" && value) {
    try {
      new URL(value);
    } catch {
      return { valid: false, error: `${field.label} must be a valid URL` };
    }
  }

  return { valid: true };
}

