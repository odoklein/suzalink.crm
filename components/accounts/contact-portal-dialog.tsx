"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  Copy,
  CheckCircle2,
  Mail,
  ExternalLink,
  Clock,
  Link2,
  RefreshCw,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  portalEnabled?: boolean;
  lastPortalAccess?: string | null;
  portalToken?: string | null;
}

interface ContactPortalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  accountId: string;
}

export function ContactPortalDialog({
  open,
  onOpenChange,
  contact,
  accountId,
}: ContactPortalDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [portalEnabled, setPortalEnabled] = useState(contact?.portalEnabled || false);
  const [magicLinkUrl, setMagicLinkUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const togglePortalMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch(`/api/contacts/${contact?.id}/portal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update portal access");
      return res.json();
    },
    onSuccess: (data) => {
      setPortalEnabled(data.portalEnabled);
      queryClient.invalidateQueries({ queryKey: ["account", accountId] });
      toast({
        title: data.portalEnabled ? "Portail activé" : "Portail désactivé",
        description: data.portalEnabled
          ? "Le contact peut maintenant accéder au portail"
          : "L'accès au portail a été désactivé",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMagicLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/contact-portal/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact?.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send magic link");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setMagicLinkUrl(data.magicLink);
      queryClient.invalidateQueries({ queryKey: ["account", accountId] });
      toast({
        title: data.emailSent ? "Lien envoyé" : "Lien généré",
        description: data.emailSent
          ? `Un email a été envoyé à ${contact?.email}`
          : "Le lien a été généré mais l'email n'a pas pu être envoyé",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async () => {
    if (magicLinkUrl) {
      await navigator.clipboard.writeText(magicLinkUrl);
      setLinkCopied(true);
      toast({
        title: "Lien copié",
        description: "Le lien a été copié dans le presse-papier",
      });
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  if (!contact) return null;

  const hasEmail = !!contact.email;
  const lastAccess = contact.lastPortalAccess
    ? new Date(contact.lastPortalAccess)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-500" />
            Accès au portail
          </DialogTitle>
          <DialogDescription>
            Gérez l'accès au portail client pour {contact.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact Info */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-lg">
              {contact.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{contact.name}</p>
              {contact.email && (
                <p className="text-sm text-slate-500 truncate">{contact.email}</p>
              )}
              {contact.position && (
                <p className="text-xs text-slate-400">{contact.position}</p>
              )}
            </div>
          </div>

          {/* No Email Warning */}
          {!hasEmail && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <Mail className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Email requis</p>
                <p className="text-sm text-amber-700">
                  Ce contact n'a pas d'adresse email. Ajoutez une adresse email pour activer l'accès au portail.
                </p>
              </div>
            </div>
          )}

          {/* Portal Toggle */}
          {hasEmail && (
            <>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    portalEnabled ? "bg-emerald-100" : "bg-slate-100"
                  )}>
                    <Link2 className={cn(
                      "h-5 w-5",
                      portalEnabled ? "text-emerald-600" : "text-slate-400"
                    )} />
                  </div>
                  <div>
                    <Label htmlFor="portal-toggle" className="font-medium">
                      Activer le portail
                    </Label>
                    <p className="text-xs text-slate-500">
                      Permet au contact d'accéder au portail client
                    </p>
                  </div>
                </div>
                <Switch
                  id="portal-toggle"
                  checked={portalEnabled}
                  disabled={togglePortalMutation.isPending}
                  onCheckedChange={(checked) => togglePortalMutation.mutate(checked)}
                />
              </div>

              {/* Last Access */}
              {lastAccess && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  Dernier accès : {lastAccess.toLocaleDateString("fr-FR")} à{" "}
                  {lastAccess.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}

              {/* Send Magic Link */}
              {portalEnabled && (
                <div className="space-y-3">
                  <Button
                    onClick={() => sendMagicLinkMutation.mutate()}
                    disabled={sendMagicLinkMutation.isPending}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                  >
                    {sendMagicLinkMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {magicLinkUrl ? "Renvoyer le lien" : "Envoyer le lien d'accès"}
                  </Button>

                  {/* Magic Link Display */}
                  {magicLinkUrl && (
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">
                        Lien d'accès (valable 24h)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={magicLinkUrl}
                          readOnly
                          className="text-xs font-mono bg-slate-50"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyToClipboard}
                          className="flex-shrink-0"
                        >
                          {linkCopied ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(magicLinkUrl, "_blank")}
                          className="flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}




