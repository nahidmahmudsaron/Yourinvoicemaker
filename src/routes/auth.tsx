import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — InvoicePro" },
      { name: "description", content: "Log in or create your free InvoicePro account to start invoicing." },
      { property: "og:title", content: "Sign in — InvoicePro" },
      { property: "og:description", content: "Log in or create your free InvoicePro account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, business_name: businessName },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created");
          navigate({ to: "/dashboard", replace: true });
        } else {
          setEmailSent(true);
          toast.success("Check your email to confirm your account");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="hero-gradient flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-14">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Logo />
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "Sign in to manage your invoices." : "Create your account — it takes 20 seconds."}
            </p>
          </div>

          <div className="surface-card p-6 shadow-lift">
            {emailSent ? (
              <div className="space-y-3 text-center">
                <h2 className="text-lg font-bold">Confirm your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click it
                  to activate your InvoicePro account.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setEmailSent(false)}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "signup")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Log in</TabsTrigger>
                    <TabsTrigger value="signup">Sign up</TabsTrigger>
                  </TabsList>
                </Tabs>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  {mode === "signup" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName">Your name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          placeholder="Alex Morgan"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="businessName">Business</Label>
                        <Input
                          id="businessName"
                          value={businessName}
                          onChange={(event) => setBusinessName(event.target.value)}
                          placeholder="Morgan Studio"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {mode === "login" ? "Log in" : "Create account"}
                  </Button>
                </form>

                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
                </div>

                <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={loading}>
                  <GoogleIcon /> Continue with Google
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2a7 7 0 0 1-6.6-4.8h-4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.5a7.2 7.2 0 0 1 0-4.6V6.8h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.4 6.8l4 3.1A7 7 0 0 1 12 4.8Z"
      />
    </svg>
  );
}
