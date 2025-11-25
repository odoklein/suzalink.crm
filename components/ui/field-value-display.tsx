"use client";

import { Badge } from "@/components/ui/badge";
import { SchemaField, DropdownOption } from "@/components/campaigns/schema-config-editor";
import { CheckCircle, XCircle } from "lucide-react";

interface FieldValueDisplayProps {
  field: SchemaField;
  value: any;
}

export function FieldValueDisplay({ field, value }: FieldValueDisplayProps) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-text-body">-</span>;
  }

  switch (field.type) {
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          {value ? (
            <CheckCircle className="h-4 w-4 text-success-500" />
          ) : (
            <XCircle className="h-4 w-4 text-text-body" />
          )}
          <span className="text-sm text-text-main">{value ? "Yes" : "No"}</span>
        </div>
      );

    case "dropdown":
      // Normalize options to DropdownOption format
      const options: DropdownOption[] = (field.options || []).map((opt) =>
        typeof opt === "string" ? { value: opt } : opt
      );
      
      const selectedOption = options.find((opt) => opt.value === value);
      
      if (selectedOption?.color) {
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium"
            style={{
              backgroundColor: `${selectedOption.color}20`,
              borderColor: selectedOption.color,
              color: selectedOption.color,
            }}
          >
            {value}
          </Badge>
        );
      }
      
      return <span className="text-sm text-text-main">{value}</span>;

    case "tags":
      const tags = Array.isArray(value) ? value : [value];
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {String(tag)}
            </Badge>
          ))}
        </div>
      );

    case "currency":
      return (
        <span className="text-sm text-text-main font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(Number(value))}
        </span>
      );

    case "number":
      return (
        <span className="text-sm text-text-main font-medium">
          {new Intl.NumberFormat("en-US").format(Number(value))}
        </span>
      );

    case "date":
      try {
        const date = new Date(value);
        return (
          <span className="text-sm text-text-main">
            {date.toLocaleDateString()}
          </span>
        );
      } catch {
        return <span className="text-sm text-text-main">{String(value)}</span>;
      }

    case "url":
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary-500 hover:text-primary-hover underline"
        >
          {String(value)}
        </a>
      );

    case "email":
      return (
        <a
          href={`mailto:${value}`}
          className="text-sm text-primary-500 hover:text-primary-hover"
        >
          {String(value)}
        </a>
      );

    case "phone":
      return (
        <a
          href={`tel:${value}`}
          className="text-sm text-primary-500 hover:text-primary-hover"
        >
          {String(value)}
        </a>
      );

    case "textarea":
      return (
        <p className="text-sm text-text-main whitespace-pre-wrap max-w-md">
          {String(value)}
        </p>
      );

    default:
      return <span className="text-sm text-text-main">{String(value)}</span>;
  }
}

