"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function NewAccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      contractStatus: "Pending",
    },
  });

  const contractStatus = watch("contractStatus");

  const onSubmit = async (data: AccountFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          logoUrl: data.logoUrl || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create account");
      }

      const account = await res.json();
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      router.push(`/accounts/${account.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/accounts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-h1">New Account</h1>
          <p className="text-body text-muted-foreground mt-2">Create a new client account</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Enter the details for the new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
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
              <Label htmlFor="logoUrl">Logo URL</Label>
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
              <Label htmlFor="contractStatus">Contract Status</Label>
              <Select
                value={contractStatus}
                onValueChange={(value) => setValue("contractStatus", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Account"}
              </Button>
              <Link href="/accounts">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

