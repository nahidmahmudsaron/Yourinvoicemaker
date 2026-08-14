import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCIES } from "@/lib/invoice";

export const Route = createFileRoute("/_authenticated/business")({
  head: () => ({
    meta: [
      { title: "Business profile — InvoicePro" },
      { name: "description", content: "Set your company details, logo and default terms used on every invoice." },
      { property: "og:title", content: "Business profile — InvoicePro" },
      { property: "og:description", content: "Set company details and defaults used on every invoice." },
    ],
  }),
  component: BusinessPage,
});

type Draft = {
  business_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  tax_number: string;
  logo_url: string;
  accent_color: string;
  default_currency: string;
  default_tax_rate: string;
  default_notes: string;
  default_terms: string;
};

const blank: Draft = {
  business_name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  tax_number: "",
  logo_url: "",
  accent_color: "#4f46e5",
  default_currency: "USD",
  default_tax_rate: "0",
  default_notes: "",
  default_terms: "",
};

function BusinessPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(blank);

  const profile = useQuery({
    queryKey: ["business-profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const row = profile.data;
    if (!row) return;
    setDraft({
      business_name: row.business_name ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      website: row.website ?? "",
      address: row.address ?? "",
      tax_number: row.tax_number ?? "",
      logo_url: row.logo_url ?? "",
      accent_color: row.accent_color ?? "#4f46e5",
      default_currency: row.default_currency ?? "USD",
      default_tax_rate: String(row.default_tax_rate ?? 0),
      default_notes: row.default_notes ?? "",
      default_terms: row.default_terms ?? "",
    });
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not signed in");
      const payload = {
        user_id: userId,
        ...draft,
        default_tax_rate: Number(draft.default_tax_rate) || 0,
      };
      const { error } = await supabase.from("business_profiles").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profile"] });
      toast.success("Business profile saved");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save profile"),
  });

  function field(key: keyof Draft) {
    return {
      value: draft[key],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft({ ...draft, [key]: event.target.value }),
    };
  }

  return (
    <AppShell
      title="Business profile"
      description="Appears on every invoice you send"
      actions={
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
        </Button>
      }
    >
      {profile.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="surface-card space-y-4 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Company details</h2>
            <div className="space-y-1.5">
              <Label htmlFor="business_name">Business name</Label>
              <Input id="business_name" {...field("business_name")} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bemail">Email</Label>
                <Input id="bemail" {...field("email")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bphone">Phone</Label>
                <Input id="bphone" {...field("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bwebsite">Website</Label>
                <Input id="bwebsite" {...field("website")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax_number">Tax / VAT ID</Label>
                <Input id="tax_number" {...field("tax_number")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="baddress">Address</Label>
              <Textarea id="baddress" rows={3} {...field("address")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input id="logo_url" placeholder="https://…" {...field("logo_url")} />
              {draft.logo_url && (
                <img
                  src={draft.logo_url}
                  alt="Business logo preview"
                  className="mt-2 h-12 w-auto rounded-md object-contain"
                />
              )}
            </div>
          </section>

          <section className="surface-card space-y-4 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Invoice defaults</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="accent_color">Accent color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="accent_color"
                    type="color"
                    className="h-10 w-14 p-1"
                    {...field("accent_color")}
                  />
                  <Input aria-label="Accent hex" {...field("accent_color")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Default currency</Label>
                <Select
                  value={draft.default_currency}
                  onValueChange={(value) => setDraft({ ...draft, default_currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} — {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="default_tax_rate">Default tax rate (%)</Label>
                <Input id="default_tax_rate" type="number" min="0" step="0.01" {...field("default_tax_rate")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default_notes">Default notes</Label>
              <Textarea id="default_notes" rows={3} {...field("default_notes")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default_terms">Default payment terms</Label>
              <Textarea id="default_terms" rows={3} {...field("default_terms")} />
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
