import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Printer } from "lucide-react";

import { InvoicePreview, type PreviewData } from "@/components/InvoicePreview";
import { Logo } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { InvoiceStatus, LineItem } from "@/lib/invoice";

export const Route = createFileRoute("/i/$token")({
  head: () => ({
    meta: [
      { title: "Shared invoice — InvoicePro" },
      { name: "description", content: "View, print or download a shared invoice created with InvoicePro." },
      { property: "og:title", content: "Shared invoice — InvoicePro" },
      { property: "og:description", content: "View, print or download this shared invoice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicInvoice,
});

function PublicInvoice() {
  const { token } = Route.useParams();

  const query = useQuery({
    queryKey: ["public-invoice", token],
    queryFn: async () => {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("public_token", token)
        .maybeSingle();
      if (error) throw error;
      if (!invoice) return null;
      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("sort_order", { ascending: true });
      if (itemsError) throw itemsError;
      return { invoice, items: items ?? [] };
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-bold">Invoice not available</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This link is invalid or sharing has been turned off by the sender.
        </p>
      </div>
    );
  }

  const { invoice, items } = query.data;
  const business = (invoice.business_snapshot ?? {}) as Record<string, string | null>;
  const customer = (invoice.customer_snapshot ?? {}) as Record<string, string | null>;

  const data: PreviewData = {
    business,
    customer,
    invoice_number: invoice.invoice_number,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date ?? "",
    currency: invoice.currency,
    status: invoice.status,
    tax_rate: Number(invoice.tax_rate) || 0,
    discount_type: invoice.discount_type,
    discount_value: Number(invoice.discount_value) || 0,
    shipping: Number(invoice.shipping) || 0,
    notes: invoice.notes,
    terms: invoice.terms,
    template: invoice.template,
    accent_color: invoice.accent_color,
    items: items.map(
      (item): LineItem => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
      }),
    ),
  };

  return (
    <div className="min-h-screen bg-muted/40 py-8">
      <div className="mx-auto w-full max-w-3xl px-4">
        <header className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.status as InvoiceStatus} />
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Print / Download PDF
            </Button>
          </div>
        </header>
        <InvoicePreview data={data} />
        <p className="no-print mt-6 text-center text-xs text-muted-foreground">
          Created with InvoicePro
        </p>
      </div>
    </div>
  );
}
