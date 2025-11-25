"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, AlertCircle, TestTube } from "lucide-react";
import { HelpIcon } from "@/components/help/help-icon";

interface EmailConfig {
  imap: {
    host: string;
    port: number;
    encryption: "none" | "ssl" | "tls";
    username: string;
    password: string;
  };
  smtp: {
    host: string;
    port: number;
    encryption: "none" | "ssl" | "tls";
    username: string;
    password: string;
  };
}

type ConnectionStatus = "connected" | "error" | "not_configured" | "testing";

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const [imapConfig, setImapConfig] = useState({
    host: "",
    port: 993,
    encryption: "ssl" as "none" | "ssl" | "tls",
    username: "",
    password: "",
  });
  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: 587,
    encryption: "tls" as "none" | "ssl" | "tls",
    username: "",
    password: "",
  });
  const [imapStatus, setImapStatus] = useState<ConnectionStatus>("not_configured");
  const [smtpStatus, setSmtpStatus] = useState<ConnectionStatus>("not_configured");

  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/email");
      if (!res.ok) throw new Error("Failed to fetch email settings");
      return res.json();
    },
  });

  const saveEmailSettingsMutation = useMutation({
    mutationFn: async (config: EmailConfig) => {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save email settings");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Paramètres enregistrés",
        description: "Vos paramètres email ont été enregistrés avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer les paramètres.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async ({ type, config }: { type: "imap" | "smtp"; config: any }) => {
      const res = await fetch("/api/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, config }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Connection test failed");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (variables.type === "imap") {
        setImapStatus("connected");
      } else {
        setSmtpStatus("connected");
      }
      toast({
        title: "Connexion réussie",
        description: `La connexion ${variables.type.toUpperCase()} fonctionne correctement.`,
      });
    },
    onError: (error: Error, variables) => {
      if (variables.type === "imap") {
        setImapStatus("error");
      } else {
        setSmtpStatus("error");
      }
      toast({
        title: "Échec de la connexion",
        description: error.message || "Impossible de se connecter.",
        variant: "destructive",
      });
    },
  });

  const handleTestImap = () => {
    setImapStatus("testing");
    testConnectionMutation.mutate({ type: "imap", config: imapConfig });
  };

  const handleTestSmtp = () => {
    setSmtpStatus("testing");
    testConnectionMutation.mutate({ type: "smtp", config: smtpConfig });
  };

  const handleSave = () => {
    saveEmailSettingsMutation.mutate({
      imap: imapConfig,
      smtp: smtpConfig,
    });
  };

  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-[#3BBF7A] text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connecté
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Erreur
          </Badge>
        );
      case "testing":
        return (
          <Badge variant="outline">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Test en cours...
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Non configuré
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-[#1B1F24] tracking-[-0.5px]">
          Paramètres Email
        </h1>
        <p className="text-body text-[#6B7280] mt-2">
          Configurez vos paramètres IMAP et SMTP pour synchroniser et envoyer des emails
        </p>
      </div>

      <div className="space-y-6">
        {/* IMAP Configuration */}
        <Card className="border-[#E6E8EB]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-h2 font-semibold text-[#1B1F24]">
                  Configuration IMAP
                </CardTitle>
                <CardDescription className="text-body text-[#6B7280] mt-1">
                  Paramètres pour recevoir et synchroniser vos emails
                </CardDescription>
              </div>
              {getStatusBadge(imapStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imap-host">
                  Serveur IMAP
                  <HelpIcon
                    content="Adresse du serveur IMAP (ex: imap.gmail.com, imap.outlook.com)"
                    side="right"
                  />
                </Label>
                <Input
                  id="imap-host"
                  value={imapConfig.host}
                  onChange={(e) =>
                    setImapConfig({ ...imapConfig, host: e.target.value })
                  }
                  placeholder="imap.gmail.com"
                  className="rounded-[12px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imap-port">Port</Label>
                <Input
                  id="imap-port"
                  type="number"
                  value={imapConfig.port}
                  onChange={(e) =>
                    setImapConfig({ ...imapConfig, port: parseInt(e.target.value) || 993 })
                  }
                  className="rounded-[12px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imap-encryption">Chiffrement</Label>
              <Select
                value={imapConfig.encryption}
                onValueChange={(value: "none" | "ssl" | "tls") =>
                  setImapConfig({ ...imapConfig, encryption: value })
                }
              >
                <SelectTrigger id="imap-encryption" className="rounded-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ssl">SSL/TLS</SelectItem>
                  <SelectItem value="tls">STARTTLS</SelectItem>
                  <SelectItem value="none">Aucun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imap-username">Nom d'utilisateur</Label>
              <Input
                id="imap-username"
                value={imapConfig.username}
                onChange={(e) =>
                  setImapConfig({ ...imapConfig, username: e.target.value })
                }
                placeholder="votre@email.com"
                className="rounded-[12px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imap-password">Mot de passe / Mot de passe d'application</Label>
              <Input
                id="imap-password"
                type="password"
                value={imapConfig.password}
                onChange={(e) =>
                  setImapConfig({ ...imapConfig, password: e.target.value })
                }
                placeholder="••••••••"
                className="rounded-[12px]"
              />
              <p className="text-sm text-[#6B7280]">
                Pour Gmail, utilisez un mot de passe d'application. Consultez{" "}
                <a
                  href="https://support.google.com/accounts/answer/185833"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3BBF7A] hover:underline"
                >
                  cette page
                </a>{" "}
                pour plus d'informations.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleTestImap}
                variant="outline"
                disabled={testConnectionMutation.isPending || !imapConfig.host}
                className="rounded-[12px]"
              >
                {imapStatus === "testing" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Tester la connexion
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SMTP Configuration */}
        <Card className="border-[#E6E8EB]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-h2 font-semibold text-[#1B1F24]">
                  Configuration SMTP
                </CardTitle>
                <CardDescription className="text-body text-[#6B7280] mt-1">
                  Paramètres pour envoyer des emails
                </CardDescription>
              </div>
              {getStatusBadge(smtpStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">
                  Serveur SMTP
                  <HelpIcon
                    content="Adresse du serveur SMTP (ex: smtp.gmail.com, smtp.outlook.com)"
                    side="right"
                  />
                </Label>
                <Input
                  id="smtp-host"
                  value={smtpConfig.host}
                  onChange={(e) =>
                    setSmtpConfig({ ...smtpConfig, host: e.target.value })
                  }
                  placeholder="smtp.gmail.com"
                  className="rounded-[12px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={smtpConfig.port}
                  onChange={(e) =>
                    setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) || 587 })
                  }
                  className="rounded-[12px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-encryption">Chiffrement</Label>
              <Select
                value={smtpConfig.encryption}
                onValueChange={(value: "none" | "ssl" | "tls") =>
                  setSmtpConfig({ ...smtpConfig, encryption: value })
                }
              >
                <SelectTrigger id="smtp-encryption" className="rounded-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls">STARTTLS</SelectItem>
                  <SelectItem value="ssl">SSL/TLS</SelectItem>
                  <SelectItem value="none">Aucun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-username">Nom d'utilisateur</Label>
              <Input
                id="smtp-username"
                value={smtpConfig.username}
                onChange={(e) =>
                  setSmtpConfig({ ...smtpConfig, username: e.target.value })
                }
                placeholder="votre@email.com"
                className="rounded-[12px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-password">Mot de passe / Mot de passe d'application</Label>
              <Input
                id="smtp-password"
                type="password"
                value={smtpConfig.password}
                onChange={(e) =>
                  setSmtpConfig({ ...smtpConfig, password: e.target.value })
                }
                placeholder="••••••••"
                className="rounded-[12px]"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleTestSmtp}
                variant="outline"
                disabled={testConnectionMutation.isPending || !smtpConfig.host}
                className="rounded-[12px]"
              >
                {smtpStatus === "testing" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Tester la connexion
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-[#E6E8EB] bg-[#F9FAFB]">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#3BBF7A] flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-[#1B1F24]">Sécurité des informations</h3>
                <p className="text-sm text-[#6B7280]">
                  Vos identifiants email sont chiffrés et stockés de manière sécurisée. Seul vous
                  pouvez voir et modifier ces paramètres. Nous recommandons d'utiliser des mots de
                  passe d'application plutôt que votre mot de passe principal pour une sécurité
                  optimale.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveEmailSettingsMutation.isPending}
            className="rounded-[12px]"
          >
            {saveEmailSettingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer les paramètres"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}




