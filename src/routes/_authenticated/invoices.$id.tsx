import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { InvoiceBuilder } from "@/components/InvoiceBuilder";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/invoices/$id")({
  head: () => ({
    meta: [
      { title: "Edit invoice — InvoicePro" },
      { name: "description", content: "Update items, totals and design, then re-download or share your invoice." },
      { property: "og:title", content: "Edit invoice — InvoicePro" },
      { property: "og:description", content: "Update items, totals and design of your invoice." },
    ],
  }),
  component: EditInvoice,
});

function EditInvoice() {
  const { id } = Route.useParams();

  const invoice = useQuery({
    queryKey: ["invoice-meta", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("invoice_number, public_token")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function share() {
    if (!invoice.data) return;
    const url = `${window.location.origin}/i/${invoice.data.public_token}`;
    const { error } = await supabase.from("invoices").update({ is_public: true }).eq("id", id);
    if (error) {
      toast.error("Could not enable the share link");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Public link copied — this invoice is now shared");
    } catch {
      toast.error(`Copy failed — ${url}`);
    }
  }


  return (
    <AppShell
      title={invoice.data?.invoice_number ?? "Edit invoice"}
      description="Edit details — the preview updates live"
      actions={
        <Button variant="outline" size="sm" onClick={share} disabled={!invoice.data}>
          <Share2 className="size-4" /> Share link
        </Button>
      }
    >
      <InvoiceBuilder invoiceId={id} />
    </AppShell>
  );
}
