"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Mail,
  Server,
  Lock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Shield,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  MoreVertical,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EmailProvider = "gmail" | "outlook" | "custom";

interface ProviderConfig {
  id: EmailProvider;
  name: string;
  icon: string;
  imap: {
    host: string;
    port: number;
  };
  smtp: {
    host: string;
    port: number;
  };
  instructions?: string;
}

interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: string;
  isDefault: boolean;
  isActive: boolean;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  syncEnabled: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSyncError?: string;
  createdAt: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "gmail",
    name: "Gmail",
    icon: "📧",
    imap: { host: "imap.gmail.com", port: 993 },
    smtp: { host: "smtp.gmail.com", port: 587 },
    instructions: "Utilisez un mot de passe d'application. Activez IMAP dans les paramètres Gmail.",
  },
  {
    id: "outlook",
    name: "Outlook / Office 365",
    icon: "📬",
    imap: { host: "outlook.office365.com", port: 993 },
    smtp: { host: "smtp.office365.com", port: 587 },
    instructions: "Utilisez votre mot de passe Microsoft ou un mot de passe d'application.",
  },
  {
    id: "custom",
    name: "Serveur personnalisé",
    icon: "⚙️",
    imap: { host: "", port: 993 },
    smtp: { host: "", port: 587 },
  },
];

interface EmailConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = "accounts" | "provider" | "credentials" | "testing" | "success";

export function EmailConfigDialog({
  open,
  onOpenChange,
  onSuccess,
}: EmailConfigDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("accounts");
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  
  // Form state
  const [accountName, setAccountName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");

  // Fetch existing email accounts
  const { data: emailData, isLoading: isLoadingAccounts } = useQuery<{
    isConfigured: boolean;
    accounts: EmailAccount[];
    email?: string;
  }>({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const res = await fetch("/api/users/email-settings");
      if (!res.ok) throw new Error("Failed to fetch email settings");
      return res.json();
    },
    enabled: open,
  });

  const accounts = emailData?.accounts || [];
  const hasAccounts = accounts.length > 0;

  // Set initial step based on whether accounts exist
  useEffect(() => {
    if (open && !isLoadingAccounts) {
      setStep(hasAccounts ? "accounts" : "provider");
    }
  }, [open, hasAccounts, isLoadingAccounts]);

  const resetForm = () => {
    setSelectedProvider(null);
    setTestStatus("idle");
    setTestError(null);
    setEditingAccountId(null);
    setAccountName("");
    setEmail("");
    setPassword("");
    setImapHost("");
    setImapPort("993");
    setSmtpHost("");
    setSmtpPort("587");
  };

  const handleProviderSelect = (provider: ProviderConfig) => {
    setSelectedProvider(provider);
    setImapHost(provider.imap.host);
    setImapPort(provider.imap.port.toString());
    setSmtpHost(provider.smtp.host);
    setSmtpPort(provider.smtp.port.toString());
    setStep("credentials");
  };

  const handleEditAccount = (account: EmailAccount) => {
    setEditingAccountId(account.id);
    setAccountName(account.name);
    setEmail(account.email);
    setPassword(""); // Don't pre-fill password
    setImapHost(account.imapHost);
    setImapPort(account.imapPort.toString());
    setSmtpHost(account.smtpHost);
    setSmtpPort(account.smtpPort.toString());
    
    // Find matching provider
    const provider = PROVIDERS.find(p => 
      p.imap.host === account.imapHost && p.smtp.host === account.smtpHost
    ) || PROVIDERS.find(p => p.id === "custom")!;
    setSelectedProvider(provider);
    setStep("credentials");
  };

  const handleAddNew = () => {
    resetForm();
    setStep("provider");
  };

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: {
      id?: string;
      name?: string;
      provider?: string;
      imap_host: string;
      imap_port: number;
      imap_user: string;
      imap_password: string;
      smtp_host: string;
      smtp_port: number;
      smtp_user: string;
      smtp_password: string;
    }) => {
      const res = await fetch("/api/users/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save email settings");
      }
      return res.json();
    },
    onSuccess: () => {
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
      queryClient.invalidateQueries({ queryKey: ["email-threads"] });
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
    onError: (error: Error) => {
      setTestStatus("error");
      setTestError(error.message);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch(`/api/users/email-settings?id=${accountId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete account");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
      toast({ title: "Compte supprimé", description: "Le compte email a été supprimé" });
      setDeleteConfirmOpen(false);
      setAccountToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestAndSave = async () => {
    if (!email || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setStep("testing");
    setTestStatus("testing");
    setTestError(null);

    // Save the settings
    await saveSettingsMutation.mutateAsync({
      id: editingAccountId || undefined,
      name: accountName || undefined,
      provider: selectedProvider?.id,
      imap_host: imapHost,
      imap_port: parseInt(imapPort),
      imap_user: email,
      imap_password: password,
      smtp_host: smtpHost,
      smtp_port: parseInt(smtpPort),
      smtp_user: email,
      smtp_password: password,
    });
  };

  const handleComplete = () => {
    resetForm();
    setStep("accounts");
    onSuccess?.();
    toast({
      title: editingAccountId ? "Compte mis à jour" : "Configuration terminée",
      description: editingAccountId 
        ? "Les paramètres du compte ont été mis à jour"
        : "Votre compte email a été configuré avec succès",
    });
    
    // If no accounts, close the dialog
    if (!hasAccounts) {
      onOpenChange(false);
    }
  };

  const handleConfirmDelete = (accountId: string) => {
    setAccountToDelete(accountId);
    setDeleteConfirmOpen(true);
  };

  const formatLastSync = (dateStr?: string) => {
    if (!dateStr) return "Jamais synchronisé";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 px-6 py-8 text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2240%22%20height=%2240%22%20viewBox=%220%200%2040%2040%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.05%22%3E%3Cpath%20d=%22M20%2020v-20h-2v20h-18v2h18v18h2v-18h18v-2h-18z%22/%3E%3C/g%3E%3C/svg%3E')]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {step === "accounts" ? "Comptes Email" : "Configuration Email"}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {step === "accounts" 
                      ? `${accounts.length} compte${accounts.length !== 1 ? "s" : ""} configuré${accounts.length !== 1 ? "s" : ""}`
                      : "Connectez votre boîte de réception"
                    }
                  </p>
                </div>
              </div>
              
              {/* Progress steps - only show during setup */}
              {step !== "accounts" && (
                <div className="flex items-center gap-2 mt-6">
                  {["provider", "credentials", "testing", "success"].map((s, i) => (
                    <div key={s} className="flex items-center">
                      <div className={cn(
                        "h-2 w-2 rounded-full transition-all",
                        step === s ? "bg-white scale-125" : 
                        ["provider", "credentials", "testing", "success"].indexOf(step) > i ? "bg-white/80" : "bg-white/30"
                      )} />
                      {i < 3 && <div className={cn(
                        "h-0.5 w-8",
                        ["provider", "credentials", "testing", "success"].indexOf(step) > i ? "bg-white/80" : "bg-white/30"
                      )} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Accounts List */}
            {step === "accounts" && (
              <div className="space-y-4">
                {isLoadingAccounts ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
                    <p className="text-gray-500">Chargement...</p>
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Mail className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">Aucun compte email configuré</p>
                    <Button onClick={handleAddNew} className="rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un compte
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                            account.isDefault 
                              ? "border-primary-200 bg-primary-50/50" 
                              : "border-gray-100 hover:border-gray-200"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                            account.isDefault ? "bg-primary-100" : "bg-gray-100"
                          )}>
                            {account.provider === "gmail" ? "📧" : 
                             account.provider === "outlook" ? "📬" : "✉️"}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 truncate">
                                {account.name}
                              </p>
                              {account.isDefault && (
                                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                  Par défaut
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {account.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {account.lastSyncStatus === "success" ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              ) : account.lastSyncStatus === "error" ? (
                                <AlertCircle className="h-3 w-3 text-rose-500" />
                              ) : (
                                <RefreshCw className="h-3 w-3 text-gray-400" />
                              )}
                              <span className="text-xs text-gray-400">
                                {formatLastSync(account.lastSyncAt)}
                              </span>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              {!account.isDefault && (
                                <DropdownMenuItem>
                                  <Star className="h-4 w-4 mr-2" />
                                  Définir par défaut
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleConfirmDelete(account.id)}
                                className="text-rose-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleAddNew}
                      className="w-full h-12 rounded-xl border-dashed border-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un autre compte
                    </Button>

                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-sm">
                      <Shield className="h-5 w-5 text-blue-600 shrink-0" />
                      <p className="text-blue-700">
                        Vos identifiants sont stockés de manière sécurisée et chiffrée
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 1: Provider Selection */}
            {step === "provider" && (
              <div className="space-y-4">
                {hasAccounts && (
                  <button 
                    onClick={() => {
                      resetForm();
                      setStep("accounts");
                    }}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Retour aux comptes
                  </button>
                )}
                
                <p className="text-gray-600 text-center mb-6">
                  Choisissez votre fournisseur de messagerie pour une configuration simplifiée
                </p>
                
                <div className="grid gap-3">
                  {PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderSelect(provider)}
                      className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all group text-left"
                    >
                      <span className="text-3xl">{provider.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-primary-700">
                          {provider.name}
                        </p>
                        {provider.instructions && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {provider.instructions}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-sm mt-6">
                  <Shield className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="text-blue-700">
                    Vos identifiants sont stockés de manière sécurisée et chiffrée
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Credentials */}
            {step === "credentials" && selectedProvider && (
              <div className="space-y-5">
                <button 
                  onClick={() => setStep(editingAccountId ? "accounts" : "provider")}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {editingAccountId ? "Annuler les modifications" : "Changer de fournisseur"}
                </button>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-2xl">{selectedProvider.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedProvider.name}</p>
                    {selectedProvider.instructions && (
                      <p className="text-xs text-gray-500">{selectedProvider.instructions}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-name" className="flex items-center gap-2">
                      Nom du compte (optionnel)
                    </Label>
                    <Input
                      id="account-name"
                      type="text"
                      placeholder="ex: Email professionnel"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      Adresse email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl"
                      disabled={!!editingAccountId}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-gray-400" />
                      Mot de passe / Mot de passe d'application
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={editingAccountId ? "Laisser vide pour conserver" : "••••••••••••"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  {/* Custom server fields */}
                  {selectedProvider.id === "custom" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="imap-host" className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-gray-400" />
                            Serveur IMAP
                          </Label>
                          <Input
                            id="imap-host"
                            placeholder="imap.exemple.com"
                            value={imapHost}
                            onChange={(e) => setImapHost(e.target.value)}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imap-port">Port IMAP</Label>
                          <Input
                            id="imap-port"
                            type="number"
                            value={imapPort}
                            onChange={(e) => setImapPort(e.target.value)}
                            className="h-11 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtp-host" className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-gray-400" />
                            Serveur SMTP
                          </Label>
                          <Input
                            id="smtp-host"
                            placeholder="smtp.exemple.com"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-port">Port SMTP</Label>
                          <Input
                            id="smtp-port"
                            type="number"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(e.target.value)}
                            className="h-11 rounded-xl"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={handleTestAndSave}
                  disabled={!email || (!editingAccountId && !password) || (selectedProvider.id === "custom" && (!imapHost || !smtpHost))}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {editingAccountId ? "Mettre à jour" : "Configurer et tester"}
                </Button>
              </div>
            )}

            {/* Step 3: Testing */}
            {step === "testing" && (
              <div className="text-center py-8">
                {testStatus === "testing" && (
                  <>
                    <div className="relative mx-auto w-20 h-20 mb-6">
                      <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping" />
                      <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary-500">
                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Configuration en cours...
                    </h3>
                    <p className="text-gray-500">
                      Nous vérifions vos paramètres de connexion
                    </p>
                  </>
                )}
                
                {testStatus === "error" && (
                  <>
                    <div className="mx-auto w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mb-6">
                      <AlertCircle className="h-10 w-10 text-rose-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Échec de la configuration
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {testError || "Vérifiez vos identifiants et réessayez"}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setStep("credentials")}
                      className="rounded-xl"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Success */}
            {step === "success" && (
              <div className="text-center py-8">
                <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {editingAccountId ? "Compte mis à jour !" : "Configuration réussie !"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {editingAccountId 
                    ? "Les paramètres du compte ont été enregistrés"
                    : "Votre boîte de réception est maintenant connectée"
                  }
                </p>
                <Button
                  onClick={handleComplete}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {hasAccounts || editingAccountId ? "Terminé" : "Commencer"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte email ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les emails synchronisés seront conservés mais vous ne pourrez plus envoyer ou recevoir de nouveaux emails depuis ce compte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => accountToDelete && deleteAccountMutation.mutate(accountToDelete)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
