import { Suspense } from "react";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { STATIC_BUSINESS_TYPES } from "@/lib/business-success-types";
import { BusinessSuccessClient, BusinessSuccessFallback } from "@/components/marketing/business-success-client";

export default function BusinessSuccessPage() {
  return (
    <MarketingShell>
      <Suspense fallback={<BusinessSuccessFallback />}>
        <BusinessSuccessClient initialTypes={[...STATIC_BUSINESS_TYPES]} />
      </Suspense>
    </MarketingShell>
  );
}
