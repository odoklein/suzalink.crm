"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/contact-portal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verification failed");
      }
      
      return res.json();
    },
    onSuccess: () => {
      setStatus("success");
      // Redirect to dashboard after a brief success message
      setTimeout(() => {
        router.push("/contact-portal/dashboard");
      }, 1500);
    },
    onError: (error: Error) => {
      setStatus("error");
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate();
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <div className="text-center max-w-md mx-auto p-8">
        {status === "verifying" && (
          <>
            <div className="relative mx-auto w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-25" />
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
                <Loader2 className="h-12 w-12 text-white animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              Vérification en cours...
            </h1>
            <p className="text-slate-500">
              Nous vérifions votre lien d'accès
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              Bienvenue !
            </h1>
            <p className="text-slate-500 mb-6">
              Connexion réussie. Redirection vers votre portail...
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Redirection...</span>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center mb-8">
              <XCircle className="h-12 w-12 text-rose-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              Lien invalide
            </h1>
            <p className="text-slate-500 mb-6">
              {errorMessage || "Ce lien n'est plus valide ou a déjà été utilisé."}
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Veuillez demander un nouveau lien d'accès à votre contact.
            </p>
            <Button
              variant="outline"
              onClick={() => window.close()}
              className="rounded-xl"
            >
              Fermer
            </Button>
          </>
        )}
      </div>
    </div>
  );
}










