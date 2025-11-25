"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Predefined color palette matching design system
const COLOR_PALETTE = [
  { name: "Mint Green", value: "#3BBF7A" },
  { name: "Blue", value: "#4C85FF" },
  { name: "Orange", value: "#FFA445" },
  { name: "Purple", value: "#A46CFF" },
  { name: "Pink", value: "#FF6D9D" },
  { name: "Teal", value: "#20C4B5" },
  { name: "Red", value: "#FF4D4F" },
  { name: "Yellow", value: "#FFC107" },
  { name: "Gray", value: "#98A2B3" },
];

export type DropdownOption = {
  value: string;
  color?: string; // Hex color code, e.g., "#3BBF7A"
};

export type SchemaField = {
  key: string;
  label: string;
  type: "text" | "number" | "currency" | "tags" | "date" | "checkbox" | "dropdown" | "email" | "phone" | "url" | "textarea";
  options?: string[] | DropdownOption[]; // For dropdown type - supports both old format (string[]) and new format (DropdownOption[])
  required?: boolean;
  defaultValue?: string | number | boolean;
};

type SchemaConfigEditorProps = {
  value: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
};

export function SchemaConfigEditor({ value, onChange }: SchemaConfigEditorProps) {
  const [fields, setFields] = useState<SchemaField[]>(value || []);

  const addField = () => {
    const newField: SchemaField = {
      key: `field_${Date.now()}`,
      label: "",
      type: "text",
      required: false,
    };
    const updated = [...fields, newField];
    setFields(updated);
    onChange(updated);
  };

  const updateField = (index: number, updates: Partial<SchemaField>) => {
    const updated = fields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    setFields(updated);
    onChange(updated);
  };

  const removeField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Fields Schema</CardTitle>
        <CardDescription>
          Define custom fields that will be available for leads in this campaign
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <p className="text-body text-muted-foreground text-center py-4">
            No custom fields defined. Click "Add Field" to create one.
          </p>
        ) : (
          fields.map((field, index) => (
            <div key={index} className="flex gap-2 items-start p-4 border rounded-lg">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Field Key</Label>
                    <Input
                      value={field.key}
                      onChange={(e) => updateField(index, { key: e.target.value })}
                      placeholder="turnover_2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Field Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="Turnover 2024"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) => {
                        const updates: Partial<SchemaField> = { type: value as SchemaField["type"] };
                        // Clear options if not dropdown
                        if (value !== "dropdown") {
                          updates.options = undefined;
                        } else if (!field.options) {
                          updates.options = [];
                        }
                        updateField(index, updates);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="dropdown">Dropdown</SelectItem>
                        <SelectItem value="tags">Tags</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Required</Label>
                    <Select
                      value={field.required ? "yes" : "no"}
                      onValueChange={(value) => updateField(index, { required: value === "yes" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Optional</SelectItem>
                        <SelectItem value="yes">Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {field.type === "dropdown" && (
                  <div className="space-y-3">
                    <Label>Dropdown Options</Label>
                    <div className="space-y-2">
                      {(() => {
                        // Normalize options to DropdownOption format
                        const normalizedOptions: DropdownOption[] = (field.options || []).map((opt) =>
                          typeof opt === "string" ? { value: opt } : opt
                        );
                        
                        return normalizedOptions.length === 0 ? (
                          <p className="text-sm text-text-body text-center py-2">
                            No options added. Click "Add Option" to create one.
                          </p>
                        ) : (
                          normalizedOptions.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2 p-3 border rounded-lg bg-white">
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={option.value}
                                  onChange={(e) => {
                                    const updated = [...normalizedOptions];
                                    updated[optIndex] = { ...option, value: e.target.value };
                                    updateField(index, { options: updated });
                                  }}
                                  placeholder="Option value"
                                />
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-text-body">Color:</Label>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={option.color || "none"}
                                      onValueChange={(color) => {
                                        const updated = [...normalizedOptions];
                                        if (color === "none") {
                                          updated[optIndex] = { ...option, color: undefined };
                                        } else {
                                          updated[optIndex] = { ...option, color };
                                        }
                                        updateField(index, { options: updated });
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-[140px]">
                                        <SelectValue placeholder="No color">
                                          {option.color ? (
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="w-4 h-4 rounded border border-border"
                                                style={{ backgroundColor: option.color }}
                                              />
                                              <span className="text-xs">
                                                {COLOR_PALETTE.find((c) => c.value === option.color)?.name || "Custom"}
                                              </span>
                                            </div>
                                          ) : (
                                            "No color"
                                          )}
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">No color</SelectItem>
                                        {COLOR_PALETTE.map((color) => (
                                          <SelectItem key={color.value} value={color.value}>
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="w-4 h-4 rounded border border-border"
                                                style={{ backgroundColor: color.value }}
                                              />
                                              <span>{color.name}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {!option.color && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => {
                                          const updated = [...normalizedOptions];
                                          updated[optIndex] = { ...option, color: "#3BBF7A" };
                                          updateField(index, { options: updated });
                                        }}
                                      >
                                        Custom
                                      </Button>
                                    )}
                                  </div>
                                  {option.color && (
                                    <Input
                                      type="color"
                                      value={option.color}
                                      onChange={(e) => {
                                        const updated = [...normalizedOptions];
                                        updated[optIndex] = { ...option, color: e.target.value };
                                        updateField(index, { options: updated });
                                      }}
                                      className="h-8 w-16"
                                    />
                                  )}
                                  {option.color && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        backgroundColor: `${option.color}20`,
                                        borderColor: option.color,
                                        color: option.color,
                                      }}
                                    >
                                      Preview
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updated = normalizedOptions.filter((_, i) => i !== optIndex);
                                  updateField(index, { options: updated });
                                }}
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        );
                      })()}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentOptions = (field.options || []).map((opt) =>
                          typeof opt === "string" ? { value: opt } : opt
                        );
                        const newOption: DropdownOption = { value: "" };
                        updateField(index, { options: [...currentOptions, newOption] });
                      }}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Option
                    </Button>
                    <p className="text-xs text-text-body">
                      Each option can have a custom color that will be displayed as a badge.
                    </p>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeField(index)}
                className="mt-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
        <Button type="button" variant="outline" onClick={addField} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </CardContent>
    </Card>
  );
}

