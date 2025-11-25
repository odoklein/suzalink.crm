"use client";

import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CSVUploadWizard } from "@/components/csv-upload/csv-upload-wizard";

export default function ImportCSVPage() {
  const params = useParams();
  const campaignId = params.id as string;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/campaigns/${campaignId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-h1">Import CSV</h1>
          <p className="text-body text-muted-foreground mt-2">
            Upload and import leads from a CSV file
          </p>
        </div>
      </div>

      <CSVUploadWizard campaignId={campaignId} />
    </div>
  );
}

