import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { InvoiceBuilder } from "@/components/InvoiceBuilder";

export const Route = createFileRoute("/_authenticated/invoices/new")({
  head: () => ({
    meta: [
      { title: "Create invoice — InvoicePro" },
      { name: "description", content: "Fill in details, add items and watch your invoice build itself live." },
      { property: "og:title", content: "Create invoice — InvoicePro" },
      { property: "og:description", content: "Fill in details, add items and preview your invoice live." },
    ],
  }),
  component: NewInvoice,
});

function NewInvoice() {
  return (
    <AppShell title="Create invoice" description="Fill the form — the preview updates live">
      <InvoiceBuilder />
    </AppShell>
  );
}
