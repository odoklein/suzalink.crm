"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CSVUploadWizard } from "@/components/csv-upload/csv-upload-wizard";

export default function ImportCSVPage() {
  const params = useParams();
  const campaignId = params.id as string;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/campaigns/${campaignId}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <FileSpreadsheet className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-main">Import Leads</h1>
                <p className="text-sm text-text-body">
                  Upload CSV or Excel files to add leads to your campaign
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <CSVUploadWizard campaignId={campaignId} />
      </div>
    </div>
  );
}

