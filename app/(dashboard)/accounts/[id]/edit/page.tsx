"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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

export default function EditAccountPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const accountId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: account, isLoading } = useQuery({
    queryKey: ["account", accountId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/${accountId}`);
      if (!res.ok) throw new Error("Failed to fetch account");
      return res.json();
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  const contractStatus = watch("contractStatus");

  useEffect(() => {
    if (account) {
      setValue("companyName", account.companyName);
      setValue("logoUrl", account.logoUrl || "");
      setValue("contractStatus", account.contractStatus);
    }
  }, [account, setValue]);

  const onSubmit = async (data: AccountFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          logoUrl: data.logoUrl || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update account");
      }

      toast({
        title: "Success",
        description: "Account updated successfully",
      });
      router.push(`/accounts/${accountId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!account) {
    return <div className="p-6">Account not found</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/accounts/${accountId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-h1">Edit Account</h1>
          <p className="text-body text-muted-foreground mt-2">Update account information</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update the account details</CardDescription>
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
                {isSubmitting ? "Updating..." : "Update Account"}
              </Button>
              <Link href={`/accounts/${accountId}`}>
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

