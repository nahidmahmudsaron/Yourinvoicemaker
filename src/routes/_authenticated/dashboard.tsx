import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FilePlus2,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — InvoicePro" },
      { name: "description", content: "Track paid, pending and overdue invoices at a glance." },
      { property: "og:title", content: "Dashboard — InvoicePro" },
      { property: "og:description", content: "Track paid, pending and overdue invoices at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const invoices = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const rows = invoices.data ?? [];

  const stats = useMemo(() => {
    const sum = (list: typeof rows) => list.reduce((total, row) => total + Number(row.total || 0), 0);
    return {
      total: rows.length,
      totalValue: sum(rows),
      paid: rows.filter((row) => row.status === "paid"),
      pending: rows.filter((row) => row.status === "pending"),
      overdue: rows.filter((row) => row.status === "overdue"),
      sum,
    };
  }, [rows]);

  const filtered = rows.filter((row) => {
    const matchesStatus = status === "all" || row.status === status;
    const name = ((row.customer_snapshot ?? {}) as { name?: string }).name ?? "";
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query || row.invoice_number.toLowerCase().includes(query) || name.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <AppShell
      title="Dashboard"
      description="Your invoicing at a glance"
      actions={
        <Button asChild size="sm">
          <Link to="/invoices/new">
            <FilePlus2 className="size-4" /> Create Invoice
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total invoices"
          value={String(stats.total)}
          sub={formatMoney(stats.totalValue)}
          icon={FileText}
          tone="text-primary bg-accent"
        />
        <StatCard
          label="Paid"
          value={String(stats.paid.length)}
          sub={formatMoney(stats.sum(stats.paid))}
          icon={CheckCircle2}
          tone="text-success bg-success/12"
        />
        <StatCard
          label="Pending"
          value={String(stats.pending.length)}
          sub={formatMoney(stats.sum(stats.pending))}
          icon={Clock}
          tone="text-warning bg-warning/15"
        />
        <StatCard
          label="Overdue"
          value={String(stats.overdue.length)}
          sub={formatMoney(stats.sum(stats.overdue))}
          icon={AlertTriangle}
          tone="text-destructive bg-destructive/12"
        />
      </div>

      <section className="surface-card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <h2 className="mr-auto text-sm font-bold">Recent invoices</h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoices"
              className="w-full pl-9 sm:w-56"
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
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold">No invoices yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first invoice — it takes less than a minute.
            </p>
            <Button asChild className="mt-4">
              <Link to="/invoices/new">
                <FilePlus2 className="size-4" /> Create Invoice
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.slice(0, 8).map((row) => {
              const name = ((row.customer_snapshot ?? {}) as { name?: string }).name || "No customer";
              return (
                <li key={row.id}>
                  <Link
                    to="/invoices/$id"
                    params={{ id: row.id }}
                    className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{row.invoice_number}</p>
                      <p className="truncate text-xs text-muted-foreground">{name}</p>
                    </div>
                    <p className="hidden text-xs text-muted-foreground sm:block">Due {formatDate(row.due_date)}</p>
                    <StatusBadge status={row.status} />
                    <p className="w-24 text-right text-sm font-bold tabular-nums">
                      {formatMoney(Number(row.total), row.currency)}
                    </p>
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <div className="surface-card p-5 transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={`grid size-9 place-items-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
