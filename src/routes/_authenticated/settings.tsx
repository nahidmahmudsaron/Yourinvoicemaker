import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — InvoicePro" },
      { name: "description", content: "Manage your InvoicePro account name, appearance and session." },
      { property: "og:title", content: "Settings — InvoicePro" },
      { property: "og:description", content: "Manage your account name, appearance and session." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");

  const account = useQuery({
    queryKey: ["account"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return { email: auth.user?.email ?? "", profile: data };
    },
  });

  useEffect(() => {
    if (account.data?.profile) setFullName(account.data.profile.full_name ?? "");
  }, [account.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, full_name: fullName }, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
      toast.success("Settings saved");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save settings"),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell
      title="Settings"
      description="Your account and app preferences"
      actions={
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
        </Button>
      }
    >
      {account.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <div className="grid max-w-3xl gap-5">
          <section className="surface-card space-y-4 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Account</h2>
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={account.data?.email ?? ""} readOnly disabled />
            </div>
          </section>

          <section className="surface-card flex items-center justify-between gap-4 p-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Appearance</h2>
              <p className="mt-1 text-sm text-muted-foreground">Switch between light and dark mode.</p>
            </div>
            <ThemeToggle />
          </section>

          <section className="surface-card flex items-center justify-between gap-4 p-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Session</h2>
              <p className="mt-1 text-sm text-muted-foreground">Sign out of InvoicePro on this device.</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </section>
        </div>
      )}
    </AppShell>
  );
}
