"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateEditor } from "@/components/email/template-editor";
import { SequenceBuilder } from "@/components/email/sequence-builder";
import { TemplatePreviewDrawer } from "@/components/email/template-preview-drawer";
import { SequenceDetailsDrawer } from "@/components/email/sequence-details-drawer";
import { 
  Plus, 
  Mail, 
  Workflow, 
  Play, 
  Pause, 
  Edit, 
  Trash2,
  BarChart3,
  Settings,
  Copy
} from "lucide-react";
import { EmailTemplate, EmailSequence } from "@/lib/email-templates";
import { useToast } from "@/hooks/use-toast";

export default function EmailAutomationPage() {
  const [activeTab, setActiveTab] = useState("templates");
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showSequenceBuilder, setShowSequenceBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | undefined>();
  const [editingSequence, setEditingSequence] = useState<EmailSequence | undefined>();
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [previewSequence, setPreviewSequence] = useState<EmailSequence | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await fetch("/api/email/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  // Fetch sequences
  const { data: sequences = [], isLoading: sequencesLoading } = useQuery<EmailSequence[]>({
    queryKey: ["email-sequences"],
    queryFn: async () => {
      const res = await fetch("/api/email/sequences");
      if (!res.ok) throw new Error("Failed to fetch sequences");
      return res.json();
    },
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      const res = await fetch("/api/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });
      if (!res.ok) throw new Error("Failed to save template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      setShowTemplateEditor(false);
      setEditingTemplate(undefined);
      toast({
        title: "Succès",
        description: "Modèle d'email enregistré avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de l'enregistrement du modèle d'email",
        variant: "destructive",
      });
    },
  });

  // Save sequence mutation
  const saveSequenceMutation = useMutation({
    mutationFn: async (sequenceData: Omit<EmailSequence, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      const res = await fetch("/api/email/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sequenceData),
      });
      if (!res.ok) throw new Error("Failed to save sequence");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      setShowSequenceBuilder(false);
      setEditingSequence(undefined);
      toast({
        title: "Succès",
        description: "Séquence d'email enregistrée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de l'enregistrement de la séquence d'email",
        variant: "destructive",
      });
    },
  });

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowTemplateEditor(true);
  };

  const handleEditSequence = (sequence: EmailSequence) => {
    setEditingSequence(sequence);
    setShowSequenceBuilder(true);
  };

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

  if (showTemplateEditor) {
    return (
      <div className="p-6">
        <TemplateEditor
          template={editingTemplate}
          onSave={(templateData) => saveTemplateMutation.mutate(templateData)}
          onCancel={() => {
            setShowTemplateEditor(false);
            setEditingTemplate(undefined);
          }}
        />
      </div>
    );
  }

  if (showSequenceBuilder) {
    return (
      <div className="p-6">
        <SequenceBuilder
          sequence={editingSequence}
          templates={templates}
          onSave={(sequenceData) => saveSequenceMutation.mutate(sequenceData)}
          onCancel={() => {
            setShowSequenceBuilder(false);
            setEditingSequence(undefined);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Automatisation des emails</h1>
          <p className="text-body text-muted-foreground mt-2">
            Gérez les modèles d'emails et les séquences automatisées
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytiques
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Modèles
          </TabsTrigger>
          <TabsTrigger value="sequences" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Séquences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-h2">Modèles d'emails</h2>
            <Button onClick={() => setShowTemplateEditor(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau modèle
            </Button>
          </div>

          {templatesLoading ? (
            <div className="text-center py-12">Chargement des modèles...</div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-body text-muted-foreground mb-4">
                  Aucun modèle d'email pour le moment
                </p>
                <Button onClick={() => setShowTemplateEditor(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier modèle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-body-sm">{template.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.subject}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getCategoryColor(template.category)}`}
                      >
                        {template.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {template.variables.length} variable{template.variables.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(template);
                          }}
                          className="h-6 w-6"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-danger-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sequences" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-h2">Séquences d'emails</h2>
            <Button onClick={() => setShowSequenceBuilder(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle séquence
            </Button>
          </div>

          {sequencesLoading ? (
            <div className="text-center py-12">Chargement des séquences...</div>
          ) : sequences.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Workflow className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-body text-muted-foreground mb-4">
                  Aucune séquence d'email pour le moment
                </p>
                <Button onClick={() => setShowSequenceBuilder(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la première séquence
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {sequences.map((sequence) => (
                <Card 
                  key={sequence.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setPreviewSequence(sequence)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-h2">{sequence.name}</CardTitle>
                        <p className="text-body text-muted-foreground mt-1">
                          {sequence.description}
                        </p>
                      </div>
                      <Badge variant={sequence.isActive ? "default" : "secondary"}>
                        {sequence.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">{sequence.steps.length}</div>
                        <div className="text-xs text-muted-foreground">Étapes</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">0</div>
                        <div className="text-xs text-muted-foreground">Actives</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">0</div>
                        <div className="text-xs text-muted-foreground">Terminées</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Déclencheur : {sequence.trigger?.type?.replace('_', ' ') || 'Non défini'}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Pause className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSequence(sequence);
                          }}
                          className="h-6 w-6"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-danger-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TemplatePreviewDrawer
        open={!!previewTemplate}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
        template={previewTemplate}
        onEdit={handleEditTemplate}
      />

      <SequenceDetailsDrawer
        open={!!previewSequence}
        onOpenChange={(open) => {
          if (!open) setPreviewSequence(null);
        }}
        sequence={previewSequence}
        onEdit={handleEditSequence}
      />
    </div>
  );
}



