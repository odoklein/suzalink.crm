"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Plus, 
  X, 
  Save,
  RotateCcw,
  Download
} from "lucide-react";
import { SearchFilter, SearchQuery, SearchableField } from "@/lib/search";

interface AdvancedSearchProps {
  searchableFields: SearchableField[];
  onSearch: (query: SearchQuery) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const OPERATORS = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'between', label: 'Between' },
  ],
  date: [
    { value: 'equals', label: 'On date' },
    { value: 'greater_than', label: 'After' },
    { value: 'less_than', label: 'Before' },
    { value: 'between', label: 'Between' },
  ],
  select: [
    { value: 'equals', label: 'Equals' },
    { value: 'in', label: 'In' },
    { value: 'not_in', label: 'Not in' },
  ],
  multiselect: [
    { value: 'in', label: 'Contains any' },
    { value: 'not_in', label: 'Does not contain' },
  ],
  boolean: [
    { value: 'equals', label: 'Equals' },
  ],
};

export function AdvancedSearch({ 
  searchableFields, 
  onSearch, 
  isLoading = false,
  placeholder = "Search..." 
}: AdvancedSearchProps) {
  const [globalQuery, setGlobalQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const addFilter = () => {
    const filterableFields = searchableFields.filter(f => f.filterable);
    if (filterableFields.length === 0) return;

    const firstField = filterableFields[0];
    const availableOperators = OPERATORS[firstField.type] || OPERATORS.text;

    const newFilter: SearchFilter = {
      field: firstField.key,
      operator: availableOperators[0].value as any,
      value: '',
      type: firstField.type,
    };

    setFilters([...filters, newFilter]);
  };

  const updateFilter = (index: number, updates: Partial<SearchFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };

    // If field changed, reset operator and value
    if (updates.field) {
      const field = searchableFields.find(f => f.key === updates.field);
      if (field) {
        const availableOperators = OPERATORS[field.type] || OPERATORS.text;
        newFilters[index].operator = availableOperators[0].value as any;
        newFilters[index].type = field.type;
        newFilters[index].value = '';
      }
    }

    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleSearch = () => {
    const query: SearchQuery = {
      query: globalQuery.trim() || undefined,
      filters: filters.filter(f => f.value !== '' && f.value !== null && f.value !== undefined),
      sortBy: sortBy || undefined,
      sortOrder,
    };

    onSearch(query);
  };

  const clearAll = () => {
    setGlobalQuery("");
    setFilters([]);
    setSortBy("");
    setSortOrder('desc');
    
    // Trigger search with empty query
    onSearch({
      filters: [],
      sortOrder: 'desc',
    });
  };

  const renderFilterValue = (filter: SearchFilter, index: number) => {
    const field = searchableFields.find(f => f.key === filter.field);
    
    switch (filter.type) {
      case 'select':
        return (
          <Select
            value={filter.value || ''}
            onValueChange={(value) => updateFilter(index, { value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {field?.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        // For simplicity, treating as single select for now
        // In a real implementation, you'd use a multi-select component
        return (
          <Select
            value={filter.value || ''}
            onValueChange={(value) => updateFilter(index, { value: [value] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select values" />
            </SelectTrigger>
            <SelectContent>
              {field?.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        if (filter.operator === 'between') {
          return (
            <div className="flex gap-2">
              <Input
                type="date"
                value={filter.value?.[0] || ''}
                onChange={(e) => updateFilter(index, { 
                  value: [e.target.value, filter.value?.[1] || ''] 
                })}
                className="w-32"
              />
              <Input
                type="date"
                value={filter.value?.[1] || ''}
                onChange={(e) => updateFilter(index, { 
                  value: [filter.value?.[0] || '', e.target.value] 
                })}
                className="w-32"
              />
            </div>
          );
        }
        return (
          <Input
            type="date"
            value={filter.value || ''}
            onChange={(e) => updateFilter(index, { value: e.target.value })}
            className="w-40"
          />
        );

      case 'number':
        if (filter.operator === 'between') {
          return (
            <div className="flex gap-2">
              <Input
                type="number"
                value={filter.value?.[0] || ''}
                onChange={(e) => updateFilter(index, { 
                  value: [parseFloat(e.target.value) || 0, filter.value?.[1] || 0] 
                })}
                className="w-20"
                placeholder="Min"
              />
              <Input
                type="number"
                value={filter.value?.[1] || ''}
                onChange={(e) => updateFilter(index, { 
                  value: [filter.value?.[0] || 0, parseFloat(e.target.value) || 0] 
                })}
                className="w-20"
                placeholder="Max"
              />
            </div>
          );
        }
        return (
          <Input
            type="number"
            value={filter.value || ''}
            onChange={(e) => updateFilter(index, { value: parseFloat(e.target.value) || 0 })}
            className="w-32"
            placeholder="Enter number"
          />
        );

      case 'boolean':
        return (
          <Select
            value={filter.value?.toString() || ''}
            onValueChange={(value) => updateFilter(index, { value: value === 'true' })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            value={filter.value || ''}
            onChange={(e) => updateFilter(index, { value: e.target.value })}
            className="w-40"
            placeholder="Enter value"
          />
        );
    }
  };

  const activeFiltersCount = filters.filter(f => f.value !== '' && f.value !== null).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Global Search */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" onClick={clearAll}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Sort by:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {searchableFields.filter(f => f.sortable).map(field => (
                  <SelectItem key={field.key} value={field.key}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest first</SelectItem>
              <SelectItem value="asc">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Filters</h4>
              <Button variant="outline" size="sm" onClick={addFilter}>
                <Plus className="h-4 w-4 mr-2" />
                Add Filter
              </Button>
            </div>

            {filters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No filters applied. Click "Add Filter" to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {filters.map((filter, index) => {
                  const field = searchableFields.find(f => f.key === filter.field);
                  const availableOperators = OPERATORS[filter.type] || OPERATORS.text;

                  return (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Select
                        value={filter.field}
                        onValueChange={(value) => updateFilter(index, { field: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {searchableFields.filter(f => f.filterable).map(field => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filter.operator}
                        onValueChange={(value) => updateFilter(index, { operator: value as any })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOperators.map(op => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {renderFilterValue(filter, index)}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFilter(index)}
                        className="text-danger-500 hover:text-danger-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}





