import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, ExternalLink, FilePlus2, Loader2, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatMoney } from "@/lib/invoice";

export const Route = createFileRoute("/_authenticated/invoices/")({
  head: () => ({
    meta: [
      { title: "Invoices — InvoicePro" },
      { name: "description", content: "Search, filter, duplicate and share every invoice you've created." },
      { property: "og:title", content: "Invoices — InvoicePro" },
      { property: "og:description", content: "Search, filter, duplicate and share every invoice you've created." },
    ],
  }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const invoices = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted");
    },
    onError: () => toast.error("Could not delete invoice"),
  });

  const duplicate = useMutation({
    mutationFn: async (id: string) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not signed in");
      const [source, items, all] = await Promise.all([
        supabase.from("invoices").select("*").eq("id", id).single(),
        supabase.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order"),
        supabase.from("invoices").select("invoice_number"),
      ]);
      if (source.error) throw source.error;
      const numbers = (all.data ?? []).map((row) => row.invoice_number);
      const base = source.data.invoice_number;
      let candidate = `${base}-COPY`;
      let counter = 2;
      while (numbers.includes(candidate)) {
        candidate = `${base}-COPY${counter}`;
        counter += 1;
      }
      const { id: _id, created_at: _created, updated_at: _updated, public_token: _token, is_public: _pub, ...rest } = source.data;
      const { data: inserted, error } = await supabase
        .from("invoices")
        .insert({ ...rest, user_id: userId, invoice_number: candidate, status: "draft", is_public: false })
        .select("id")
        .single();

      if (error) throw error;
      const rows = (items.data ?? []).map((item, index) => ({
        invoice_id: inserted.id,
        user_id: userId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        sort_order: index,
      }));
      if (rows.length) await supabase.from("invoice_items").insert(rows);
      return inserted.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice duplicated");
    },
    onError: () => toast.error("Could not duplicate invoice"),
  });

  const rows = (invoices.data ?? []).filter((row) => {
    const matchesStatus = status === "all" || row.status === status;
    const name = ((row.customer_snapshot ?? {}) as { name?: string }).name ?? "";
    const query = search.trim().toLowerCase();
    return (
      matchesStatus &&
      (!query || row.invoice_number.toLowerCase().includes(query) || name.toLowerCase().includes(query))
    );
  });

  async function copyLink(id: string, token: string) {
    const url = `${window.location.origin}/i/${token}`;
    const { error } = await supabase.from("invoices").update({ is_public: true }).eq("id", id);
    if (error) {
      toast.error("Could not enable the share link");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Public link copied — this invoice is now shared");
    } catch {
      toast.error("Copy failed — link: " + url);
    }
  }


  return (
    <AppShell
      title="Invoices"
      description="Everything you've billed"
      actions={
        <Button asChild size="sm">
          <Link to="/invoices/new">
            <FilePlus2 className="size-4" /> New
          </Link>
        </Button>
      }
    >
      <div className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by number or customer"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {invoices.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : invoices.isError ? (
          <p className="p-6 text-sm text-destructive">We couldn't load your invoices. Please refresh.</p>
        ) : rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Invoices you create will show up in this list.</p>
            <Button asChild className="mt-4">
              <Link to="/invoices/new">
                <FilePlus2 className="size-4" /> Create Invoice
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Invoice</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Issued</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Due</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3 font-semibold">
                      <Link to="/invoices/$id" params={{ id: row.id }} className="hover:text-primary">
                        {row.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {((row.customer_snapshot ?? {}) as { name?: string }).name || "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {formatDate(row.issue_date)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{formatDate(row.due_date)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {formatMoney(Number(row.total), row.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Invoice actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/invoices/$id" params={{ id: row.id }}>
                              <Pencil className="size-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicate.mutate(row.id)}>
                            <Copy className="size-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyLink(row.id, row.public_token)}>
                            <ExternalLink className="size-4" /> Copy share link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => remove.mutate(row.id)}
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
