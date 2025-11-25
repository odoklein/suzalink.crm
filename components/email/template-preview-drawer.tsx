"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit, Copy, Trash2 } from "lucide-react";
import type { EmailTemplate } from "@/lib/email-templates";

type TemplatePreviewDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
  onEdit?: (template: EmailTemplate) => void;
  onDelete?: (templateId: string) => void;
};

export function TemplatePreviewDrawer({
  open,
  onOpenChange,
  template,
  onEdit,
  onDelete,
}: TemplatePreviewDrawerProps) {
  if (!template) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cold_outreach': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-green-100 text-green-800';
      case 'nurture': return 'bg-yellow-100 text-yellow-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'closing': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-[24px] font-semibold text-text-main tracking-[-0.5px]">
                {template.name}
              </SheetTitle>
              <SheetDescription className="text-body text-text-body mt-2">
                Email template preview and details
              </SheetDescription>
            </div>
            <Badge 
              variant="secondary" 
              className={`${getCategoryColor(template.category)}`}
            >
              {template.category.replace('_', ' ')}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Template Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-sm font-medium text-text-body mb-1 block">
                  Subject
                </Label>
                <p className="text-body text-text-main">
                  {template.subject}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-text-body mb-1 block">
                  Status
                </Label>
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {template.variables && template.variables.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-text-body mb-2 block">
                    Variables ({template.variables.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((variable, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Preview */}
          <Card>
            <CardContent className="pt-6">
              <Label className="text-sm font-medium text-text-body mb-3 block">
                Preview
              </Label>
              <div className="border rounded-lg p-4 bg-background">
                <div className="prose prose-sm max-w-none">
                  <div
                    className="whitespace-pre-wrap text-text-main"
                    dangerouslySetInnerHTML={{
                      __html: template.body.replace(/\n/g, "<br />"),
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            {onEdit && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onEdit(template);
                  onOpenChange(false);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Template
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                navigator.clipboard.writeText(template.body);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Body
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this template?")) {
                    onDelete(template.id);
                    onOpenChange(false);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Template
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

