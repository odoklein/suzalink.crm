"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Eye, 
  Save, 
  X, 
  Plus,
  Code,
  Mail,
  Sparkles
} from "lucide-react";
import { EmailTemplate, extractVariablesFromTemplate, parseEmailTemplate } from "@/lib/email-templates";

interface TemplateEditorProps {
  template?: EmailTemplate;
  onSave: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
  onCancel: () => void;
}

const TEMPLATE_CATEGORIES = [
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'nurture', label: 'Nurture' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'closing', label: 'Closing' },
];

const COMMON_VARIABLES = [
  'firstName', 'lastName', 'email', 'company', 'jobTitle',
  'senderName', 'senderTitle', 'senderCompany',
  'companyDescription', 'valueProposition', 'specificBenefit'
];

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
    category: template?.category || 'cold_outreach' as const,
    isActive: template?.isActive ?? true,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    company: 'Acme Corp',
    jobTitle: 'Sales Manager',
    senderName: 'Jane Smith',
    senderTitle: 'Business Development',
    senderCompany: 'Facturix CRM',
    companyDescription: 'innovative software solutions',
    valueProposition: 'streamline your sales process',
    specificBenefit: 'increase conversion rates by 30%',
  });

  // Extract variables from current template
  const detectedVariables = [
    ...extractVariablesFromTemplate(formData.subject),
    ...extractVariablesFromTemplate(formData.content),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const handleSave = () => {
    const templateData = {
      ...formData,
      variables: detectedVariables,
    };
    onSave(templateData);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + `{{${variable}}}` + after;
      
      setFormData(prev => ({ ...prev, content: newText }));
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  const previewSubject = parseEmailTemplate(formData.subject, previewVariables);
  const previewContent = parseEmailTemplate(formData.content, previewVariables);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h1">
          {template ? 'Edit Template' : 'Create Email Template'}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Template Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Cold Outreach - Introduction"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-subject">Email Subject</Label>
                <Input
                  id="template-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Quick question about {{company}}"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-content">Email Content</Label>
                <Textarea
                  id="template-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your email template here. Use {{variableName}} for dynamic content."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              {/* Variables */}
              <div className="space-y-2">
                <Label>Detected Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {detectedVariables.map(variable => (
                    <Badge key={variable} variant="outline">
                      {variable}
                    </Badge>
                  ))}
                  {detectedVariables.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No variables detected. Use {{variableName}} syntax.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variable Inserter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Quick Insert Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                {COMMON_VARIABLES.map(variable => (
                  <Button
                    key={variable}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable)}
                    className="justify-start text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {variable}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{previewSubject || 'No subject'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email Content</Label>
                  <div className="p-4 bg-white border rounded-lg min-h-[300px]">
                    <div className="whitespace-pre-wrap text-sm">
                      {previewContent || 'No content'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Variables */}
            <Card>
              <CardHeader>
                <CardTitle>Preview Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detectedVariables.map(variable => (
                  <div key={variable} className="flex items-center gap-2">
                    <Label className="w-24 text-xs">{variable}:</Label>
                    <Input
                      size="sm"
                      value={previewVariables[variable] || ''}
                      onChange={(e) => setPreviewVariables(prev => ({
                        ...prev,
                        [variable]: e.target.value
                      }))}
                      className="text-xs"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}





