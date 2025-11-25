"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe invalide");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative flex min-h-screen items-center justify-center p-4"
      style={{
        backgroundImage: 'url(https://iili.io/ffAAC1j.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Card 
        className="relative z-10 w-full max-w-md"
        style={{
          background: 'rgba(255, 255, 255, 0.84)',
          borderRadius: '16px',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10.8px)',
          WebkitBackdropFilter: 'blur(10.8px)',
          border: '1px solid rgba(255, 255, 255, 1)',
        }}
      >
        <CardHeader className="text-center items-center">
          <img 
            src="/logo-wide.svg" 
            alt="Suzalink Logo" 
            width={180} 
            height={35}
            className="mb-2"
          />
          <CardDescription className="text-text-body">Connectez-vous à votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

