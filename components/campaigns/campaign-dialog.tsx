"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { SchemaConfigEditor, type SchemaField } from "@/components/campaigns/schema-config-editor";
import { useToast } from "@/hooks/use-toast";

const campaignSchema = z.object({
  accountId: z.string().min(1, "Account is required").optional(),
  name: z.string().min(1, "Campaign name is required"),
  status: z.enum(["Draft", "Active", "Paused"]),
  startDate: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

type CampaignDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId?: string;
  defaultAccountId?: string;
};

export function CampaignDialog({
  open,
  onOpenChange,
  campaignId,
  defaultAccountId,
}: CampaignDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schemaConfig, setSchemaConfig] = useState<SchemaField[]>([]);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
  });

  const { data: campaign } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
    enabled: !!campaignId && open,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      status: "Draft",
      accountId: defaultAccountId,
    },
  });

  const accountId = watch("accountId");
  const status = watch("status");

  useEffect(() => {
    if (open) {
      if (campaign) {
        setValue("name", campaign.name);
        setValue("status", campaign.status);
        setValue(
          "startDate",
          campaign.startDate ? new Date(campaign.startDate).toISOString().split("T")[0] : ""
        );
        setSchemaConfig(campaign.schemaConfig || []);
      } else {
        reset({
          accountId: defaultAccountId || "",
          name: "",
          status: "Draft",
          startDate: "",
        });
        setSchemaConfig([]);
      }
    }
  }, [open, campaign, defaultAccountId, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const url = campaignId ? `/api/campaigns/${campaignId}` : "/api/campaigns";
      const method = campaignId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: data.startDate || null,
          schemaConfig,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to ${campaignId ? "update" : "create"} campaign`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      }
      toast({
        title: "Succès",
        description: `Campagne ${campaignId ? "mise à jour" : "créée"} avec succès`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || `Échec de la ${campaignId ? "mise à jour" : "création"} de la campagne`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CampaignFormData) => {
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaignId ? "Modifier la campagne" : "Nouvelle campagne"}</DialogTitle>
          <DialogDescription>
            {campaignId ? "Mettre à jour les informations de la campagne" : "Créer une nouvelle campagne commerciale"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!campaignId && (
            <div className="space-y-2">
              <Label htmlFor="accountId">Compte *</Label>
              <Select value={accountId} onValueChange={(value) => setValue("accountId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && (
                <p className="text-sm text-destructive">{errors.accountId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom de la campagne *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Campagne commerciale Q4 2024"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Brouillon</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">En pause</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Schéma des champs personnalisés</Label>
            <SchemaConfigEditor value={schemaConfig} onChange={setSchemaConfig} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? campaignId
                  ? "Mise à jour..."
                  : "Création..."
                : campaignId
                ? "Mettre à jour la campagne"
                : "Créer la campagne"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

