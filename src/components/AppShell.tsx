import { Link, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Lightbulb, FileText, LogOut, Flower2, Users, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Dashboard", icon: Home, sticker: "🏠" },
  { to: "/events", label: "Events", icon: Calendar, sticker: "🗓️" },
  { to: "/content", label: "Content", icon: FileText, sticker: "📝" },
  { to: "/guests", label: "Guests", icon: Users, sticker: "👥" },
  { to: "/ideas", label: "Ideas", icon: Lightbulb, sticker: "💡" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["me-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return { user: u.user, profile: data };
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.profile?.display_name || profile?.user?.email || "?")
    .split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 flex-col p-5 gap-2 border-r border-border bg-sidebar/60 backdrop-blur">
        <Link to="/events" className="flex items-center gap-2 px-2 py-3 mb-2">
          <Flower2 className="w-7 h-7 text-primary" />
          <span className="text-2xl font-bold font-display">Bloom</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-primary text-primary-foreground shadow-soft" : "hover:bg-sidebar-accent text-sidebar-foreground"
                }`}>
                <span className="text-lg">{item.sticker}</span>
                <Icon className="w-4 h-4 opacity-70" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto paper-card p-3 flex items-center gap-3">
          <Avatar className="w-9 h-9"><AvatarFallback className="bg-peach text-peach-ink">{initials}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{profile?.profile?.display_name || "You"}</div>
            <div className="text-xs text-muted-foreground truncate">{profile?.user?.email}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out"><LogOut className="w-4 h-4" /></Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur flex justify-around py-2">
        {NAV.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to}
              className={`flex flex-col items-center px-3 py-1.5 rounded-2xl text-xs font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
              <span className="text-lg">{item.sticker}</span>{item.label}
            </Link>
          );
        })}
      </div>

      <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
