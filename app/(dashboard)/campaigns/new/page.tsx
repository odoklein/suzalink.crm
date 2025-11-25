"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
import { SchemaConfigEditor, type SchemaField } from "@/components/campaigns/schema-config-editor";
import { useToast } from "@/hooks/use-toast";

const campaignSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  name: z.string().min(1, "Campaign name is required"),
  status: z.enum(["Draft", "Active", "Paused"]),
  startDate: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schemaConfig, setSchemaConfig] = useState<SchemaField[]>([]);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      status: "Draft",
    },
  });

  const accountId = watch("accountId");
  const status = watch("status");

  const onSubmit = async (data: CampaignFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: data.startDate || null,
          schemaConfig,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create campaign");
      }

      const campaign = await res.json();
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      router.push(`/campaigns/${campaign.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-h1">New Campaign</h1>
          <p className="text-body text-muted-foreground mt-2">Create a new sales campaign</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Information</CardTitle>
            <CardDescription>Enter the basic details for the campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountId">Account *</Label>
              <Select value={accountId} onValueChange={(value) => setValue("accountId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && (
                <p className="text-sm text-destructive">{errors.accountId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Q4 2024 Sales Campaign"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setValue("status", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <SchemaConfigEditor value={schemaConfig} onChange={setSchemaConfig} />

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Campaign"}
          </Button>
          <Link href="/campaigns">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

