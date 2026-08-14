import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, Printer, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { InvoicePreview, type PreviewData } from "@/components/InvoicePreview";
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
import {
  ACCENT_PRESETS,
  computeTotals,
  CURRENCIES,
  formatMoney,
  newLineItem,
  nextInvoiceNumber,
  TEMPLATES,
  type LineItem,
} from "@/lib/invoice";
import { cn } from "@/lib/utils";

interface FormState {
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string;
  currency: string;
  tax_rate: number;
  discount_type: string;
  discount_value: number;
  shipping: number;
  notes: string;
  terms: string;
  template: string;
  accent_color: string;
  customer_id: string | null;
}

const emptyBusiness = {
  business_name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  logo_url: "",
  tax_number: "",
};

const emptyCustomer = { name: "", email: "", phone: "", company: "", address: "" };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function InvoiceBuilder({ invoiceId }: { invoiceId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [business, setBusiness] = useState({ ...emptyBusiness });
  const [customer, setCustomer] = useState({ ...emptyCustomer });
  const [items, setItems] = useState<LineItem[]>([newLineItem()]);
  const [form, setForm] = useState<FormState>({
    invoice_number: "",
    status: "draft",
    issue_date: today(),
    due_date: inDays(14),
    currency: "USD",
    tax_rate: 0,
    discount_type: "percent",
    discount_value: 0,
    shipping: 0,
    notes: "",
    terms: "",
    template: "modern",
    accent_color: "#4f46e5",
    customer_id: null,
  });

  const bootstrap = useQuery({
    queryKey: ["builder-bootstrap", invoiceId ?? "new"],
    queryFn: async () => {
      const [profile, customers, invoiceNumbers] = await Promise.all([
        supabase.from("business_profiles").select("*").maybeSingle(),
        supabase.from("customers").select("*").order("name"),
        supabase.from("invoices").select("invoice_number"),
      ]);
      let invoice = null;
      let invoiceItems: LineItem[] = [];
      if (invoiceId) {
        const [invoiceResult, itemsResult] = await Promise.all([
          supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle(),
          supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId).order("sort_order"),
        ]);
        if (invoiceResult.error) throw invoiceResult.error;
        invoice = invoiceResult.data;
        invoiceItems = (itemsResult.data ?? []).map((row) => ({
          id: row.id,
          description: row.description ?? "",
          quantity: Number(row.quantity),
          unit_price: Number(row.unit_price),
        }));
      }
      return {
        profile: profile.data,
        customers: customers.data ?? [],
        numbers: (invoiceNumbers.data ?? []).map((row) => row.invoice_number),
        invoice,
        invoiceItems,
      };
    },
  });

  useEffect(() => {
    if (!bootstrap.data || ready) return;
    const { profile, invoice, invoiceItems, numbers } = bootstrap.data;
    if (invoice) {
      const snapshotBusiness = (invoice.business_snapshot ?? {}) as typeof emptyBusiness;
      const snapshotCustomer = (invoice.customer_snapshot ?? {}) as typeof emptyCustomer;
      setBusiness({ ...emptyBusiness, ...snapshotBusiness });
      setCustomer({ ...emptyCustomer, ...snapshotCustomer });
      setItems(invoiceItems.length ? invoiceItems : [newLineItem()]);
      setForm({
        invoice_number: invoice.invoice_number,
        status: invoice.status,
        issue_date: invoice.issue_date ?? today(),
        due_date: invoice.due_date ?? "",
        currency: invoice.currency,
        tax_rate: Number(invoice.tax_rate),
        discount_type: invoice.discount_type,
        discount_value: Number(invoice.discount_value),
        shipping: Number(invoice.shipping),
        notes: invoice.notes ?? "",
        terms: invoice.terms ?? "",
        template: invoice.template,
        accent_color: invoice.accent_color,
        customer_id: invoice.customer_id,
      });
    } else {
      setBusiness({
        ...emptyBusiness,
        business_name: profile?.business_name ?? "",
        email: profile?.email ?? "",
        phone: profile?.phone ?? "",
        website: profile?.website ?? "",
        address: profile?.address ?? "",
        logo_url: profile?.logo_url ?? "",
        tax_number: profile?.tax_number ?? "",
      });
      setForm((current) => ({
        ...current,
        invoice_number: nextInvoiceNumber(numbers),
        currency: profile?.default_currency ?? "USD",
        tax_rate: Number(profile?.default_tax_rate ?? 0),
        notes: profile?.default_notes ?? "",
        terms: profile?.default_terms ?? "",
        template: profile?.template ?? "modern",
        accent_color: profile?.accent_color ?? "#4f46e5",
      }));
    }
    setReady(true);
  }, [bootstrap.data, ready]);

  const totals = useMemo(() => computeTotals({ ...form, items }), [form, items]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("You must be signed in");
      if (!form.invoice_number.trim()) throw new Error("Invoice number is required");

      const payload = {
        user_id: userId,
        customer_id: form.customer_id,
        invoice_number: form.invoice_number.trim(),
        status: form.status,
        issue_date: form.issue_date || today(),
        due_date: form.due_date || null,
        currency: form.currency,
        tax_rate: form.tax_rate || 0,
        discount_type: form.discount_type,
        discount_value: form.discount_value || 0,
        shipping: form.shipping || 0,
        notes: form.notes,
        terms: form.terms,
        template: form.template,
        accent_color: form.accent_color,
        subtotal: totals.subtotal,
        total: totals.total,
        business_snapshot: business,
        customer_snapshot: customer,
      };

      let id = invoiceId;
      if (id) {
        const { error } = await supabase.from("invoices").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("invoices").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }

      await supabase.from("invoice_items").delete().eq("invoice_id", id);
      const rows = items
        .filter((item) => item.description.trim() || Number(item.quantity) || Number(item.unit_price))
        .map((item, index) => ({
          invoice_id: id!,
          user_id: userId,
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          sort_order: index,
        }));
      if (rows.length) {
        const { error } = await supabase.from("invoice_items").insert(rows);
        if (error) throw error;
      }
      return id!;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries();
      toast.success(invoiceId ? "Invoice updated" : "Invoice saved");
      if (!invoiceId) navigate({ to: "/invoices/$id", params: { id } });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save invoice"),
  });

  const previewData: PreviewData = { ...form, business, customer, items };

  if (bootstrap.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (bootstrap.isError) {
    return (
      <div className="surface-card p-6 text-sm text-destructive">
        We couldn't load this invoice. Please refresh and try again.
      </div>
    );
  }

  const customers = bootstrap.data?.customers ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="no-print space-y-5">
        <Section title="Your business">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Business name">
              <Input value={business.business_name} onChange={(e) => setBusiness({ ...business, business_name: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} />
            </Field>
            <Field label="Tax / VAT number">
              <Input value={business.tax_number} onChange={(e) => setBusiness({ ...business, tax_number: e.target.value })} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea rows={2} value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} />
            </Field>
          </div>
        </Section>

        <Section title="Customer">
          {customers.length > 0 && (
            <Field label="Load a saved customer">
              <Select
                value={form.customer_id ?? "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setForm({ ...form, customer_id: null });
                    return;
                  }
                  const match = customers.find((row) => row.id === value);
                  if (match) {
                    setForm({ ...form, customer_id: match.id });
                    setCustomer({
                      name: match.name ?? "",
                      email: match.email ?? "",
                      phone: match.phone ?? "",
                      company: match.company ?? "",
                      address: match.address ?? "",
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Enter manually</SelectItem>
                  {customers.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer name">
              <Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
            </Field>
            <Field label="Company">
              <Input value={customer.company} onChange={(e) => setCustomer({ ...customer, company: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea rows={2} value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
            </Field>
          </div>
        </Section>

        <Section title="Invoice details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Invoice number">
              <Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["draft", "pending", "paid", "overdue"].map((value) => (
                    <SelectItem key={value} value={value} className="capitalize">
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Issue date">
              <Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
            </Field>
            <Field label="Due date">
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </Field>
            <Field label="Currency">
              <Select value={form.currency} onValueChange={(value) => setForm({ ...form, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        <Section
          title="Items"
          action={
            <Button variant="outline" size="sm" onClick={() => setItems([...items, newLineItem()])}>
              <Plus className="size-4" /> Add item
            </Button>
          }
        >
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      setItems(items.map((row, i) => (i === index ? { ...row, description: e.target.value } : row)))
                    }
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      setItems(items.map((row, i) => (i === index ? { ...row, quantity: Number(e.target.value) } : row)))
                    }
                  />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Price"
                    value={item.unit_price}
                    onChange={(e) =>
                      setItems(items.map((row, i) => (i === index ? { ...row, unit_price: Number(e.target.value) } : row)))
                    }
                  />
                </div>
                <div className="col-span-3 flex items-center justify-end gap-1 sm:col-span-2">
                  <span className="truncate text-sm font-medium tabular-nums">
                    {formatMoney((Number(item.quantity) || 0) * (Number(item.unit_price) || 0), form.currency)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove item"
                    onClick={() => setItems(items.length > 1 ? items.filter((_, i) => i !== index) : [newLineItem()])}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Adjustments">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tax rate (%)">
              <Input type="number" min={0} step="any" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} />
            </Field>
            <Field label="Shipping">
              <Input type="number" min={0} step="any" value={form.shipping} onChange={(e) => setForm({ ...form, shipping: Number(e.target.value) })} />
            </Field>
            <Field label="Discount type">
              <Select value={form.discount_type} onValueChange={(value) => setForm({ ...form, discount_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Discount value">
              <Input type="number" min={0} step="any" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="mt-4 space-y-1.5 rounded-lg bg-secondary p-4 text-sm">
            <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal, form.currency)} />
            <SummaryRow label="Discount" value={`-${formatMoney(totals.discount, form.currency)}`} />
            <SummaryRow label="Tax" value={formatMoney(totals.tax, form.currency)} />
            <SummaryRow label="Shipping" value={formatMoney(totals.shipping, form.currency)} />
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums text-primary">{formatMoney(totals.total, form.currency)}</span>
            </div>
          </div>
        </Section>

        <Section title="Design">
          <Field label="Template">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setForm({ ...form, template: template.id })}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-all hover:shadow-card",
                    form.template === template.id
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card",
                  )}
                >
                  <span className="block text-sm font-semibold">{template.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{template.hint}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Accent color" className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use accent ${color}`}
                  onClick={() => setForm({ ...form, accent_color: color })}
                  className={cn(
                    "size-8 rounded-full border-2 transition-transform hover:scale-110",
                    form.accent_color === color ? "border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <Input
                type="color"
                value={form.accent_color}
                onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                className="h-9 w-14 p-1"
              />
            </div>
          </Field>
        </Section>

        <Section title="Notes & terms">
          <div className="grid gap-3">
            <Field label="Notes">
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Thanks for your business!" />
            </Field>
            <Field label="Terms">
              <Textarea rows={3} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} placeholder="Payment due within 14 days." />
            </Field>
          </div>
        </Section>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {invoiceId ? "Save changes" : "Save invoice"}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Print / Download PDF
          </Button>
        </div>
      </div>

      <div className="xl:sticky xl:top-24 xl:h-fit">
        <p className="no-print mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Live preview
        </p>
        <InvoicePreview data={previewData} />
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
