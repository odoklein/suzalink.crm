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
import { useToast } from "@/hooks/use-toast";

const accountSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  contractStatus: z.enum(["Active", "Inactive", "Pending"]),
});

type AccountFormData = z.infer<typeof accountSchema>;

type AccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string;
};

export function AccountDialog({ open, onOpenChange, accountId }: AccountDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: account } = useQuery({
    queryKey: ["account", accountId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/${accountId}`);
      if (!res.ok) throw new Error("Failed to fetch account");
      return res.json();
    },
    enabled: !!accountId && open,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      contractStatus: "Pending",
    },
  });

  const contractStatus = watch("contractStatus");

  useEffect(() => {
    if (open) {
      if (account) {
        setValue("companyName", account.companyName);
        setValue("logoUrl", account.logoUrl || "");
        setValue("contractStatus", account.contractStatus);
      } else {
        reset({
          companyName: "",
          logoUrl: "",
          contractStatus: "Pending",
        });
      }
    }
  }, [open, account, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      const url = accountId ? `/api/accounts/${accountId}` : "/api/accounts";
      const method = accountId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          logoUrl: data.logoUrl || null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to ${accountId ? "update" : "create"} account`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      if (accountId) {
        queryClient.invalidateQueries({ queryKey: ["account", accountId] });
      }
      toast({
        title: "Succès",
        description: `Compte ${accountId ? "mis à jour" : "créé"} avec succès`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || `Échec de la ${accountId ? "mise à jour" : "création"} du compte`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{accountId ? "Modifier le compte" : "Nouveau compte"}</DialogTitle>
          <DialogDescription>
            {accountId ? "Mettre à jour les informations du compte" : "Créer un nouveau compte client"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nom de l'entreprise *</Label>
            <Input
              id="companyName"
              {...register("companyName")}
              placeholder="Acme Corporation"
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL du logo</Label>
            <Input
              id="logoUrl"
              {...register("logoUrl")}
              placeholder="https://example.com/logo.png"
              type="url"
            />
            {errors.logoUrl && (
              <p className="text-sm text-destructive">{errors.logoUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractStatus">Statut du contrat</Label>
            <Select
              value={contractStatus}
              onValueChange={(value) => setValue("contractStatus", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Actif</SelectItem>
                <SelectItem value="Inactive">Inactif</SelectItem>
                <SelectItem value="Pending">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? accountId
                  ? "Mise à jour..."
                  : "Création..."
                : accountId
                ? "Mettre à jour le compte"
                : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

