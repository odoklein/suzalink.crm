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
  Plus, 
  Trash2, 
  ArrowDown,
  Clock,
  Mail,
  Settings,
  Play,
  Save,
  X
} from "lucide-react";
import { EmailSequence, EmailSequenceStep, EmailTemplate } from "@/lib/email-templates";

interface SequenceBuilderProps {
  sequence?: EmailSequence;
  templates: EmailTemplate[];
  onSave: (sequence: Omit<EmailSequence, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
  onCancel: () => void;
}

const TRIGGER_TYPES = [
  { value: 'lead_status', label: 'Lead Status Change' },
  { value: 'time_delay', label: 'Time Delay' },
  { value: 'manual', label: 'Manual Trigger' },
  { value: 'lead_score', label: 'Lead Score Threshold' },
];

const DELAY_UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
];

export function SequenceBuilder({ sequence, templates, onSave, onCancel }: SequenceBuilderProps) {
  const [formData, setFormData] = useState({
    name: sequence?.name || '',
    description: sequence?.description || '',
    isActive: sequence?.isActive ?? true,
    trigger: sequence?.trigger || {
      type: 'lead_status' as const,
      conditions: { status: 'New' },
    },
    steps: sequence?.steps || [],
  });

  const addStep = () => {
    const newStep: EmailSequenceStep = {
      id: `step-${Date.now()}`,
      order: formData.steps.length + 1,
      templateId: templates[0]?.id || '',
      delay: { value: 1, unit: 'days' },
    };

    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  };

  const updateStep = (stepId: string, updates: Partial<EmailSequenceStep>) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    }));
  };

  const removeStep = (stepId: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
        .map((step, index) => ({ ...step, order: index + 1 })),
    }));
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const stepIndex = formData.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (newIndex < 0 || newIndex >= formData.steps.length) return;

    const newSteps = [...formData.steps];
    [newSteps[stepIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[stepIndex]];
    
    // Update order numbers
    newSteps.forEach((step, index) => {
      step.order = index + 1;
    });

    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.name || 'Unknown Template';
  };

  const calculateTotalDelay = (stepIndex: number) => {
    let totalDays = 0;
    for (let i = 0; i <= stepIndex; i++) {
      const step = formData.steps[i];
      if (step) {
        const { value, unit } = step.delay;
        switch (unit) {
          case 'minutes':
            totalDays += value / (24 * 60);
            break;
          case 'hours':
            totalDays += value / 24;
            break;
          case 'days':
            totalDays += value;
            break;
          case 'weeks':
            totalDays += value * 7;
            break;
        }
      }
    }
    return Math.round(totalDays * 10) / 10; // Round to 1 decimal
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h1">
          {sequence ? 'Edit Sequence' : 'Create Email Sequence'}
        </h2>
        <div className="flex gap-2">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Sequence
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sequence Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sequence Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sequence-name">Sequence Name</Label>
                <Input
                  id="sequence-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Cold Outreach Sequence"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sequence-description">Description</Label>
                <Textarea
                  id="sequence-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this sequence does..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={formData.trigger.type}
                  onValueChange={(value: any) => setFormData(prev => ({
                    ...prev,
                    trigger: { ...prev.trigger, type: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(trigger => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.trigger.type === 'lead_status' && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.trigger.conditions.status || 'New'}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      trigger: {
                        ...prev.trigger,
                        conditions: { ...prev.trigger.conditions, status: value }
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Qualified">Qualified</SelectItem>
                      <SelectItem value="Nurture">Nurture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sequence Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Steps:</span>
                <span className="font-medium">{formData.steps.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {formData.steps.length > 0 
                    ? `~${calculateTotalDelay(formData.steps.length - 1)} days`
                    : '0 days'
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={formData.isActive ? "default" : "secondary"}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sequence Steps */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-h2">Email Steps</h3>
            <Button onClick={addStep} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          {formData.steps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-body text-muted-foreground mb-4">
                  No email steps yet
                </p>
                <Button onClick={addStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Step
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {formData.steps.map((step, index) => (
                <div key={step.id} className="relative">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center text-sm font-medium">
                            {step.order}
                          </div>
                          <div>
                            <h4 className="text-body-sm font-medium">
                              Step {step.order}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Day {calculateTotalDelay(index)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveStep(step.id, 'up')}
                            disabled={index === 0}
                            className="h-6 w-6"
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveStep(step.id, 'down')}
                            disabled={index === formData.steps.length - 1}
                            className="h-6 w-6"
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStep(step.id)}
                            className="h-6 w-6 text-danger-500 hover:text-danger-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Email Template</Label>
                          <Select
                            value={step.templateId}
                            onValueChange={(value) => updateStep(step.id, { templateId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {templates.map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Delay</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={step.delay.value}
                              onChange={(e) => updateStep(step.id, {
                                delay: { ...step.delay, value: parseInt(e.target.value) || 0 }
                              })}
                              className="w-20"
                            />
                            <Select
                              value={step.delay.unit}
                              onValueChange={(value: any) => updateStep(step.id, {
                                delay: { ...step.delay, unit: value }
                              })}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DELAY_UNITS.map(unit => (
                                  <SelectItem key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">
                          {getTemplateName(step.templateId)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Send after {step.delay.value} {step.delay.unit}
                            {index > 0 && ` (Day ${calculateTotalDelay(index)})`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Arrow between steps */}
                  {index < formData.steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





