"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SIGNATURE_VARIABLES = [
  { variable: "{{name}}", description: "Votre nom" },
  { variable: "{{email}}", description: "Votre adresse email" },
  { variable: "{{role}}", description: "Votre rôle" },
  { variable: "{{phone}}", description: "Votre numéro de téléphone" },
];

export function EmailSignatureSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signature, setSignature] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await fetch("/api/users/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const updateSignatureMutation = useMutation({
    mutationFn: async (signature: string) => {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailSignature: signature }),
      });
      if (!res.ok) throw new Error("Failed to update signature");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: "Signature mise à jour",
        description: "Votre signature email a été mise à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la signature.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSignatureMutation.mutate(signature);
  };

  const insertVariable = (variable: string) => {
    setSignature((prev) => prev + variable);
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#E6E8EB]">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-[#1B1F24]">
            Signature email
          </CardTitle>
          <CardDescription className="text-body text-[#6B7280]">
            Personnalisez votre signature qui sera ajoutée automatiquement à vos emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="signature">Signature</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Info className="h-3 w-3 mr-1" />
                    Variables disponibles
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#1B1F24] mb-2">
                      Variables disponibles :
                    </p>
                    {SIGNATURE_VARIABLES.map((item) => (
                      <div
                        key={item.variable}
                        className="flex items-center justify-between p-2 rounded-[8px] hover:bg-[#F9FAFB] cursor-pointer"
                        onClick={() => insertVariable(item.variable)}
                      >
                        <div>
                          <code className="text-xs font-mono text-[#3BBF7A]">
                            {item.variable}
                          </code>
                          <p className="text-xs text-[#6B7280]">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Textarea
              id="signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Exemple :&#10;&#10;{{name}}&#10;{{role}}&#10;{{email}}"
              rows={8}
              className="rounded-[12px] font-mono text-sm"
            />
            <p className="text-sm text-[#6B7280]">
              Utilisez les variables pour personnaliser votre signature. Cliquez sur "Variables disponibles" pour voir les options.
            </p>
          </div>

          {/* Preview */}
          {signature && (
            <div className="space-y-2">
              <Label>Aperçu</Label>
              <div className="p-4 bg-[#F9FAFB] border border-[#E6E8EB] rounded-[12px] text-sm whitespace-pre-wrap">
                {signature
                  .replace(/\{\{name\}\}/g, "Jean Dupont")
                  .replace(/\{\{email\}\}/g, "jean.dupont@example.com")
                  .replace(/\{\{role\}\}/g, "Business Developer")
                  .replace(/\{\{phone\}\}/g, "+33 1 23 45 67 89")}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={updateSignatureMutation.isPending}
              className="rounded-[12px]"
            >
              {updateSignatureMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer la signature"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



