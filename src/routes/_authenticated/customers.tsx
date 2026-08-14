import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mail, Phone, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "Customers — InvoicePro" },
      { name: "description", content: "Keep client details on file so every new invoice fills itself in." },
      { property: "og:title", content: "Customers — InvoicePro" },
      { property: "og:description", content: "Keep client details on file for faster invoicing." },
    ],
  }),
  component: CustomersPage,
});

const empty = { id: "", name: "", email: "", phone: "", company: "", address: "", notes: "" };

function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ ...empty });

  const customers = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not signed in");
      if (!draft.name.trim()) throw new Error("Customer name is required");
      const payload = {
        user_id: userId,
        name: draft.name.trim(),
        email: draft.email,
        phone: draft.phone,
        company: draft.company,
        address: draft.address,
        notes: draft.notes,
      };
      if (draft.id) {
        const { error } = await supabase.from("customers").update(payload).eq("id", draft.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(draft.id ? "Customer updated" : "Customer added");
      setOpen(false);
      setDraft({ ...empty });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save customer"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer removed");
    },
    onError: () => toast.error("Could not remove customer"),
  });

  const rows = (customers.data ?? []).filter((row) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [row.name, row.email, row.company].some((value) => (value ?? "").toLowerCase().includes(query));
  });

  return (
    <AppShell
      title="Customers"
      description="Your client directory"
      actions={
        <Button
          size="sm"
          onClick={() => {
            setDraft({ ...empty });
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Add customer
        </Button>
      }
    >
      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customers"
          className="pl-9"
        />
      </div>

      {customers.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : customers.isError ? (
        <p className="surface-card p-6 text-sm text-destructive">We couldn't load your customers. Please refresh.</p>
      ) : rows.length === 0 ? (
        <div className="surface-card px-6 py-14 text-center">
          <UserPlus className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">No customers yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a customer once and reuse them on any invoice.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div key={row.id} className="surface-card p-5 transition-shadow hover:shadow-lift">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.name}</p>
                  {row.company && <p className="truncate text-xs text-muted-foreground">{row.company}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${row.name}`}
                  onClick={() => remove.mutate(row.id)}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {row.email && (
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="size-3.5" /> {row.email}
                  </p>
                )}
                {row.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="size-3.5" /> {row.phone}
                  </p>
                )}
                {row.address && <p className="whitespace-pre-line text-xs">{row.address}</p>}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => {
                  setDraft({
                    id: row.id,
                    name: row.name ?? "",
                    email: row.email ?? "",
                    phone: row.phone ?? "",
                    company: row.company ?? "",
                    address: row.address ?? "",
                    notes: row.notes ?? "",
                  });
                  setOpen(true);
                }}
              >
                Edit details
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit customer" : "Add customer"}</DialogTitle>
            <DialogDescription>Saved customers can be loaded into any invoice instantly.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cemail">Email</Label>
              <Input id="cemail" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cphone">Phone</Label>
              <Input id="cphone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="caddress">Address</Label>
              <Textarea id="caddress" rows={2} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cnotes">Notes</Label>
              <Textarea id="cnotes" rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              Save customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
