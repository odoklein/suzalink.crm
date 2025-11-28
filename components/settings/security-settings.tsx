"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PasswordStrength {
  score: number;
  feedback: string[];
}

function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("Au moins 8 caractères");
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Une lettre minuscule");
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Une lettre majuscule");
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Un chiffre");
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Un caractère spécial");
  }

  return { score, feedback };
}

export function SecuritySettings() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = newPassword ? checkPasswordStrength(newPassword) : null;

  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été modifié avec succès.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le mot de passe.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength && passwordStrength.score < 3) {
      toast({
        title: "Mot de passe faible",
        description: "Veuillez choisir un mot de passe plus fort.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const getStrengthColor = (score: number) => {
    if (score <= 2) return "bg-[#EF4444]";
    if (score <= 3) return "bg-[#F59E0B]";
    return "bg-[#3BBF7A]";
  };

  const getStrengthLabel = (score: number) => {
    if (score <= 2) return "Faible";
    if (score <= 3) return "Moyen";
    return "Fort";
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#E6E8EB]">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-[#1B1F24]">
            Changer le mot de passe
          </CardTitle>
          <CardDescription className="text-body text-[#6B7280]">
            Mettez à jour votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="rounded-[12px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1B1F24]"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="rounded-[12px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1B1F24]"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[#E6E8EB] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getStrengthColor(
                          passwordStrength.score
                        )}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[#6B7280]">
                      {getStrengthLabel(passwordStrength.score)}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-[#6B7280]">Le mot de passe doit contenir :</p>
                      <ul className="space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className="flex items-center gap-2 text-xs text-[#6B7280]">
                            <XCircle className="h-3 w-3" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {passwordStrength.score >= 3 && (
                    <div className="flex items-center gap-2 text-xs text-[#3BBF7A]">
                      <CheckCircle2 className="h-3 w-3" />
                      Mot de passe valide
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-[12px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1B1F24]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-[#EF4444]">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="rounded-[12px]"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  "Modifier le mot de passe"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}











