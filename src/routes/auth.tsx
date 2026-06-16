import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [resending, setResending] = useState(false);

  // Where Supabase should send users after they click the email link.
  const emailRedirectTo = `${window.location.origin}/`;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo, data: { full_name: name } },
        });
        if (error) throw error;

        // When email confirmation is required, Supabase returns a user but
        // no session. Tell the user to go check their inbox instead of
        // silently dropping them on a page they can't access yet.
        if (!data.session) {
          setConfirmSent(true);
          return;
        }
        toast.success("Welcome to the team! 🌸");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Hi there ✨");
      }
      router.invalidate();
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  async function handleResend() {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo },
      });
      if (error) throw error;
      toast.success("Confirmation email sent again 📬");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't resend email");
    } finally { setResending(false); }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: emailRedirectTo });
    if (result.error) { toast.error("Google sign-in failed"); return; }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  // Landing Page
  if (!showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lavender/20 via-peach/10 to-mint/20 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-lavender/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-peach/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-mint/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-2xl text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <div className="text-7xl mb-4 animate-bounce">🌸</div>
            <h1 className="text-5xl md:text-6xl font-bold font-display">
              <span className="bg-gradient-to-r from-primary via-peach to-mint bg-clip-text text-transparent">
                Bloom
              </span>
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-foreground">
              Internal Merantix Event & Content Management Calendar
            </p>
          </div>

          {/* Description */}
          <div className="space-y-4 max-w-xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed">
              ✨ Your unified workspace for events, content, and community management
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div className="paper-card p-4 rounded-2xl">
                <div className="text-3xl mb-2">🗓️</div>
                <p className="text-sm font-semibold">Event Planning</p>
              </div>
              <div className="paper-card p-4 rounded-2xl">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-sm font-semibold">Content Calendar</p>
              </div>
              <div className="paper-card p-4 rounded-2xl">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-sm font-semibold">Community Hub</p>
              </div>
              <div className="paper-card p-4 rounded-2xl">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm font-semibold">Analytics</p>
              </div>
              <div className="paper-card p-4 rounded-2xl">
                <div className="text-3xl mb-2">💡</div>
                <p className="text-sm font-semibold">Brainstorm</p>
              </div>
              <div className="paper-card p-4 rounded-2xl">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-sm font-semibold">Task Mgmt</p>
              </div>
            </div>
          </div>

          {/* Features Highlight */}
          <div className="space-y-4 py-4">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">What You Get</p>
            <div className="space-y-2 text-left max-w-md mx-auto">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="text-muted-foreground">Comprehensive event management with full details</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="text-muted-foreground">Social media content scheduling & automation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="text-muted-foreground">Guest database with engagement tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="text-muted-foreground">Real-time collaboration & team coordination</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="text-muted-foreground">Event analytics & post-event intelligence</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              onClick={() => setShowAuth(true)}
              size="lg"
              className="rounded-full px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition"
            >
              Get Started 🚀
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Sign in or create an account to access Bloom
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Auth Page
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {confirmSent ? (
          <div className="paper-card p-8 text-center">
            <div className="text-5xl mb-3">📬</div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-foreground">{email}</span>. Click it to
              activate your account — you'll be taken straight to your dashboard.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Can't find it? Check your spam folder, or resend the link below.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={handleResend} disabled={resending} className="w-full rounded-full" size="lg">
                {resending ? "Sending…" : "Resend confirmation email"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setConfirmSent(false); setMode("signin"); }}
                className="w-full rounded-full"
                size="lg"
              >
                Back to sign in
              </Button>
            </div>
          </div>
        ) : (
        <>
        <button
          onClick={() => setShowAuth(false)}
          className="mb-4 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Back
        </button>
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🌷</div>
          <h1 className="text-4xl font-bold">Bloom</h1>
          <p className="text-muted-foreground mt-1">Your team's pastel events hub</p>
        </div>
        <div className="paper-card p-8">
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-full">
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${mode === m ? "bg-card shadow-soft" : "text-muted-foreground"}`}>
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lila from marketing" required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full" size="lg">
              {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" onClick={handleGoogle} className="w-full rounded-full" size="lg">
            Continue with Google
          </Button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
