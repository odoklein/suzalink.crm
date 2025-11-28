"use client";

import { BDPerformanceReport } from "@/components/reporting/bd-performance-report";

export default function BDPerformanceReportPage() {
  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-[#1B1F24] tracking-[-0.5px]">
          Performance des Business Developers
        </h1>
        <p className="text-body text-[#6B7280] mt-2">
          Analysez les performances individuelles et collectives de vos équipes
        </p>
      </div>
      <BDPerformanceReport />
    </div>
  );
}











