import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/invoices/new", label: "Create Invoice", icon: FilePlus2 },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/business", label: "Business Profile", icon: Building2 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
        <FileText className="size-4" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        Invoice<span className="text-primary">Pro</span>
      </span>
    </span>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.to || (item.to !== "/invoices/new" && pathname.startsWith(`${item.to}/`));
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              active
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <Link to="/dashboard" className="px-1">
          <Logo />
        </Link>
        <div className="mt-7 flex-1">
          <NavList />
        </div>
        <Button variant="ghost" className="justify-start text-muted-foreground" onClick={signOut}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </aside>

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-5">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Logo />
                <div className="mt-6">
                  <NavList onNavigate={() => setOpen(false)} />
                </div>
                <Button variant="ghost" className="mt-4 w-full justify-start" onClick={signOut}>
                  <LogOut className="size-4" /> Sign out
                </Button>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold tracking-tight">{title}</h1>
              {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
