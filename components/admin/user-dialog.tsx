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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const userSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["ADMIN", "MANAGER", "BD", "DEVELOPER"]),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").optional(),
  isActive: z.boolean().default(true),
  sendInvite: z.boolean().default(false),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function UserDialog({ open, onOpenChange, userId }: UserDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sendInvite, setSendInvite] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!userId && open,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "BD",
      isActive: true,
      sendInvite: false,
    },
  });

  const role = watch("role");
  const isActive = watch("isActive");

  useEffect(() => {
    if (open) {
      if (user) {
        setValue("email", user.email);
        setValue("role", user.role as "ADMIN" | "MANAGER" | "BD" | "DEVELOPER");
        setValue("isActive", user.isActive);
        setSendInvite(false);
      } else {
        reset({
          email: "",
          role: "BD",
          isActive: true,
          sendInvite: false,
        });
        setSendInvite(true);
      }
    }
  }, [open, user, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const url = userId ? `/api/admin/users/${userId}` : "/api/admin/users";
      const method = userId ? "PATCH" : "POST";
      const body = userId
        ? { role: data.role, isActive: data.isActive }
        : {
            email: data.email,
            role: data.role,
            password: data.password,
            isActive: data.isActive,
            sendInvite: data.sendInvite,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      toast({
        title: "Succès",
        description: userId ? "Utilisateur mis à jour" : "Utilisateur créé avec succès",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: UserFormData) => {
    mutation.mutate({ ...data, sendInvite });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{userId ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
          <DialogDescription>
            {userId
              ? "Modifiez le rôle et le statut de l'utilisateur"
              : "Créez un nouvel utilisateur et définissez ses permissions"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!userId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  {...register("email")}
                  placeholder="utilisateur@example.com"
                  className="rounded-[12px]"
                />
                {errors.email && (
                  <p className="text-sm text-[#EF4444]">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe temporaire</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="Laissez vide pour générer automatiquement"
                  className="rounded-[12px]"
                />
                {errors.password && (
                  <p className="text-sm text-[#EF4444]">{errors.password.message}</p>
                )}
                <p className="text-xs text-[#6B7280]">
                  Si vide, un mot de passe sera généré automatiquement
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="sendInvite"
                  checked={sendInvite}
                  onCheckedChange={setSendInvite}
                />
                <Label htmlFor="sendInvite" className="cursor-pointer">
                  Envoyer un email d'invitation
                </Label>
              </div>
            </>
          )}

          {userId && (
            <div className="space-y-2">
              <Label htmlFor="email-display">Email</Label>
              <Input
                id="email-display"
                value={user?.email || ""}
                disabled
                className="bg-[#F9FAFB] rounded-[12px]"
              />
              <p className="text-sm text-[#6B7280]">L'email ne peut pas être modifié</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select 
              value={role || "BD"} 
              onValueChange={(value) => setValue("role", value as "ADMIN" | "MANAGER" | "BD" | "DEVELOPER")}
            >
              <SelectTrigger id="role" className="rounded-[12px]">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
                <SelectItem value="MANAGER">Gestionnaire</SelectItem>
                <SelectItem value="BD">Business Developer</SelectItem>
                <SelectItem value="DEVELOPER">Développeur</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-[#EF4444]">{errors.role.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Utilisateur actif
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-[12px]"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="rounded-[12px]">
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : userId ? (
                "Enregistrer"
              ) : (
                "Créer l'utilisateur"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

