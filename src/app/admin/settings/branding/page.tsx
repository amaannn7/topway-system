import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import { OrgLogoPanel } from "./logo-panel";
import { OrgDefaultsForm } from "./org-defaults-form";

export default async function BrandingSettingsPage() {
  const settings = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ImageIcon className="size-4.5" />
          </div>
          <div>
            <CardTitle className="text-sm">Shared logo</CardTitle>
            <CardDescription>
              Used on applicant PDFs when no specific agent logo applies. Replaces the old
              trick of storing this as a fake applicant record.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <OrgLogoPanel logoUrl={settings?.headerLogoUrl ?? null} />
        </CardContent>
      </Card>

      <OrgDefaultsForm
        defaultValues={{
          defaultFooterLine1: settings?.defaultFooterLine1 ?? "",
          defaultFooterLine2: settings?.defaultFooterLine2 ?? "",
          defaultFooterLine3: settings?.defaultFooterLine3 ?? "",
          invoiceFooterEmail: settings?.invoiceFooterEmail ?? "",
          invoiceFooterPhone: settings?.invoiceFooterPhone ?? "",
          invoiceFooterFax: settings?.invoiceFooterFax ?? "",
          invoiceFooterAddress: settings?.invoiceFooterAddress ?? "",
          invoiceFooterWebsite: settings?.invoiceFooterWebsite ?? "",
          defaultBankName: settings?.defaultBankName ?? "",
          defaultAccountNo: settings?.defaultAccountNo ?? "",
          defaultAccountName: settings?.defaultAccountName ?? "",
          defaultSwiftCode: settings?.defaultSwiftCode ?? "",
        }}
      />
    </div>
  );
}
