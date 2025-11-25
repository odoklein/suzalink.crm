export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value: any;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
}

export interface SearchQuery {
  query?: string; // Global search query
  filters: SearchFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SearchableField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  searchable: boolean;
  filterable: boolean;
  sortable: boolean;
  options?: { value: string; label: string }[]; // For select/multiselect fields
}

// Define searchable fields for different entities
export const LEAD_SEARCH_FIELDS: SearchableField[] = [
  {
    key: 'firstName',
    label: 'First Name',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: true,
  },
  {
    key: 'lastName',
    label: 'Last Name',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: true,
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: true,
  },
  {
    key: 'phone',
    label: 'Phone',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: false,
  },
  {
    key: 'company',
    label: 'Company',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: true,
  },
  {
    key: 'jobTitle',
    label: 'Job Title',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    searchable: false,
    filterable: true,
    sortable: true,
    options: [
      { value: 'New', label: 'New' },
      { value: 'Contacted', label: 'Contacted' },
      { value: 'Qualified', label: 'Qualified' },
      { value: 'Nurture', label: 'Nurture' },
      { value: 'Lost', label: 'Lost' },
    ],
  },
  {
    key: 'leadScore',
    label: 'Lead Score',
    type: 'number',
    searchable: false,
    filterable: true,
    sortable: true,
  },
  {
    key: 'leadGrade',
    label: 'Lead Grade',
    type: 'select',
    searchable: false,
    filterable: true,
    sortable: true,
    options: [
      { value: 'A', label: 'A' },
      { value: 'B', label: 'B' },
      { value: 'C', label: 'C' },
      { value: 'D', label: 'D' },
      { value: 'F', label: 'F' },
    ],
  },
  {
    key: 'leadPriority',
    label: 'Priority',
    type: 'select',
    searchable: false,
    filterable: true,
    sortable: true,
    options: [
      { value: 'Hot', label: 'Hot' },
      { value: 'Warm', label: 'Warm' },
      { value: 'Cold', label: 'Cold' },
    ],
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    type: 'date',
    searchable: false,
    filterable: true,
    sortable: true,
  },
  {
    key: 'updatedAt',
    label: 'Last Updated',
    type: 'date',
    searchable: false,
    filterable: true,
    sortable: true,
  },
];

export const CAMPAIGN_SEARCH_FIELDS: SearchableField[] = [
  {
    key: 'name',
    label: 'Campaign Name',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    searchable: false,
    filterable: true,
    sortable: true,
    options: [
      { value: 'Draft', label: 'Draft' },
      { value: 'Active', label: 'Active' },
      { value: 'Paused', label: 'Paused' },
      { value: 'Completed', label: 'Completed' },
    ],
  },
  {
    key: 'account.companyName',
    label: 'Account',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: true,
  },
  {
    key: 'startDate',
    label: 'Start Date',
    type: 'date',
    searchable: false,
    filterable: true,
    sortable: true,
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    type: 'date',
    searchable: false,
    filterable: true,
    sortable: true,
  },
];

export const ACCOUNT_SEARCH_FIELDS: SearchableField[] = [
  {
    key: 'companyName',
    label: 'Company Name',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: true,
  },
  {
    key: 'industry',
    label: 'Industry',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: true,
  },
  {
    key: 'website',
    label: 'Website',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: false,
  },
  {
    key: 'contactEmail',
    label: 'Contact Email',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: true,
  },
  {
    key: 'contactPhone',
    label: 'Contact Phone',
    type: 'text',
    searchable: true,
    filterable: true,
    sortable: false,
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    type: 'date',
    searchable: false,
    filterable: true,
    sortable: true,
  },
];

export function buildPrismaWhere(filters: SearchFilter[], globalQuery?: string, searchableFields?: SearchableField[]) {
  const where: any = {};
  const orConditions: any[] = [];

  // Handle global search
  if (globalQuery && searchableFields) {
    const searchableFieldKeys = searchableFields
      .filter(field => field.searchable)
      .map(field => field.key);

    searchableFieldKeys.forEach(fieldKey => {
      if (fieldKey.includes('.')) {
        // Handle nested fields like 'account.companyName'
        const [relation, field] = fieldKey.split('.');
        orConditions.push({
          [relation]: {
            [field]: {
              contains: globalQuery,
              mode: 'insensitive',
            },
          },
        });
      } else if (fieldKey.startsWith('standardData.') || fieldKey.startsWith('customData.')) {
        // Handle JSON fields
        const [jsonField, field] = fieldKey.split('.');
        orConditions.push({
          [jsonField]: {
            path: [field],
            string_contains: globalQuery,
          },
        });
      } else {
        orConditions.push({
          [fieldKey]: {
            contains: globalQuery,
            mode: 'insensitive',
          },
        });
      }
    });
  }

  // Handle specific filters
  filters.forEach(filter => {
    const { field, operator, value, type } = filter;

    if (value === null || value === undefined || value === '') {
      return; // Skip empty filters
    }

    let condition: any;

    switch (operator) {
      case 'equals':
        condition = { equals: value };
        break;
      case 'contains':
        condition = { contains: value, mode: 'insensitive' };
        break;
      case 'starts_with':
        condition = { startsWith: value, mode: 'insensitive' };
        break;
      case 'ends_with':
        condition = { endsWith: value, mode: 'insensitive' };
        break;
      case 'greater_than':
        condition = { gt: type === 'date' ? new Date(value) : value };
        break;
      case 'less_than':
        condition = { lt: type === 'date' ? new Date(value) : value };
        break;
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          condition = {
            gte: type === 'date' ? new Date(value[0]) : value[0],
            lte: type === 'date' ? new Date(value[1]) : value[1],
          };
        }
        break;
      case 'in':
        condition = { in: Array.isArray(value) ? value : [value] };
        break;
      case 'not_in':
        condition = { notIn: Array.isArray(value) ? value : [value] };
        break;
      case 'is_null':
        condition = { equals: null };
        break;
      case 'is_not_null':
        condition = { not: null };
        break;
      default:
        condition = { equals: value };
    }

    if (field.includes('.')) {
      // Handle nested fields
      const [relation, nestedField] = field.split('.');
      if (!where[relation]) {
        where[relation] = {};
      }
      where[relation][nestedField] = condition;
    } else if (field.startsWith('standardData.') || field.startsWith('customData.')) {
      // Handle JSON fields
      const [jsonField, jsonKey] = field.split('.');
      where[jsonField] = {
        path: [jsonKey],
        ...condition,
      };
    } else {
      where[field] = condition;
    }
  });

  // Combine OR conditions for global search
  if (orConditions.length > 0) {
    if (Object.keys(where).length > 0) {
      return {
        AND: [
          { OR: orConditions },
          where,
        ],
      };
    } else {
      return { OR: orConditions };
    }
  }

  return where;
}

export function buildPrismaOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
  if (!sortBy) {
    return { createdAt: 'desc' };
  }

  if (sortBy.includes('.')) {
    // Handle nested fields
    const [relation, field] = sortBy.split('.');
    return {
      [relation]: {
        [field]: sortOrder,
      },
    };
  }

  return { [sortBy]: sortOrder };
}

export function validateSearchQuery(query: SearchQuery, searchableFields: SearchableField[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate filters
  query.filters.forEach((filter, index) => {
    const field = searchableFields.find(f => f.key === filter.field);
    
    if (!field) {
      errors.push(`Filter ${index + 1}: Unknown field '${filter.field}'`);
      return;
    }

    if (!field.filterable) {
      errors.push(`Filter ${index + 1}: Field '${filter.field}' is not filterable`);
      return;
    }

    // Validate operator for field type
    const validOperators = getValidOperators(field.type);
    if (!validOperators.includes(filter.operator)) {
      errors.push(`Filter ${index + 1}: Invalid operator '${filter.operator}' for field type '${field.type}'`);
    }

    // Validate value type
    if (filter.value !== null && filter.value !== undefined) {
      const isValidValue = validateFilterValue(filter.value, field.type, filter.operator);
      if (!isValidValue) {
        errors.push(`Filter ${index + 1}: Invalid value for field type '${field.type}'`);
      }
    }
  });

  // Validate sort field
  if (query.sortBy) {
    const sortField = searchableFields.find(f => f.key === query.sortBy);
    if (!sortField) {
      errors.push(`Unknown sort field '${query.sortBy}'`);
    } else if (!sortField.sortable) {
      errors.push(`Field '${query.sortBy}' is not sortable`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function getValidOperators(fieldType: string): string[] {
  switch (fieldType) {
    case 'text':
      return ['equals', 'contains', 'starts_with', 'ends_with', 'in', 'not_in', 'is_null', 'is_not_null'];
    case 'number':
      return ['equals', 'greater_than', 'less_than', 'between', 'in', 'not_in', 'is_null', 'is_not_null'];
    case 'date':
      return ['equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'];
    case 'boolean':
      return ['equals', 'is_null', 'is_not_null'];
    case 'select':
    case 'multiselect':
      return ['equals', 'in', 'not_in', 'is_null', 'is_not_null'];
    default:
      return ['equals'];
  }
}

function validateFilterValue(value: any, fieldType: string, operator: string): boolean {
  if (operator === 'is_null' || operator === 'is_not_null') {
    return true; // These operators don't need a value
  }

  switch (fieldType) {
    case 'text':
      return typeof value === 'string';
    case 'number':
      if (operator === 'between') {
        return Array.isArray(value) && value.length === 2 && value.every(v => typeof v === 'number');
      }
      if (operator === 'in' || operator === 'not_in') {
        return Array.isArray(value) && value.every(v => typeof v === 'number');
      }
      return typeof value === 'number';
    case 'date':
      if (operator === 'between') {
        return Array.isArray(value) && value.length === 2 && value.every(v => !isNaN(Date.parse(v)));
      }
      return !isNaN(Date.parse(value));
    case 'boolean':
      return typeof value === 'boolean';
    case 'select':
      return typeof value === 'string';
    case 'multiselect':
      return Array.isArray(value) && value.every(v => typeof v === 'string');
    default:
      return true;
  }
}





