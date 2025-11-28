"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Link as LinkIcon,
  CheckSquare,
  ChevronDown,
  Tags,
  Sparkles,
  Check,
  X,
  GripVertical,
  Plus,
  ArrowRight,
  Zap,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SchemaField, DropdownOption } from "@/components/campaigns/schema-config-editor";
import { 
  MappingSuggestion, 
  generateMappingSuggestions,
  getConfidenceLabel,
  detectDropdownOptions,
} from "./smart-mapper";

// Field type configuration
const FIELD_TYPES: { value: SchemaField["type"]; label: string; icon: typeof Type }[] = [
  { value: "text", label: "Text", icon: Type },
  { value: "textarea", label: "Textarea", icon: AlignLeft },
  { value: "number", label: "Number", icon: Hash },
  { value: "currency", label: "Currency", icon: DollarSign },
  { value: "date", label: "Date", icon: Calendar },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "url", label: "URL", icon: LinkIcon },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "dropdown", label: "Dropdown", icon: ChevronDown },
  { value: "tags", label: "Tags", icon: Tags },
];

// Standard system fields
const STANDARD_FIELDS = [
  { key: "firstName", label: "First Name", icon: Type },
  { key: "lastName", label: "Last Name", icon: Type },
  { key: "email", label: "Email", icon: Mail },
  { key: "phone", label: "Phone", icon: Phone },
  { key: "jobTitle", label: "Job Title", icon: Type },
];

export interface FieldMapping {
  csvColumn: string;
  systemField: string;
  customFieldKey?: string;
  fieldType?: SchemaField["type"];
  fieldLabel?: string;
  dropdownOptions?: DropdownOption[];
  required?: boolean;
  suggestion?: MappingSuggestion;
}

interface MappingCanvasProps {
  csvHeaders: string[];
  sampleData: Record<string, string>[];
  existingSchemaFields?: SchemaField[];
  mappings: FieldMapping[];
  onMappingsChange: (mappings: FieldMapping[]) => void;
}

// Draggable CSV Column Card
function DraggableCSVColumn({
  column,
  mapping,
  sampleValues,
  onAcceptSuggestion,
  onClearMapping,
  isConnected,
}: {
  column: string;
  mapping: FieldMapping;
  sampleValues: string[];
  onAcceptSuggestion: () => void;
  onClearMapping: () => void;
  isConnected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `csv-${column}`,
    data: { type: "csv", column },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const suggestion = mapping.suggestion;
  const hasHighConfidenceSuggestion = suggestion && suggestion.confidence >= 0.7 && !isConnected;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative p-3 rounded-lg border-2 transition-all duration-200",
        isDragging && "opacity-50 scale-105 shadow-lg z-50",
        isConnected 
          ? "border-success-300 bg-success-50/50" 
          : hasHighConfidenceSuggestion
            ? "border-primary-200 bg-primary-50/30 hover:border-primary-400"
            : "border-gray-200 bg-white hover:border-gray-300",
        "animate-in fade-in slide-in-from-left-4 duration-300"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="pl-5">
        {/* Column name */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm text-text-main truncate max-w-[140px]">
            {column}
          </h4>
          {isConnected && (
            <button
              onClick={onClearMapping}
              className="p-0.5 rounded text-gray-400 hover:text-destructive-500 hover:bg-destructive-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sample values */}
        <div className="space-y-1 mb-2">
          {sampleValues.slice(0, 2).map((val, i) => (
            <p 
              key={i} 
              className="text-xs text-text-body truncate max-w-[180px]"
              title={val}
            >
              {val || <span className="italic text-gray-300">empty</span>}
            </p>
          ))}
        </div>

        {/* Suggestion chip */}
        {hasHighConfidenceSuggestion && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={onAcceptSuggestion}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
                "bg-primary-100 text-primary-700 hover:bg-primary-200",
                "border border-primary-200"
              )}
            >
              <Sparkles className="h-3 w-3" />
              <span>{suggestion.fieldLabel}</span>
              <span className="text-primary-500">
                {Math.round(suggestion.confidence * 100)}%
              </span>
            </button>
          </div>
        )}

        {/* Connected indicator */}
        {isConnected && mapping.systemField && (
          <div className="flex items-center gap-1.5 text-xs text-success-600">
            <Check className="h-3 w-3" />
            <span>
              {mapping.systemField === "custom" 
                ? mapping.fieldLabel 
                : STANDARD_FIELDS.find(f => f.key === mapping.systemField)?.label || mapping.systemField}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Droppable System Field Card
function DroppableSystemField({
  field,
  connectedColumn,
  isOver,
  onDisconnect,
}: {
  field: { key: string; label: string; icon: typeof Type };
  connectedColumn?: string;
  isOver: boolean;
  onDisconnect: () => void;
}) {
  const { setNodeRef, isOver: dropping } = useDroppable({
    id: `system-${field.key}`,
    data: { type: "system", fieldKey: field.key },
  });

  const Icon = field.icon;
  const isConnected = !!connectedColumn;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative p-3 rounded-lg border-2 transition-all duration-200",
        dropping && "border-primary-400 bg-primary-50 scale-[1.02]",
        isConnected
          ? "border-success-300 bg-success-50/50"
          : "border-gray-200 bg-white hover:border-gray-300",
        "animate-in fade-in slide-in-from-right-4 duration-300"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center",
          isConnected ? "bg-success-100" : "bg-gray-100"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            isConnected ? "text-success-600" : "text-gray-500"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-text-main">{field.label}</h4>
          {isConnected ? (
            <div className="flex items-center gap-1">
              <p className="text-xs text-success-600 truncate">{connectedColumn}</p>
              <button
                onClick={onDisconnect}
                className="p-0.5 rounded text-gray-400 hover:text-destructive-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-text-body">Drop column here</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Custom Field Creator
function CustomFieldCreator({
  mapping,
  sampleValues,
  onUpdate,
  onRemove,
}: {
  mapping: FieldMapping;
  sampleValues: string[];
  onUpdate: (updates: Partial<FieldMapping>) => void;
  onRemove: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const detectedOptions = useMemo(() => detectDropdownOptions(sampleValues), [sampleValues]);

  const selectedType = FIELD_TYPES.find(t => t.value === mapping.fieldType) || FIELD_TYPES[0];
  const TypeIcon = selectedType.icon;

  return (
    <div className="p-4 rounded-lg border-2 border-primary-200 bg-primary-50/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-100 flex items-center justify-center">
              <Plus className="h-4 w-4 text-primary-600" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-sm text-text-main">
                {mapping.fieldLabel || mapping.csvColumn}
              </h4>
              <p className="text-xs text-text-body">Custom field from "{mapping.csvColumn}"</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <TypeIcon className="h-3 w-3 mr-1" />
              {selectedType.label}
            </Badge>
            <Settings2 className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              isExpanded && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-text-body">Field Label</Label>
              <Input
                value={mapping.fieldLabel || ""}
                onChange={(e) => onUpdate({ fieldLabel: e.target.value })}
                placeholder="Enter label"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-text-body">Field Type</Label>
              <Select
                value={mapping.fieldType || "text"}
                onValueChange={(value) => {
                  const updates: Partial<FieldMapping> = { 
                    fieldType: value as SchemaField["type"] 
                  };
                  if (value === "dropdown" && detectedOptions) {
                    updates.dropdownOptions = detectedOptions.map(v => ({ value: v }));
                  } else if (value !== "dropdown") {
                    updates.dropdownOptions = undefined;
                  }
                  onUpdate(updates);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-3.5 w-3.5" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dropdown options */}
          {mapping.fieldType === "dropdown" && (
            <div className="space-y-2">
              <Label className="text-xs text-text-body">Dropdown Options</Label>
              {detectedOptions && mapping.dropdownOptions?.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdate({ 
                    dropdownOptions: detectedOptions.map(v => ({ value: v })) 
                  })}
                  className="mb-2"
                >
                  <Zap className="h-3 w-3 mr-1.5" />
                  Auto-detect from data ({detectedOptions.length} values)
                </Button>
              )}
              <div className="flex flex-wrap gap-2">
                {mapping.dropdownOptions?.map((opt, idx) => (
                  <Badge key={idx} variant="secondary" className="pl-2">
                    {opt.value}
                    <button
                      onClick={() => {
                        const newOpts = mapping.dropdownOptions?.filter((_, i) => i !== idx);
                        onUpdate({ dropdownOptions: newOpts });
                      }}
                      className="ml-1 hover:text-destructive-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sample values preview */}
          <div className="pt-2 border-t">
            <p className="text-xs text-text-body mb-2">Sample values:</p>
            <div className="flex flex-wrap gap-1.5">
              {sampleValues.slice(0, 5).map((val, i) => (
                <span 
                  key={i}
                  className="px-2 py-0.5 text-xs bg-gray-100 rounded text-text-body"
                >
                  {val || <span className="italic">empty</span>}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              Remove mapping
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function MappingCanvas({
  csvHeaders,
  sampleData,
  existingSchemaFields = [],
  mappings,
  onMappingsChange,
}: MappingCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  // Generate suggestions on mount
  const suggestions = useMemo(() => {
    return generateMappingSuggestions(csvHeaders, sampleData, existingSchemaFields);
  }, [csvHeaders, sampleData, existingSchemaFields]);

  // Initialize mappings with suggestions if empty
  useEffect(() => {
    if (mappings.length === 0 && csvHeaders.length > 0) {
      const initialMappings: FieldMapping[] = csvHeaders.map(column => {
        const suggestion = suggestions.find(s => s.csvColumn === column);
        return {
          csvColumn: column,
          systemField: "",
          suggestion,
          fieldType: suggestion?.detectedType,
        };
      });
      onMappingsChange(initialMappings);
    }
  }, [csvHeaders, suggestions, mappings.length, onMappingsChange]);

  // Get connected columns for system fields
  const systemFieldConnections = useMemo(() => {
    const connections: Record<string, string> = {};
    mappings.forEach(m => {
      if (m.systemField && m.systemField !== "skip" && m.systemField !== "custom") {
        connections[m.systemField] = m.csvColumn;
      }
    });
    return connections;
  }, [mappings]);

  // Get sample values for a column
  const getSampleValues = useCallback((column: string) => {
    return sampleData.map(row => row[column] || "").filter(Boolean).slice(0, 5);
  }, [sampleData]);

  // Handle drag events
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeData = active.data.current as { type: string; column: string };
    const overData = over.data.current as { type: string; fieldKey: string };

    if (activeData?.type === "csv" && overData?.type === "system") {
      const csvColumn = activeData.column;
      const systemFieldKey = overData.fieldKey;

      // Update mappings
      const newMappings = mappings.map(m => {
        // Clear any existing connection to this system field
        if (m.systemField === systemFieldKey) {
          return { ...m, systemField: "", customFieldKey: undefined };
        }
        // Connect the dragged column
        if (m.csvColumn === csvColumn) {
          return { ...m, systemField: systemFieldKey, customFieldKey: undefined };
        }
        return m;
      });

      onMappingsChange(newMappings);
    }
  }, [mappings, onMappingsChange]);

  // Accept suggestion
  const handleAcceptSuggestion = useCallback((column: string) => {
    const suggestion = suggestions.find(s => s.csvColumn === column);
    if (!suggestion) return;

    const newMappings = mappings.map(m => {
      if (m.csvColumn === column) {
        if (suggestion.isStandardField) {
          return { ...m, systemField: suggestion.suggestedField };
        } else {
          // Create custom field
          return {
            ...m,
            systemField: "custom",
            customFieldKey: column.toLowerCase().replace(/\s+/g, "_"),
            fieldLabel: column,
            fieldType: suggestion.detectedType || "text",
          };
        }
      }
      // Clear if another column was connected to this field
      if (suggestion.isStandardField && m.systemField === suggestion.suggestedField) {
        return { ...m, systemField: "" };
      }
      return m;
    });

    onMappingsChange(newMappings);
  }, [mappings, suggestions, onMappingsChange]);

  // Accept all high-confidence suggestions
  const handleAcceptAllSuggestions = useCallback(() => {
    const highConfidenceSuggestions = suggestions.filter(s => s.confidence >= 0.7);
    const usedFields = new Set<string>();
    
    const newMappings = mappings.map(m => {
      const suggestion = highConfidenceSuggestions.find(
        s => s.csvColumn === m.csvColumn && !usedFields.has(s.suggestedField)
      );
      
      if (suggestion) {
        usedFields.add(suggestion.suggestedField);
        if (suggestion.isStandardField) {
          return { ...m, systemField: suggestion.suggestedField };
        } else {
          return {
            ...m,
            systemField: "custom",
            customFieldKey: m.csvColumn.toLowerCase().replace(/\s+/g, "_"),
            fieldLabel: m.csvColumn,
            fieldType: suggestion.detectedType || "text",
          };
        }
      }
      return m;
    });

    onMappingsChange(newMappings);
  }, [mappings, suggestions, onMappingsChange]);

  // Clear mapping
  const handleClearMapping = useCallback((column: string) => {
    const newMappings = mappings.map(m => {
      if (m.csvColumn === column) {
        return { 
          ...m, 
          systemField: "", 
          customFieldKey: undefined,
          fieldLabel: undefined,
          fieldType: undefined,
          dropdownOptions: undefined,
        };
      }
      return m;
    });
    onMappingsChange(newMappings);
  }, [mappings, onMappingsChange]);

  // Create custom field
  const handleCreateCustomField = useCallback((column: string) => {
    const newMappings = mappings.map(m => {
      if (m.csvColumn === column) {
        return {
          ...m,
          systemField: "custom",
          customFieldKey: column.toLowerCase().replace(/\s+/g, "_"),
          fieldLabel: column,
          fieldType: m.suggestion?.detectedType || "text",
        };
      }
      return m;
    });
    onMappingsChange(newMappings);
  }, [mappings, onMappingsChange]);

  // Update custom field
  const handleUpdateCustomField = useCallback((column: string, updates: Partial<FieldMapping>) => {
    const newMappings = mappings.map(m => {
      if (m.csvColumn === column) {
        return { ...m, ...updates };
      }
      return m;
    });
    onMappingsChange(newMappings);
  }, [mappings, onMappingsChange]);

  // Count suggestions
  const highConfidenceCount = suggestions.filter(s => s.confidence >= 0.7).length;
  const connectedCount = mappings.filter(m => m.systemField && m.systemField !== "skip").length;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-text-main">Map Your Columns</h3>
            <p className="text-sm text-text-body mt-0.5">
              Drag CSV columns to system fields, or click suggestions to accept
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              {connectedCount} / {csvHeaders.length} mapped
            </Badge>
            {highConfidenceCount > 0 && connectedCount < highConfidenceCount && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAcceptAllSuggestions}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary-500" />
                Accept All Suggestions ({highConfidenceCount})
              </Button>
            )}
          </div>
        </div>

        {/* Mapping Interface */}
        <div className="grid grid-cols-2 gap-8">
          {/* CSV Columns (Left) */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text-body flex items-center gap-2 pb-2 border-b">
              <span className="h-5 w-5 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                1
              </span>
              CSV Columns
            </h4>
            <div className="space-y-2">
              {mappings.map((mapping, index) => {
                const isConnected = mapping.systemField && mapping.systemField !== "skip";
                const isCustom = mapping.systemField === "custom";

                if (isCustom) {
                  return (
                    <CustomFieldCreator
                      key={mapping.csvColumn}
                      mapping={mapping}
                      sampleValues={getSampleValues(mapping.csvColumn)}
                      onUpdate={(updates) => handleUpdateCustomField(mapping.csvColumn, updates)}
                      onRemove={() => handleClearMapping(mapping.csvColumn)}
                    />
                  );
                }

                return (
                  <div
                    key={mapping.csvColumn}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <DraggableCSVColumn
                      column={mapping.csvColumn}
                      mapping={mapping}
                      sampleValues={getSampleValues(mapping.csvColumn)}
                      onAcceptSuggestion={() => handleAcceptSuggestion(mapping.csvColumn)}
                      onClearMapping={() => handleClearMapping(mapping.csvColumn)}
                      isConnected={!!isConnected}
                    />
                    {/* Create custom field button for unmapped columns */}
                    {!isConnected && (
                      <button
                        onClick={() => handleCreateCustomField(mapping.csvColumn)}
                        className="mt-1 w-full py-1.5 text-xs text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Create as custom field
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Fields (Right) */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text-body flex items-center gap-2 pb-2 border-b">
              <span className="h-5 w-5 rounded bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600">
                2
              </span>
              System Fields
            </h4>
            <div className="space-y-2">
              {STANDARD_FIELDS.map((field, index) => (
                <div
                  key={field.key}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <DroppableSystemField
                    field={field}
                    connectedColumn={systemFieldConnections[field.key]}
                    isOver={overId === `system-${field.key}`}
                    onDisconnect={() => {
                      const column = systemFieldConnections[field.key];
                      if (column) handleClearMapping(column);
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Skip field option info */}
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-text-body">
                <strong>Tip:</strong> Columns that aren't mapped will be skipped during import. 
                You can also create custom fields for data that doesn't fit standard fields.
              </p>
            </div>
          </div>
        </div>

        {/* Connection visualization hint */}
        <div className="flex items-center justify-center gap-2 text-xs text-text-body py-4">
          <div className="h-2 w-2 rounded-full bg-gray-300" />
          <ArrowRight className="h-3 w-3 text-gray-400" />
          <div className="h-2 w-2 rounded-full bg-success-400" />
          <span className="ml-2">Drag columns from left to connect with system fields on the right</span>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && activeId.startsWith("csv-") && (
          <div className="p-3 rounded-lg border-2 border-primary-400 bg-white shadow-xl opacity-90">
            <p className="font-medium text-sm">
              {activeId.replace("csv-", "")}
            </p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

